/**
 * Report Service
 * Generates a colorful, graph-rich weekly "Codebase Analyzer" PDF report and
 * delivers it via email (Gmail SMTP).
 *
 * Visual system: multi-accent analytics theme — each page carries its own accent
 * (teal / blue / purple / orange / red) over a shared neutral base, with a
 * reusable vector chart toolkit (gauge ring, donut, radar, area line, stacked
 * bar, horizontal score bars, colored activity heat-strip).
 *
 * The rendering layer is separated from data-fetching:
 *   - generatePDFReport(userId)      → fetches REAL data, then calls renderReportDocument()
 *   - renderReportDocument(input)    → pure PDFKit rendering (also used by the offline preview harness)
 */

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const emailService = require('./emailService');
const { collections } = require('../config/firebase');
const GitHubService = require('./githubService');
const { getActiveGithubToken } = require('./githubAccessService');
const { getGroqService } = require('./groqService');

class ReportService {
    constructor() {
        // Resolve the logo across local/monorepo/Render layouts — first existing wins.
        const candidates = [
            path.resolve(__dirname, '../../../client/public/DevTrack.png'),   // repo: server/src/services -> DevTrack/client/public
            path.resolve(__dirname, '../../public/DevTrack.png'),             // server/public
            path.resolve(__dirname, '../../assets/DevTrack.png'),             // server/assets
            path.resolve(__dirname, '../../../../client/public/DevTrack.png'),// fallback (older layout)
        ];
        this.logoPath = candidates.find(p => fs.existsSync(p)) || candidates[0];
    }

    // ─── Multi-accent analytics palette ──────────────────────────────────────────
    colors = {
        // Per-page accents
        teal: '#14B8A6',
        blue: '#3B82F6',
        purple: '#8B5CF6',
        orange: '#F97316',
        pink: '#EC4899',
        indigo: '#6366F1',

        // Semantic
        success: '#10B981',
        successLight: '#D1FAE5',
        warning: '#F59E0B',
        warningLight: '#FEF3C7',
        danger: '#EF4444',
        dangerLight: '#FEE2E2',

        // Neutrals
        ink: '#0F172A',        // headings / darkest
        text: '#1E293B',       // body text
        textLight: '#475569',  // secondary text
        muted: '#94A3B8',      // labels / hints
        line: '#E2E8F0',       // borders
        track: '#EEF2F7',      // chart track / empty cells
        tintBg: '#F8FAFC',     // soft card backgrounds
        white: '#FFFFFF',
    };

    // Categorical palette for donuts / stacked segments (languages, commit types)
    categorical = ['#3B82F6', '#8B5CF6', '#14B8A6', '#F97316', '#EC4899', '#22C55E', '#EAB308'];

    /** Accent color for a given 0-based page index. */
    pageAccent(i) {
        const seq = [this.colors.teal, this.colors.blue, this.colors.purple, this.colors.orange, this.colors.danger, this.colors.indigo];
        return seq[i] ?? this.colors.teal;
    }

    // ─── Color math helpers ──────────────────────────────────────────────────────
    _hexToRgb(hex) {
        const h = String(hex).replace('#', '');
        return { r: parseInt(h.substr(0, 2), 16), g: parseInt(h.substr(2, 2), 16), b: parseInt(h.substr(4, 2), 16) };
    }
    _rgbToHex({ r, g, b }) {
        const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
        return `#${c(r)}${c(g)}${c(b)}`;
    }
    /** Linear blend between two hex colors. t=0 → a, t=1 → b. */
    mix(a, b, t) {
        const A = this._hexToRgb(a), B = this._hexToRgb(b);
        return this._rgbToHex({ r: A.r + (B.r - A.r) * t, g: A.g + (B.g - A.g) * t, b: A.b + (B.b - A.b) * t });
    }
    /** Light tint of a color over white (for soft backgrounds). */
    tint(hex, amount = 0.12) { return this.mix(this.colors.white, hex, amount); }

    // ─── Geometry helpers ────────────────────────────────────────────────────────
    /** Point on a circle. Angle in degrees, measured clockwise from 12 o'clock. */
    _arcPoint(cx, cy, r, deg) {
        const rad = (deg * Math.PI) / 180;
        return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
    }
    /** Stroke an open arc (used for gauges / rings). */
    _strokeArc(doc, cx, cy, r, startDeg, endDeg, color, thickness) {
        const steps = Math.max(2, Math.ceil(Math.abs(endDeg - startDeg) / 4));
        const p0 = this._arcPoint(cx, cy, r, startDeg);
        doc.moveTo(p0.x, p0.y);
        for (let i = 1; i <= steps; i++) {
            const a = startDeg + ((endDeg - startDeg) * i) / steps;
            const p = this._arcPoint(cx, cy, r, a);
            doc.lineTo(p.x, p.y);
        }
        doc.lineWidth(thickness).lineCap('round').strokeColor(color).stroke();
    }
    _num(v, fallback = 0) { const n = Number(v); return Number.isFinite(n) ? n : fallback; }

    /** Small vector triangle/dash — used instead of Unicode arrows (Helvetica is WinAnsi-only). */
    _triangle(doc, cx, cy, size, dir, color) {
        if (dir === 'flat') { doc.rect(cx - size, cy - 1, size * 2, 2).fill(color); return; }
        const up = dir === 'up';
        doc.moveTo(cx, up ? cy - size : cy + size);
        doc.lineTo(cx - size, up ? cy + size : cy - size);
        doc.lineTo(cx + size, up ? cy + size : cy - size);
        doc.closePath().fill(color);
    }
    /** Strip non-Latin-1 glyphs (arrows/emoji) that Helvetica can't encode. */
    _ascii(str) { return String(str ?? '').replace(/[^\x20-\xFF]/g, '').replace(/\s+/g, ' ').trim(); }

    // ─── Achievement badge medallions (vector — premium, font-independent) ───────
    _star(doc, cx, cy, outer, inner, points, color) {
        const pts = [];
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outer : inner;
            const ang = (i * (180 / points) - 90) * Math.PI / 180;
            pts.push([cx + r * Math.cos(ang), cy + r * Math.sin(ang)]);
        }
        doc.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) doc.lineTo(pts[i][0], pts[i][1]);
        doc.closePath().fill(color);
    }
    _glyph(doc, kind, cx, cy, s, color) {
        switch (kind) {
            case 'crown': {
                const w = s * 1.5, h = s * 1.1, x0 = cx - w / 2, x1 = cx + w / 2, top = cy - h / 2, bot = cy + h / 2;
                doc.moveTo(x0, bot).lineTo(x0, top).lineTo(cx - w / 4, cy).lineTo(cx, top)
                    .lineTo(cx + w / 4, cy).lineTo(x1, top).lineTo(x1, bot).closePath().fill(color);
                doc.rect(x0, bot - 1, w, 2.5).fill(color);
                break;
            }
            case 'shield': {
                const w = s * 1.35, h = s * 1.6;
                doc.moveTo(cx - w / 2, cy - h / 2).lineTo(cx + w / 2, cy - h / 2).lineTo(cx + w / 2, cy + h / 8)
                    .lineTo(cx, cy + h / 2).lineTo(cx - w / 2, cy + h / 8).closePath().fill(color);
                break;
            }
            case 'bolt': {
                const w = s * 1.1, h = s * 1.7;
                doc.moveTo(cx - w * 0.08, cy - h / 2).lineTo(cx - w / 2, cy + h * 0.1).lineTo(cx - w * 0.05, cy + h * 0.1)
                    .lineTo(cx + w * 0.08, cy + h / 2).lineTo(cx + w / 2, cy - h * 0.1).lineTo(cx + w * 0.05, cy - h * 0.1)
                    .closePath().fill(color);
                break;
            }
            case 'star':
            default:
                this._star(doc, cx, cy, s * 0.95, s * 0.42, 5, color);
        }
    }
    /** A ribboned gradient medal coin with a centered glyph. */
    drawBadgeMedal(doc, cx, cy, r, color, kind) {
        // soft shadow
        doc.circle(cx, cy + 1.5, r).fillOpacity(0.12).fill(this.colors.ink).fillOpacity(1);
        // ribbon tails (behind coin)
        const ribbon = this.mix(color, this.colors.ink, 0.3);
        doc.moveTo(cx - r * 0.5, cy + r * 0.3).lineTo(cx - r * 0.72, cy + r * 1.7).lineTo(cx - r * 0.15, cy + r * 1.25).lineTo(cx + r * 0.05, cy + r * 0.6).closePath().fill(ribbon);
        doc.moveTo(cx + r * 0.5, cy + r * 0.3).lineTo(cx + r * 0.72, cy + r * 1.7).lineTo(cx + r * 0.15, cy + r * 1.25).lineTo(cx - r * 0.05, cy + r * 0.6).closePath().fill(ribbon);
        // coin with radial sheen
        const g = doc.radialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
        g.stop(0, this.mix(color, this.colors.white, 0.62)).stop(1, color);
        doc.circle(cx, cy, r).fill(g);
        doc.circle(cx, cy, r).lineWidth(1.5).strokeColor(this.mix(color, this.colors.ink, 0.3)).stroke();
        doc.circle(cx, cy, r * 0.74).lineWidth(0.8).strokeColor(this.mix(color, this.colors.white, 0.45)).stroke();
        // glyph
        this._glyph(doc, kind, cx, cy, r * 0.58, this.colors.white);
    }
    /** Map a badge to its medal style (glyph + color). */
    badgeStyle(b) {
        const id = String(b?.id || '').toLowerCase();
        const name = String(b?.name || '').toLowerCase();
        if (id.includes('century') || name.includes('commit')) return { kind: 'crown', color: '#F59E0B' };   // gold
        if (id.includes('pr') || name.includes('pr ') || name.includes('master')) return { kind: 'bolt', color: '#3B82F6' };
        if (id.includes('community') || name.includes('leader') || name.includes('community')) return { kind: 'star', color: '#8B5CF6' };
        if (id.includes('ninja') || name.includes('ninja')) return { kind: 'shield', color: '#14B8A6' };
        if (name.includes('star') || id.includes('star')) return { kind: 'star', color: '#EAB308' };
        return { kind: 'star', color: this.colors.indigo };
    }

    // ─── UI atoms ────────────────────────────────────────────────────────────────

    /** Full-width gradient header band with logo + title. */
    drawGradientHeader(doc, title, subtitle, accent) {
        const W = doc.page.width;
        const grad = doc.linearGradient(0, 0, W, 104);
        grad.stop(0, this.mix(accent, this.colors.ink, 0.15)).stop(1, this.mix(accent, this.colors.ink, 0.62));
        doc.rect(0, 0, W, 104).fill(grad);
        // accent underline
        doc.rect(0, 104, W, 3).fill(accent);

        if (fs.existsSync(this.logoPath)) {
            try { doc.image(this.logoPath, 50, 28, { width: 46 }); } catch { /* ignore */ }
        }
        doc.font('Helvetica-Bold').fontSize(22).fillColor(this.colors.white).text('DevTrack', 108, 32);
        doc.font('Helvetica').fontSize(11).fillColor(this.mix(accent, this.colors.white, 0.75))
            .text(title, 108, 62);
        doc.font('Helvetica').fontSize(9).fillColor(this.mix(accent, this.colors.white, 0.85))
            .text(String(subtitle || ''), W - 230, 44, { width: 180, align: 'right' });
        // small "codebase analyzer" eyebrow
        doc.font('Helvetica-Bold').fontSize(7).fillColor(this.mix(accent, this.colors.white, 0.6))
            .text('CODEBASE INTELLIGENCE', W - 230, 70, { width: 180, align: 'right', characterSpacing: 1 });
    }

    /** Card with optional accent strip + tinted title bar. Returns content Y. */
    drawCard(doc, x, y, w, h, opts = {}) {
        const { title, accent, subtitle } = opts;
        doc.roundedRect(x, y, w, h, 8).fill(this.colors.white);
        doc.roundedRect(x, y, w, h, 8).lineWidth(1).strokeColor(this.colors.line).stroke();
        if (accent) {
            // left accent strip
            doc.save();
            doc.roundedRect(x, y, w, h, 8).clip();
            doc.rect(x, y, 4, h).fill(accent);
            doc.restore();
        }
        let cy = y + 14;
        const padX = x + (accent ? 16 : 14);
        if (title) {
            doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.ink).text(title, padX, cy);
            cy += 16;
        }
        if (subtitle) {
            doc.font('Helvetica').fontSize(8).fillColor(this.colors.muted).text(subtitle, padX, cy);
            cy += 13;
        }
        return cy;
    }

    /** Colored delta indicator (vector triangle + value). */
    drawDelta(doc, x, y, delta) {
        if (delta === undefined || delta === null || delta === '') return;
        const s = this._ascii(delta);
        const isPos = s.startsWith('+');
        const isNeg = s.startsWith('-');
        const col = isPos ? this.colors.success : isNeg ? this.colors.danger : this.colors.muted;
        const dir = isPos ? 'up' : isNeg ? 'down' : 'flat';
        this._triangle(doc, x + 3, y + 5, 3.2, dir, col);
        doc.font('Helvetica-Bold').fontSize(8).fillColor(col).text(s.replace(/^[+\-]/, ''), x + 11, y);
    }

    /** Small filled pill with centered label. */
    drawPill(doc, x, y, w, h, label, bg, fg) {
        doc.roundedRect(x, y, w, h, h / 2).fill(bg);
        doc.font('Helvetica-Bold').fontSize(7).fillColor(fg)
            .text(String(label).toUpperCase(), x, y + (h - 7) / 2, { width: w, align: 'center', characterSpacing: 0.5 });
    }

    // ─── Charts ──────────────────────────────────────────────────────────────────

    /** 7-day activity heat-strip with accent intensity ramp. */
    drawHeatStrip(doc, x, y, w, days, accent) {
        const n = Math.max(days.length, 1);
        const gap = 4;
        const cellW = (w - gap * (n - 1)) / n;
        const maxCount = Math.max(...days.map(d => this._num(d.count)), 1);
        days.forEach((d, i) => {
            const cx = x + i * (cellW + gap);
            const count = this._num(d.count);
            const intensity = count / maxCount;
            const fill = count === 0 ? this.colors.track : this.mix(this.tint(accent, 0.25), accent, intensity);
            const fg = intensity > 0.45 || count === 0 ? (count === 0 ? this.colors.muted : this.colors.white) : this.mix(accent, this.colors.ink, 0.7);
            doc.roundedRect(cx, y, cellW, 38, 5).fill(fill);
            doc.font('Helvetica-Bold').fontSize(7).fillColor(count === 0 ? this.colors.muted : fg)
                .text(String(d.dayName || ''), cx, y + 6, { width: cellW, align: 'center' });
            doc.font('Helvetica-Bold').fontSize(11).fillColor(count === 0 ? this.colors.muted : fg)
                .text(String(count), cx, y + 18, { width: cellW, align: 'center' });
        });
        return y + 38;
    }

    /** Open gauge ring (≈270°) with centered value. */
    drawGaugeRing(doc, cx, cy, r, value, accent, opts = {}) {
        const { max = 100, thickness = 16, label = 'SCORE', big = true } = opts;
        const startDeg = 225, sweep = 270;
        const frac = Math.max(0, Math.min(1, this._num(value) / max));
        this._strokeArc(doc, cx, cy, r, startDeg, startDeg + sweep, this.colors.track, thickness);
        if (frac > 0) this._strokeArc(doc, cx, cy, r, startDeg, startDeg + sweep * frac, accent, thickness);
        doc.lineCap('butt');
        doc.font('Helvetica-Bold').fontSize(big ? 38 : 22).fillColor(this.colors.ink)
            .text(String(Math.round(this._num(value))), cx - r, cy - (big ? 26 : 16), { width: r * 2, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(8).fillColor(this.colors.muted)
            .text(String(label).toUpperCase(), cx - r, cy + (big ? 16 : 8), { width: r * 2, align: 'center', characterSpacing: 1 });
    }

    /** Donut chart from segments [{label, value, color}] + optional center text. Draws legend to the right. */
    drawDonut(doc, cx, cy, r, segments, opts = {}) {
        const { innerRatio = 0.62, centerLabel, centerSub, legendX, legendY } = opts;
        const segs = (segments || []).filter(s => this._num(s.value) > 0);
        const total = segs.reduce((s, x) => s + this._num(x.value), 0) || 1;

        if (segs.length === 0) {
            doc.circle(cx, cy, r).fill(this.colors.track);
            doc.circle(cx, cy, r * innerRatio).fill(this.colors.white);
        } else {
            let start = 0;
            segs.forEach(seg => {
                const sweep = (this._num(seg.value) / total) * 360;
                const steps = Math.max(2, Math.ceil(sweep / 6));
                doc.moveTo(cx, cy);
                for (let i = 0; i <= steps; i++) {
                    const p = this._arcPoint(cx, cy, r, start + (sweep * i) / steps);
                    doc.lineTo(p.x, p.y);
                }
                doc.closePath().fill(seg.color);
                start += sweep;
            });
            doc.circle(cx, cy, r * innerRatio).fill(this.colors.white);
        }

        if (centerLabel !== undefined) {
            doc.font('Helvetica-Bold').fontSize(16).fillColor(this.colors.ink)
                .text(String(centerLabel), cx - r, cy - 12, { width: r * 2, align: 'center' });
        }
        if (centerSub !== undefined) {
            doc.font('Helvetica').fontSize(7).fillColor(this.colors.muted)
                .text(String(centerSub), cx - r, cy + 6, { width: r * 2, align: 'center' });
        }

        // Legend
        const lx = legendX ?? cx + r + 24;
        let ly = legendY ?? cy - segs.length * 9;
        segs.forEach(seg => {
            const pct = Math.round((this._num(seg.value) / total) * 100);
            doc.roundedRect(lx, ly + 1, 9, 9, 2).fill(seg.color);
            doc.font('Helvetica-Bold').fontSize(8).fillColor(this.colors.text).text(String(seg.label), lx + 15, ly);
            doc.font('Helvetica').fontSize(8).fillColor(this.colors.muted).text(`${pct}%`, lx + 15, ly, { width: 120, align: 'right' });
            ly += 17;
        });
    }

    /** Radar / spider chart. axes = [{label, score 0-100}]. */
    drawRadar(doc, cx, cy, r, axes, accent) {
        const n = (axes || []).length;
        if (n < 3) return;
        // grid rings
        [0.25, 0.5, 0.75, 1].forEach(t => {
            const pts = axes.map((_, i) => this._arcPoint(cx, cy, r * t, (i / n) * 360));
            doc.moveTo(pts[0].x, pts[0].y);
            pts.slice(1).forEach(p => doc.lineTo(p.x, p.y));
            doc.closePath().lineWidth(0.75).strokeColor(this.colors.line).stroke();
        });
        // spokes
        axes.forEach((_, i) => {
            const p = this._arcPoint(cx, cy, r, (i / n) * 360);
            doc.moveTo(cx, cy).lineTo(p.x, p.y).lineWidth(0.75).strokeColor(this.colors.line).stroke();
        });
        // data polygon
        const dpts = axes.map((a, i) => this._arcPoint(cx, cy, r * Math.max(0.04, Math.min(1, this._num(a.score) / 100)), (i / n) * 360));
        doc.moveTo(dpts[0].x, dpts[0].y);
        dpts.slice(1).forEach(p => doc.lineTo(p.x, p.y));
        doc.closePath();
        doc.fillOpacity(0.18).fill(accent).fillOpacity(1);
        doc.moveTo(dpts[0].x, dpts[0].y);
        dpts.slice(1).forEach(p => doc.lineTo(p.x, p.y));
        doc.closePath().lineWidth(1.5).strokeColor(accent).stroke();
        dpts.forEach(p => doc.circle(p.x, p.y, 2.5).fill(accent));
        // labels
        axes.forEach((a, i) => {
            const p = this._arcPoint(cx, cy, r + 14, (i / n) * 360);
            doc.font('Helvetica-Bold').fontSize(7).fillColor(this.colors.textLight)
                .text(String(a.label).toUpperCase(), p.x - 34, p.y - 4, { width: 68, align: 'center', characterSpacing: 0.3 });
        });
    }

    /** Horizontal score bars. rows = [{label, score 0-100, color?}]. */
    drawHBars(doc, x, y, w, rows, opts = {}) {
        const { labelW = 130, rowH = 26, max = 100 } = opts;
        rows.forEach((row, i) => {
            const ry = y + i * rowH;
            const barX = x + labelW;
            const barW = w - labelW - 36;
            const color = row.color || this.colors.blue;
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor(this.colors.text).text(String(row.label), x, ry + 2, { width: labelW - 8 });
            doc.roundedRect(barX, ry, barW, 9, 4.5).fill(this.colors.track);
            const frac = Math.max(0, Math.min(1, this._num(row.score) / max));
            if (frac > 0) doc.roundedRect(barX, ry, Math.max(barW * frac, 4), 9, 4.5).fill(color);
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor(color).text(String(Math.round(this._num(row.score))), barX + barW + 8, ry + 1, { width: 28 });
        });
        return y + rows.length * rowH;
    }

    /** Area line chart with gradient fill. points = [{label, value}]. */
    drawAreaLine(doc, x, y, w, h, points, accent) {
        const pts = (points || []).filter(p => p && Number.isFinite(Number(p.value)));
        if (pts.length < 2) {
            doc.font('Helvetica').fontSize(9).fillColor(this.colors.muted).text('Insufficient historical data for trend.', x, y + h / 2 - 6);
            return;
        }
        const values = pts.map(p => this._num(p.value));
        const minV = Math.max(0, Math.min(...values) - 8);
        const maxV = Math.min(100, Math.max(...values) + 8);
        const range = (maxV - minV) || 1;
        const baseY = y + h;
        const stepX = w / (pts.length - 1);
        const coords = pts.map((p, i) => ({
            x: x + i * stepX,
            y: baseY - ((this._num(p.value) - minV) / range) * h,
            label: p.label, value: this._num(p.value),
        }));

        // gridlines
        [0.25, 0.5, 0.75].forEach(t => {
            const gy = y + h * t;
            doc.moveTo(x, gy).lineTo(x + w, gy).lineWidth(0.5).strokeColor(this.colors.line).dash(2, { space: 2 }).stroke();
        });
        doc.undash();

        // area fill
        const grad = doc.linearGradient(x, y, x, baseY);
        grad.stop(0, this.tint(accent, 0.55)).stop(1, this.colors.white);
        doc.moveTo(coords[0].x, baseY);
        coords.forEach(c => doc.lineTo(c.x, c.y));
        doc.lineTo(coords[coords.length - 1].x, baseY).closePath().fill(grad);

        // line
        doc.moveTo(coords[0].x, coords[0].y);
        coords.slice(1).forEach(c => doc.lineTo(c.x, c.y));
        doc.lineWidth(2).strokeColor(accent).stroke();

        // points + labels
        coords.forEach(c => {
            doc.circle(c.x, c.y, 3.5).fill(this.colors.white);
            doc.circle(c.x, c.y, 3.5).lineWidth(2).strokeColor(accent).stroke();
            doc.font('Helvetica-Bold').fontSize(7.5).fillColor(this.colors.ink).text(String(Math.round(c.value)), c.x - 12, c.y - 16, { width: 24, align: 'center' });
            doc.font('Helvetica').fontSize(7).fillColor(this.colors.muted).text(String(c.label || ''), c.x - 22, baseY + 6, { width: 44, align: 'center' });
        });
    }

    /** Horizontal stacked bar. parts = [{label, pct, color}]. Draws legend below. */
    drawStackedBar(doc, x, y, w, h, parts) {
        const segs = (parts || []).filter(p => this._num(p.pct) > 0);
        const total = segs.reduce((s, p) => s + this._num(p.pct), 0) || 1;
        let sx = x;
        doc.roundedRect(x, y, w, h, h / 2).fill(this.colors.track);
        doc.save();
        doc.roundedRect(x, y, w, h, h / 2).clip();
        segs.forEach(p => {
            const segW = (this._num(p.pct) / total) * w;
            doc.rect(sx, y, segW, h).fill(p.color);
            sx += segW;
        });
        doc.restore();
        // legend
        let lx = x, ly = y + h + 12;
        segs.forEach(p => {
            const label = `${p.label} ${Math.round((this._num(p.pct) / total) * 100)}%`;
            const tw = doc.widthOfString(label) + 22;
            if (lx + tw > x + w) { lx = x; ly += 16; }
            doc.circle(lx + 4, ly + 4, 4).fill(p.color);
            doc.font('Helvetica').fontSize(8).fillColor(this.colors.text).text(label, lx + 12, ly);
            lx += tw + 8;
        });
        return ly + 16;
    }

    // ─── PAGES ───────────────────────────────────────────────────────────────────

    drawPage1ExecutiveDashboard(doc, data, aiInsights, subtitle) {
        const accent = this.pageAccent(0); // teal
        const W = doc.page.width, M = 50, CW = W - 2 * M;
        this.drawGradientHeader(doc, 'Executive Dashboard', subtitle, accent);
        const dash = aiInsights?.dashboard || {};
        const kpis = dash.kpis || {};
        let y = 128;

        // Hero
        doc.font('Helvetica-Bold').fontSize(23).fillColor(this.colors.ink)
            .text(data.user.name || `@${data.user.githubUsername}`, M, y);
        doc.font('Helvetica').fontSize(11).fillColor(this.colors.muted)
            .text('Weekly Developer Intelligence Report', M, y + 28);

        const momentumText = dash.momentum || 'STABLE →';
        const up = momentumText.includes('↑') || /HIGH/i.test(momentumText);
        const down = momentumText.includes('↓') || /DECLIN/i.test(momentumText);
        const mBg = up ? this.colors.successLight : down ? this.colors.dangerLight : this.tint(accent, 0.18);
        const mCol = up ? this.colors.success : down ? this.colors.danger : this.mix(accent, this.colors.ink, 0.3);
        const mDir = up ? 'up' : down ? 'down' : 'flat';
        this.drawPill(doc, W - M - 150, y + 2, 150, 24, `Momentum: ${this._ascii(momentumText)}`, mBg, mCol);
        this._triangle(doc, W - M - 22, y + 14, 4, mDir, mCol);

        y += 62;

        // KPI grid (4)
        const weeklyCommits = kpis.weeklyCommits ?? data.stats.totalCommits ?? 0;
        const weeklyPRs = kpis.weeklyPRs ?? data.stats.totalPRs ?? 0;
        const gw = (CW - 30) / 4;
        const kpiAccent = [accent, this.colors.blue, this.colors.purple, this.colors.orange];
        const kpiDefs = [
            { label: 'THIS WEEK COMMITS', val: weeklyCommits, delta: kpis.commitsDelta, note: '7-day verified' },
            { label: 'PULL REQUESTS', val: weeklyPRs, delta: kpis.prsDelta, note: '7-day window' },
            { label: 'FOCUS SCORE', val: kpis.focusScore ?? '--', note: 'Repo concentration' },
            { label: 'CONSISTENCY', val: `${kpis.consistencyScore ?? '--'}%`, note: 'Active days / 7' },
        ];
        kpiDefs.forEach((k, i) => {
            const gx = M + i * (gw + 10);
            this.drawCard(doc, gx, y, gw, 88, { accent: kpiAccent[i] });
            doc.font('Helvetica').fontSize(7.5).fillColor(this.colors.muted).text(k.label, gx + 16, y + 14, { width: gw - 22 });
            doc.font('Helvetica-Bold').fontSize(24).fillColor(this.colors.ink).text(String(k.val), gx + 16, y + 32);
            if (k.note) doc.font('Helvetica').fontSize(7).fillColor(this.colors.muted).text(k.note, gx + 16, y + 64);
            if (k.delta) this.drawDelta(doc, gx + 16, y + 73, k.delta);
        });
        y += 110;

        // 7-day activity heat-strip
        const weeklyStats = aiInsights?._weeklyStats;
        if (weeklyStats?.behavioral?.dayDistribution?.length) {
            doc.font('Helvetica-Bold').fontSize(8).fillColor(this.colors.textLight).text('7-DAY ACTIVITY', M, y, { characterSpacing: 0.5 });
            const peak = weeklyStats.behavioral.peakDay;
            if (peak) doc.font('Helvetica').fontSize(8).fillColor(this.colors.muted).text(`Peak: ${peak}`, M, y, { width: CW, align: 'right' });
            y += 16;
            y = this.drawHeatStrip(doc, M, y, CW, weeklyStats.behavioral.dayDistribution.slice(-7), accent) + 18;
        }

        // Top achievement (full-width tinted)
        const achH = 64;
        this.drawCard(doc, M, y, CW, achH, { title: 'Top Achievement', accent: this.colors.success });
        doc.font('Helvetica').fontSize(9.5).fillColor(this.colors.text)
            .text(String(dash.biggestWin || 'No major win recorded this week.'), M + 16, y + 34, { width: CW - 32 });
        y += achH + 12;

        // Risk + Focus (two columns)
        const cardW = (CW - 12) / 2;
        const colH = 70;
        this.drawCard(doc, M, y, cardW, colH, { title: 'Primary Risk', accent: this.colors.danger });
        doc.font('Helvetica').fontSize(9).fillColor(this.colors.text)
            .text(String(dash.biggestRisk || 'No critical risks detected.'), M + 16, y + 34, { width: cardW - 30 });
        this.drawCard(doc, M + cardW + 12, y, cardW, colH, { title: 'Strategic Focus', accent: this.colors.blue });
        doc.font('Helvetica').fontSize(9).fillColor(this.colors.text)
            .text(String(dash.strategicFocus || 'Maintain current trajectory.'), M + cardW + 28, y + 34, { width: cardW - 30 });
    }

    drawPage2PerformanceIntelligence(doc, aiInsights, subtitle) {
        const accent = this.pageAccent(1); // blue
        const W = doc.page.width, M = 50, CW = W - 2 * M;
        this.drawGradientHeader(doc, 'Performance Intelligence', subtitle, accent);
        let y = 128;
        const intel = aiInsights?.intelligence || {};
        const behavioral = aiInsights?.behavioral || {};
        const weeklyDelta = aiInsights?.weeklyDelta || {};

        const statusColor = (s) => {
            const v = String(s || '').toLowerCase();
            if (v === 'excellent') return this.colors.success;
            if (v === 'stable' || v === 'good') return this.colors.blue;
            if (v === 'warning') return this.colors.warning;
            if (v === 'critical') return this.colors.danger;
            return this.colors.muted;
        };

        // Radar (left) + score bars (right)
        const blockH = 188;
        this.drawCard(doc, M, y, CW, blockH, { title: 'Engineering Dimensions', accent });
        const dims = [
            { key: 'workConsistency', label: 'Consistency', block: intel.workConsistency },
            { key: 'focusAnalysis', label: 'Focus', block: intel.focusAnalysis },
            { key: 'collaboration', label: 'Collab', block: intel.collaboration },
            { key: 'codeQuality', label: 'Quality', block: intel.codeQuality || intel.documentation },
        ];
        const radarAxes = dims.map(d => ({ label: d.label, score: d.block?.score ?? 0 }));
        this.drawRadar(doc, M + 110, y + 108, 64, radarAxes, accent);
        // score bars on the right
        const rows = dims.map(d => ({ label: d.block?.status ? `${d.label}` : d.label, score: d.block?.score ?? 0, color: statusColor(d.block?.status) }));
        this.drawHBars(doc, M + 230, y + 44, CW - 230 - 10, rows, { labelW: 90, rowH: 30 });
        y += blockH + 14;

        // Commit-type breakdown (donut) + behavior summary
        const ctb = behavioral.commitTypeBreakdown || {};
        const ctbSegs = [
            { label: 'Features', value: ctb.features, color: this.categorical[0] },
            { label: 'Fixes', value: ctb.fixes, color: this.categorical[3] },
            { label: 'Docs', value: ctb.docs, color: this.categorical[2] },
            { label: 'Refactors', value: ctb.refactors, color: this.categorical[1] },
            { label: 'Other', value: ctb.other, color: this.colors.muted },
        ];
        const bH = 150;
        this.drawCard(doc, M, y, CW, bH, { title: 'Commit Composition', accent: this.colors.purple });
        this.drawDonut(doc, M + 80, y + 86, 46, ctbSegs, { centerLabel: behavioral.peakDay || '', centerSub: 'peak day', legendX: M + 160, legendY: y + 44 });
        if (behavioral.behaviorSummary) {
            doc.font('Helvetica').fontSize(8.5).fillColor(this.colors.textLight)
                .text(String(behavioral.behaviorSummary), M + 300, y + 44, { width: CW - 300 - 16, lineGap: 2 });
        }
        y += bH + 14;

        // Weekly delta table — fixed columns: METRIC | CURRENT | EST. PRIOR | DELTA
        if (weeklyDelta.metrics?.length) {
            const tH = 40 + weeklyDelta.metrics.length * 22;
            this.drawCard(doc, M, y, CW, tH, { title: 'Weekly Change Intelligence', accent });
            // column layout (x, width) within the card
            const colLabel = { x: M + 16, w: 150 };
            const colCur = { x: M + 180, w: 80 };
            const colEst = { x: M + 280, w: 90 };
            const colDelta = { x: M + 390, w: CW - (M + 390 - M) - 16 };
            const hy = y + 30;
            doc.font('Helvetica-Bold').fontSize(7).fillColor(this.colors.muted);
            doc.text('METRIC', colLabel.x, hy, { width: colLabel.w });
            doc.text('CURRENT', colCur.x, hy, { width: colCur.w, align: 'right' });
            doc.text('EST. PRIOR', colEst.x, hy, { width: colEst.w, align: 'right' });
            doc.text('DELTA', colDelta.x, hy, { width: colDelta.w, align: 'right' });
            weeklyDelta.metrics.forEach((m, i) => {
                const ry = y + 46 + i * 22;
                doc.font('Helvetica').fontSize(9).fillColor(this.colors.textLight).text(this._ascii(m.label), colLabel.x, ry, { width: colLabel.w });
                doc.font('Helvetica-Bold').fontSize(9).fillColor(this.colors.ink).text(this._ascii(m.current ?? '--'), colCur.x, ry, { width: colCur.w, align: 'right' });
                doc.font('Helvetica').fontSize(9).fillColor(this.colors.muted).text(this._ascii(m.estimated ?? 'N/A'), colEst.x, ry, { width: colEst.w, align: 'right' });
                const sig = m.signal || '→';
                const dCol = sig === '↑' ? this.colors.success : sig === '↓' ? this.colors.danger : this.colors.muted;
                const dDir = sig === '↑' ? 'up' : sig === '↓' ? 'down' : 'flat';
                const deltaStr = this._ascii(m.delta ?? 'N/A');
                const dw = doc.font('Helvetica-Bold').fontSize(9).widthOfString(deltaStr);
                const dEndX = colDelta.x + colDelta.w;
                this._triangle(doc, dEndX - dw - 9, ry + 5, 3, dDir, dCol);
                doc.fillColor(dCol).text(deltaStr, colDelta.x, ry, { width: colDelta.w, align: 'right' });
            });
        }
    }

    drawPage3RepositoryIntelligence(doc, repos, aiInsights, subtitle) {
        const accent = this.pageAccent(2); // purple
        const W = doc.page.width, M = 50, CW = W - 2 * M;
        this.drawGradientHeader(doc, 'Repository Intelligence', subtitle, accent);
        let y = 128;

        const repoIntel = aiInsights?.repositories || {};
        const topRepos = (repos || []).slice(0, 4);

        if (topRepos.length === 0) {
            this.drawCard(doc, M, y, CW, 60, { accent });
            doc.font('Helvetica').fontSize(11).fillColor(this.colors.muted).text('No repository activity recorded this week.', M + 16, y + 24);
            return;
        }

        const stateColors = {
            RAPID_GROWTH: this.colors.success, SECURITY_SENSITIVE: this.colors.danger, DORMANT: this.colors.muted,
            MAINTENANCE_HEAVY: this.colors.warning, HIGH_VISIBILITY: this.colors.blue, FEATURE_EXPANDING: this.colors.purple,
            UNSTABLE: this.colors.danger, STABLE: this.colors.teal,
        };

        topRepos.forEach(repo => {
            const name = repo.name || repo.shortName || 'repository';
            const data = repoIntel[name] || repoIntel[repo.name] || {};
            const metrics = data.metrics || {};
            const state = data.state || 'STABLE';

            // Right column geometry — measure insight height at the SAME width it renders.
            const rx = M + CW * 0.5 + 24;
            const rw = CW * 0.5 - 40;
            const insightText = String(data.insight || 'Insufficient commit data for unique analysis.');
            doc.font('Helvetica').fontSize(8.5);
            const insightH = Math.max(28, doc.heightOfString(insightText, { width: rw, lineGap: 1.5 }));
            const cardH = 92 + insightH;
            this.drawCard(doc, M, y, CW, cardH, { accent: stateColors[state] || accent });

            // state badge
            const stateLabel = state.replace(/_/g, ' ');
            const sw = doc.widthOfString(stateLabel) + 18;
            this.drawPill(doc, M + CW - sw - 16, y + 14, sw, 16, stateLabel, this.tint(stateColors[state] || accent, 0.22), stateColors[state] || accent);

            // name + micro stats
            doc.font('Helvetica-Bold').fontSize(13).fillColor(this.colors.ink).text(name, M + 16, y + 14, { width: CW - sw - 40 });
            doc.font('Helvetica').fontSize(8).fillColor(this.colors.muted)
                .text(`${repo.commitsThisWeek || metrics.commitVelocity || 0} commits  ·  ${repo.stars || 0} stars  ·  momentum: ${metrics.momentum || 'N/A'}`, M + 16, y + 34);

            // mini meters: velocity / maintenance / visibility risk
            const meters = [
                { label: 'Velocity', score: Math.min(100, (this._num(metrics.commitVelocity) || repo.commitsThisWeek || 0) * 8), color: this.colors.teal },
                { label: 'Maintenance', score: this._num(metrics.estimatedMaintenanceRatio), color: this.colors.warning },
                { label: 'Visibility Risk', score: this._num(metrics.visibilityRisk), color: this.colors.danger },
            ];
            this.drawHBars(doc, M + 16, y + 50, (CW) * 0.5, meters, { labelW: 84, rowH: 14, max: 100 });

            // insight + action (right column) — rx/rw/insightText computed above
            doc.font('Helvetica-Bold').fontSize(7.5).fillColor(this.colors.textLight).text('INSIGHT', rx, y + 48, { characterSpacing: 0.5 });
            doc.font('Helvetica').fontSize(8.5).fillColor(this.colors.text).text(insightText, rx, y + 60, { width: rw, lineGap: 1.5 });
            doc.font('Helvetica-Bold').fontSize(8).fillColor(accent).text('» ' + this._ascii(data.suggestedAction || 'Run a dependency audit.'), rx, y + 68 + insightH, { width: rw });

            y += cardH + 12;
        });
    }

    drawPage4AdvancedAnalytics(doc, data, history, aiInsights, subtitle) {
        const accent = this.pageAccent(3); // orange
        const W = doc.page.width, M = 50, CW = W - 2 * M;
        this.drawGradientHeader(doc, 'Advanced Analytics', subtitle, accent);
        let y = 128;

        // Momentum trend (area)
        const trendH = 168;
        this.drawCard(doc, M, y, CW, trendH, { title: 'Momentum History (last reports)', accent });
        const points = (history || []).map((h, i) => ({
            value: h.aiInsights?.globalScore?.total || h.stats?.impactScore || 50,
            label: h.createdAt ? new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `W${i + 1}`,
        }));
        this.drawAreaLine(doc, M + 24, y + 40, CW - 70, 96, points, accent);
        y += trendH + 14;

        // Language ecosystem donut
        const langs = data.insights.languages || [];
        const langH = 158;
        this.drawCard(doc, M, y, CW, langH, { title: 'Technology Stack Ecosystem', accent: this.colors.blue });
        if (langs.length) {
            const segs = langs.slice(0, 6).map((l, i) => ({ label: l.name, value: l.percentage, color: this.categorical[i % this.categorical.length] }));
            this.drawDonut(doc, M + 86, y + 84, 50, segs, { centerLabel: `${langs.length}`, centerSub: 'languages', legendX: M + 180, legendY: y + 42 });
        } else {
            doc.font('Helvetica').fontSize(10).fillColor(this.colors.muted).text('No language data found.', M + 16, y + 60);
        }
        y += langH + 14;

        // Stat tiles
        const s = data.insights.stats || {};
        const tiles = [
            { label: 'TOTAL STARS', val: s.totalStars ?? 0, color: this.colors.warning },
            { label: 'REPOSITORIES', val: s.totalRepos ?? 0, color: this.colors.teal },
            { label: 'TOTAL PRs', val: s.totalPRs ?? 0, color: this.colors.purple },
            { label: 'CONTRIBUTIONS', val: s.totalContributions ?? 0, color: this.colors.orange },
        ];
        const tw = (CW - 30) / 4;
        tiles.forEach((t, i) => {
            const tx = M + i * (tw + 10);
            this.drawCard(doc, tx, y, tw, 64, { accent: t.color });
            doc.font('Helvetica').fontSize(7).fillColor(this.colors.muted).text(t.label, tx + 16, y + 14, { width: tw - 22 });
            doc.font('Helvetica-Bold').fontSize(20).fillColor(t.color).text(String(t.val), tx + 16, y + 30);
        });
    }

    drawPage5SecurityIntelligence(doc, aiInsights, subtitle) {
        const accent = this.pageAccent(4); // red
        const W = doc.page.width, M = 50, CW = W - 2 * M;
        this.drawGradientHeader(doc, 'Security Intelligence', subtitle, accent);
        let y = 128;
        const sec = aiInsights?.security || [];

        // Audit status banner
        const high = sec.filter(s => s.severity === 'High').length;
        const med = sec.filter(s => s.severity === 'Medium').length;
        const low = sec.filter(s => s.severity === 'Low').length;
        const statusText = sec.length === 0 ? 'CLEAN' : high > 0 ? 'RISK DETECTED' : 'WARNINGS PRESENT';
        const statusColor = statusText === 'CLEAN' ? this.colors.success : statusText === 'RISK DETECTED' ? this.colors.danger : this.colors.warning;

        this.drawCard(doc, M, y, CW, 72, { accent: statusColor });
        doc.font('Helvetica').fontSize(8).fillColor(this.colors.muted).text('AUDIT STATUS', M + 20, y + 16, { characterSpacing: 1 });
        doc.font('Helvetica-Bold').fontSize(20).fillColor(statusColor).text(statusText, M + 20, y + 30);
        // severity distribution bar (right)
        if (sec.length) {
            this.drawStackedBar(doc, M + CW - 240, y + 24, 224, 12, [
                { label: 'High', pct: high, color: this.colors.danger },
                { label: 'Med', pct: med, color: this.colors.warning },
                { label: 'Low', pct: low, color: this.colors.muted },
            ]);
        }
        y += 88;

        if (sec.length === 0) {
            this.drawCard(doc, M, y, CW, 56, { accent: this.colors.success });
            doc.font('Helvetica').fontSize(10).fillColor(this.colors.textLight).text('No obvious security risks detected in recent commit activity.', M + 16, y + 22);
            return;
        }

        sec.forEach(s => {
            const evH = s.evidence ? Math.max(12, doc.heightOfString(String(s.evidence), { width: CW - 200 })) : 0;
            const fixH = s.suggestion ? Math.max(12, doc.heightOfString(String(s.suggestion), { width: CW - 130 })) : 12;
            const cardH = 92 + evH + fixH;
            const sevColor = s.severity === 'High' ? this.colors.danger : s.severity === 'Medium' ? this.colors.warning : this.colors.muted;
            this.drawCard(doc, M, y, CW, cardH, { accent: sevColor });

            this.drawPill(doc, M + 16, y + 14, 52, 16, s.severity || 'Low', this.tint(sevColor, 0.2), sevColor);
            const confColor = s.confidence === 'High' ? this.colors.danger : s.confidence === 'Medium' ? this.colors.warning : this.colors.muted;
            this.drawPill(doc, M + 74, y + 14, 92, 16, `Confidence: ${s.confidence || 'Low'}`, this.colors.track, confColor);

            doc.font('Helvetica-Bold').fontSize(10.5).fillColor(this.colors.ink).text(String(s.issue || 'Finding'), M + 16, y + 38, { width: CW - 32 });
            if (s.affectedArea) doc.font('Helvetica').fontSize(8).fillColor(this.colors.muted).text(`Area: ${s.affectedArea}`, M + 16, y + 54);
            let ey = y + 68;
            if (s.evidence) {
                doc.font('Helvetica-Bold').fontSize(8).fillColor(this.colors.textLight).text('Evidence', M + 16, ey);
                doc.font('Helvetica').fontSize(8.5).fillColor(this.colors.text).text(String(s.evidence), M + 80, ey, { width: CW - 100 });
                ey += evH + 4;
            }
            doc.font('Helvetica-Bold').fontSize(8).fillColor(accent).text('Fix', M + 16, ey);
            doc.font('Helvetica').fontSize(8.5).fillColor(this.colors.text).text(String(s.suggestion || 'Review and remediate.'), M + 80, ey, { width: CW - 100 });

            y += cardH + 10;
        });
    }

    drawPage6WeeklyNarrative(doc, aiInsights, data, subtitle) {
        const accent = this.pageAccent(5); // indigo
        const W = doc.page.width, M = 50, CW = W - 2 * M;
        this.drawGradientHeader(doc, 'Executive Narrative', subtitle, accent);
        const globalScore = aiInsights?.globalScore || { total: 75, breakdown: {}, scoringNote: '' };
        let y = 132;

        // Gauge + breakdown radar side-by-side
        const blockH = 210;
        this.drawCard(doc, M, y, CW, blockH, { title: 'Global Intelligence Score', accent });
        this.drawGaugeRing(doc, M + 120, y + 104, 64, globalScore.total ?? 0, accent, { label: 'overall', thickness: 15 });

        const bd = globalScore.breakdown || {};
        const bdAxes = Object.keys(bd).slice(0, 6).map(k => ({ label: k.slice(0, 8), score: bd[k] ?? 0 }));
        if (bdAxes.length >= 3) {
            this.drawRadar(doc, M + CW - 150, y + 100, 60, bdAxes, this.colors.purple);
        } else {
            const rows = Object.keys(bd).map((k, i) => ({ label: k, score: bd[k] ?? 0, color: this.categorical[i % this.categorical.length] }));
            this.drawHBars(doc, M + 280, y + 44, CW - 290, rows, { labelW: 110, rowH: 26 });
        }
        if (globalScore.scoringNote) {
            doc.font('Helvetica').fontSize(8.5).fillColor(this.colors.muted)
                .text(String(globalScore.scoringNote), M + 16, y + blockH - 26, { width: CW - 32 });
        }
        y += blockH + 14;

        // Narrative card — measure at the exact render width + lineGap, then pad.
        const narrative = String(aiInsights?.narrative || 'Steady progression this week. Maintain consistent commits and continue improving code quality.');
        const narrW = CW - 64;
        doc.font('Helvetica').fontSize(10);
        const narrTextH = doc.heightOfString(narrative, { width: narrW, lineGap: 4 });
        const narrH = Math.max(110, narrTextH + 72);
        this.drawCard(doc, M, y, CW, narrH, { title: 'Weekly Summary', accent: this.colors.purple });
        doc.font('Helvetica-Bold').fontSize(30).fillColor(this.tint(this.colors.purple, 0.5)).text('“', M + 18, y + 26);
        doc.font('Helvetica').fontSize(10).fillColor(this.colors.text).text(narrative, M + 42, y + 46, { width: narrW, lineGap: 4 });
        y += narrH + 14;

        // Badges row — real vector medallions
        const badges = data.insights?.badges || [];
        if (badges.length) {
            doc.font('Helvetica-Bold').fontSize(8).fillColor(this.colors.textLight).text('EARNED BADGES', M, y, { characterSpacing: 0.5 });
            y += 24;
            const shown = badges.slice(0, 5);
            const colW = CW / shown.length;
            shown.forEach((b, i) => {
                const style = this.badgeStyle(b);
                const cx = M + colW * i + colW / 2;
                this.drawBadgeMedal(doc, cx, y + 16, 16, style.color, style.kind);
                doc.font('Helvetica-Bold').fontSize(7.5).fillColor(this.colors.text)
                    .text(this._ascii(b.name), M + colW * i + 6, y + 50, { width: colW - 12, align: 'center' });
            });
        }
    }

    // ─── Rendering pipeline (pure — no network) ──────────────────────────────────

    /**
     * Render the full PDF document from already-fetched data.
     * @returns {Promise<{pdfBuffer: Buffer, aiInsights: object, stats: object}>}
     */
    renderReportDocument(input) {
        const {
            user = {}, insights = { stats: {} }, repos = [], activeRepos = [],
            aiInsights = {}, history = [], recentActivity = {}, streak = 0, subtitle,
        } = input;

        const sub = subtitle || new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
            const chunks = [];
            doc.on('data', c => chunks.push(c));

            const drawFooter = (d, accent) => {
                const fy = d.page.height - 40;
                d.moveTo(50, fy - 8).lineTo(d.page.width - 50, fy - 8).lineWidth(1).strokeColor(this.tint(accent, 0.5)).stroke();
                d.rect(50, fy - 8, 40, 2).fill(accent);
                d.font('Helvetica').fontSize(7.5).fillColor(this.colors.muted)
                    .text('Confidential Weekly Performance Analysis  ·  Generated by DevTrack Codebase Intelligence Engine', 50, fy, { align: 'center', width: d.page.width - 100 });
            };

            const activityBonus = (recentActivity?.totalEvents || 0) * 0.8;
            const impactScore = Math.min(99, Math.round((insights.rank?.score || 0) / 10 + activityBonus + (streak > 5 ? 10 : 0)));

            doc.on('end', () => {
                const range = doc.bufferedPageRange();
                for (let i = range.start; i < range.start + range.count; i++) {
                    doc.switchToPage(i);
                    const oldBottom = doc.page.margins.bottom;
                    doc.page.margins.bottom = 0;
                    drawFooter(doc, this.pageAccent(i));
                    doc.page.margins.bottom = oldBottom;
                }
                resolve({
                    pdfBuffer: Buffer.concat(chunks),
                    aiInsights,
                    stats: {
                        totalCommits: aiInsights?.dashboard?.kpis?.weeklyCommits ?? insights.stats?.totalCommits ?? 0,
                        totalPRs: aiInsights?.dashboard?.kpis?.weeklyPRs ?? insights.stats?.totalPRs ?? 0,
                        streak,
                        impactScore,
                    },
                });
            });
            doc.on('error', reject);

            const renderData = {
                user,
                insights,
                repos: repos || [],
                activeRepos: Array.isArray(activeRepos) ? activeRepos : Array.from((activeRepos || new Map()).values?.() || []),
                stats: insights.stats || {},
            };

            try {
                this.drawPage1ExecutiveDashboard(doc, renderData, aiInsights, sub);
                doc.addPage(); this.drawPage2PerformanceIntelligence(doc, aiInsights, sub);
                doc.addPage(); this.drawPage3RepositoryIntelligence(doc, renderData.activeRepos.length > 0 ? renderData.activeRepos : renderData.repos, aiInsights, sub);
                doc.addPage(); this.drawPage4AdvancedAnalytics(doc, renderData, history, aiInsights, sub);
                doc.addPage(); this.drawPage5SecurityIntelligence(doc, aiInsights, sub);
                doc.addPage(); this.drawPage6WeeklyNarrative(doc, aiInsights, renderData, sub);
            } catch (err) {
                console.error('PDF Rendering Error:', err);
                doc.font('Helvetica-Bold').fontSize(14).fillColor(this.colors.danger).text('Error Rendering PDF', 50, 150);
                doc.font('Helvetica').fontSize(10).fillColor(this.colors.text).text(err.message, 50, 180);
            }

            doc.end();
        });
    }

    // ─── Data fetching (REAL data) ───────────────────────────────────────────────

    async generatePDFReport(userId, preExistingData = null) {
        const userDoc = await collections.users().doc(userId).get();
        if (!userDoc.exists) {
            throw new Error(`User with ID ${userId} not found`);
        }
        const user = userDoc.data();

        const githubService = new GitHubService(getActiveGithubToken(user));

        let insights, repos, contributions, streak, recentActivity, aiInsights, history;

        if (preExistingData) {
            insights = { stats: preExistingData.stats || {} };
            repos = [];
            contributions = { streak: preExistingData.stats?.streak || 0 };
            streak = contributions.streak;
            recentActivity = { totalEvents: (preExistingData.stats?.totalCommits || 0) + (preExistingData.stats?.totalPRs || 0) };
            aiInsights = preExistingData.aiInsights;
            history = [];
        } else {
            [insights, repos, contributions] = await Promise.all([
                githubService.getGitHubInsights(user.githubUsername),
                githubService.getRepos(user.githubUsername, 10),
                githubService.getContributions(user.githubUsername),
            ]);

            streak = contributions?.streak || 0;

            let weeklyStats = null;
            try {
                weeklyStats = await githubService.getWeeklyStats(user.githubUsername);
                console.log(`📊 Weekly stats: ${weeklyStats?.weekly?.commits} commits, ${weeklyStats?.weekly?.activeDays}/7 active days`);
            } catch (e) {
                console.warn('getWeeklyStats failed:', e.message);
            }

            try {
                const reportsSnapshot = await collections.reports()
                    .where('userId', '==', userId)
                    .get();

                let allReports = reportsSnapshot.docs.map(d => d.data());
                allReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                history = allReports.slice(0, 4).reverse();

                const previousReport = allReports[0] || null;

                recentActivity = await githubService.getActivitySummary(user.githubUsername);
                const groqService = getGroqService();
                aiInsights = await groqService.generateWeeklyInsights(recentActivity, weeklyStats, previousReport);

                if (aiInsights?.dashboard?.kpis && weeklyStats) {
                    aiInsights.dashboard.kpis.weeklyCommits = weeklyStats.weekly.commits;
                    aiInsights.dashboard.kpis.weeklyPRs = weeklyStats.weekly.prs;
                    aiInsights.dashboard.kpis.consistencyScore = weeklyStats.behavioral.consistencyScore;
                    aiInsights._weeklyStats = weeklyStats;
                }

                history.push({
                    createdAt: new Date().toISOString(),
                    aiInsights,
                    stats: { ...insights.stats, weeklyCommits: weeklyStats?.weekly?.commits },
                });
            } catch (e) {
                console.warn('Supplementary data failed:', e.message);
                history = [];
            }
        }

        const subtitle = preExistingData
            ? new Date(preExistingData.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
            : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

        return this.renderReportDocument({
            user,
            insights,
            repos: repos || [],
            activeRepos: Array.isArray(recentActivity?.reposWorkedOn)
                ? recentActivity.reposWorkedOn
                : Array.from((recentActivity?.reposWorkedOn || new Map()).values()),
            aiInsights,
            history,
            recentActivity,
            streak,
            subtitle,
        });
    }

    async sendWeeklyReportEmail(userId, options = {}) {
        try {
            const userDoc = await collections.users().doc(userId).get();
            if (!userDoc.exists) {
                console.log(`User ${userId} not found`);
                return { success: false, error: 'User not found' };
            }

            const user = userDoc.data();
            const skipEmail = options.reportType === 'manual';

            if (!user.email && !skipEmail) {
                console.log(`User ${userId} has no email`);
                return { success: false, error: 'No email' };
            }

            if (!user.githubUsername) {
                console.log(`User ${userId} has no GitHub connected`);
                return { success: false, error: 'GitHub not connected' };
            }

            console.log(`Generating PDF report and AI Insights for ${user.githubUsername}...`);
            const reportData = await this.generatePDFReport(userId);
            const { pdfBuffer, aiInsights, stats } = reportData;

            try {
                const reportRef = collections.reports().doc();
                await reportRef.set({
                    userId: userId,
                    createdAt: new Date().toISOString(),
                    stats: stats,
                    aiInsights: aiInsights || null,
                });
                console.log(`Saved report history to Firestore for ${user.githubUsername}`);
            } catch (dbError) {
                console.error(`Failed to save report history to Firestore:`, dbError);
            }

            if (skipEmail) {
                console.log(`Skipping email for manual report trigger for user ${userId}`);
                return { success: true, message: 'Report generated and saved' };
            }

            console.log(`Sending report to ${user.email}...`);
            const aiSummary = aiInsights ? aiInsights.executiveSummary || aiInsights.summary : '';
            const result = await emailService.sendWeeklyReport(
                user.email,
                user.name || user.githubUsername,
                pdfBuffer,
                aiSummary
            );

            if (!result.success) {
                console.error(`Failed to send report to ${user.email}:`, result.error);
                return { success: false, error: result.error };
            }

            console.log(`Report sent to ${user.email}!`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`Error processing report for user ${userId}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * sendWeeklyReport — used by reportQueueService for queue-based delivery.
     */
    async sendWeeklyReport(userId, options = {}) {
        return this.sendWeeklyReportEmail(userId, options);
    }

    /**
     * sendAllWeeklyReports — LEGACY batch sender (kept for backward compatibility).
     * @deprecated Use reportQueueService.enqueueWeeklyJobs() + processQueue() instead.
     */
    async sendAllWeeklyReports() {
        console.log('[LEGACY] Starting batch weekly report distribution...');
        try {
            const usersSnapshot = await collections.users().get();
            let sent = 0;
            let failed = 0;

            for (const doc of usersSnapshot.docs) {
                const user = doc.data();
                if (user.email && user.githubUsername) {
                    const result = await this.sendWeeklyReportEmail(doc.id);
                    if (result.success) { sent++; } else { failed++; }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            console.log(`Weekly reports complete: ${sent} sent, ${failed} failed`);
            return { sent, failed };
        } catch (error) {
            console.error('Error in weekly report distribution:', error);
            return { sent: 0, failed: 0, error: error.message };
        }
    }
}

module.exports = new ReportService();
