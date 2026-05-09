/**
 * Report Service
 * Generates beautiful weekly GitHub PDF reports and sends via email using Gmail SMTP
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
        // Path to logo - more robust path for different environments
        this.logoPath = path.resolve(__dirname, '../../../../client/public/DevTrack.png');
        // Fallback for Render/Production if client is not in the same root
        if (!fs.existsSync(this.logoPath)) {
            this.logoPath = path.resolve(__dirname, '../../public/DevTrack.png');
        }
    }

    // Color palette - Enterprise / Linear theme
    colors = {
        primary: '#000000',      // Black for primary elements
        primaryDark: '#111111',  // Near black
        secondary: '#666666',    // Muted text or secondary borders
        accent: '#3b82f6',       // Vercel/Linear subtle blue
        dark: '#0a0a0a',         // Deep background
        darkGray: '#171717',     // Slightly lighter dark
        text: '#111111',         // Main text
        textLight: '#404040',    // Secondary text
        muted: '#737373',        // Muted labels
        light: '#e5e5e5',        // Borders
        lighter: '#f5f5f5',      // Background highlights
        success: '#10b981',      // Keep standard semantic colors for status
        successLight: '#d1fae5',
        warning: '#f59e0b',
        warningLight: '#fef3c7',
        danger: '#ef4444',
        white: '#ffffff',
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // NEW ELITE PDF LAYOUT ENGINES
    // ─────────────────────────────────────────────────────────────────────────────

    drawHeader(doc, title, subtitle) {
        doc.rect(0, 0, doc.page.width, 100).fill(this.colors.dark);
        doc.rect(0, 98, doc.page.width, 2).fill(this.colors.accent);

        if (fs.existsSync(this.logoPath)) {
            doc.image(this.logoPath, 50, 25, { width: 45 });
        }

        doc.font('Helvetica-Bold').fontSize(22).fillColor(this.colors.white).text('DevTrack', 105, 30);
        doc.font('Helvetica').fontSize(12).fillColor(this.colors.muted).text(title, 105, 58);
        doc.font('Helvetica').fontSize(10).fillColor(this.colors.muted).text(subtitle, doc.page.width - 200, 45, { width: 150, align: 'right' });
    }

    drawCard(doc, x, y, w, h, title = null, subtitle = null) {
        doc.roundedRect(x, y, w, h, 6).fill('#ffffff');
        doc.roundedRect(x, y, w, h, 6).strokeColor(this.colors.light).lineWidth(1).stroke();
        
        let contentY = y + 15;
        if (title) {
            doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.text).text(title, x + 15, contentY);
            contentY += 15;
        }
        if (subtitle) {
            doc.font('Helvetica').fontSize(8).fillColor(this.colors.muted).text(subtitle, x + 15, contentY);
            contentY += 15;
        }
        return contentY;
    }

    drawPage1ExecutiveDashboard(doc, data, aiInsights, subtitle) {
        this.drawHeader(doc, 'Executive Dashboard', subtitle);
        const dash = aiInsights?.dashboard || {};
        const kpis = dash.kpis || {};
        let y = 130;

        // Hero Profile Section
        doc.font('Helvetica-Bold').fontSize(24).fillColor(this.colors.text).text(data.user.name || `@${data.user.githubUsername}`, 50, y);
        doc.font('Helvetica').fontSize(12).fillColor(this.colors.muted).text('Weekly Developer Intelligence Report', 50, y + 28);
        
        // Momentum Pill
        const momentumText = dash.momentum || 'STABLE →';
        const mBg = momentumText.includes('↑') ? this.colors.successLight : (momentumText.includes('↓') ? this.colors.warningLight : this.colors.light);
        const mCol = momentumText.includes('↑') ? this.colors.success : (momentumText.includes('↓') ? this.colors.warning : this.colors.secondary);
        doc.roundedRect(doc.page.width - 150, y, 100, 24, 12).fill(mBg);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(mCol).text(`MOMENTUM: ${momentumText}`, doc.page.width - 150, y + 7, { width: 100, align: 'center' });
        
        y += 70;

        // KPI Grid — weekly commits from GraphQL verified source
        const weeklyCommits = kpis.weeklyCommits ?? data.stats.totalCommits ?? 0;
        const weeklyPRs = kpis.weeklyPRs ?? data.stats.totalPRs ?? 0;
        const gridW = (doc.page.width - 130) / 4;
        const drawKpi = (label, val, delta, gx, note) => {
            this.drawCard(doc, gx, y, gridW, 85);
            doc.font('Helvetica').fontSize(8).fillColor(this.colors.muted).text(label, gx + 15, y + 12);
            doc.font('Helvetica-Bold').fontSize(22).fillColor(this.colors.text).text(String(val), gx + 15, y + 30);
            if (note) doc.font('Helvetica').fontSize(7).fillColor(this.colors.muted).text(note, gx + 15, y + 55);
            if (delta) {
                const isPos = String(delta).startsWith('+');
                doc.font('Helvetica-Bold').fontSize(8).fillColor(isPos ? this.colors.success : this.colors.danger).text(delta, gx + 15, y + 68);
            }
        };
        drawKpi('THIS WEEK COMMITS', weeklyCommits, kpis.commitsDelta, 50, '7-day GraphQL verified');
        drawKpi('PULL REQUESTS', weeklyPRs, kpis.prsDelta, 50 + gridW + 10, '7-day window');
        drawKpi('FOCUS SCORE', kpis.focusScore ?? '--', null, 50 + (gridW + 10) * 2, 'Repo concentration');
        drawKpi('CONSISTENCY', `${kpis.consistencyScore ?? '--'}%`, null, 50 + (gridW + 10) * 3, 'Active days / 7');

        y += 110;

        // 7-day contribution heatmap
        const weeklyStats = aiInsights?._weeklyStats;
        if (weeklyStats?.behavioral?.dayDistribution) {
            doc.font('Helvetica-Bold').fontSize(8).fillColor(this.colors.muted).text('7-DAY ACTIVITY', 50, y);
            y += 14;
            const days = weeklyStats.behavioral.dayDistribution.slice(-7);
            const cellW = Math.floor((doc.page.width - 100) / 7) - 2;
            const maxCount = Math.max(...days.map(d => d.count), 1);
            days.forEach((d, i) => {
                const cx = 50 + i * (cellW + 2);
                const intensity = d.count / maxCount;
                const fill = d.count === 0 ? this.colors.lighter : (intensity > 0.7 ? '#000000' : intensity > 0.3 ? '#404040' : '#a3a3a3');
                doc.roundedRect(cx, y, cellW, 28, 3).fill(fill);
                doc.font('Helvetica-Bold').fontSize(7).fillColor(d.count === 0 ? this.colors.muted : this.colors.white).text(d.dayName, cx, y + 4, { width: cellW, align: 'center' });
                doc.font('Helvetica-Bold').fontSize(9).fillColor(d.count === 0 ? this.colors.muted : this.colors.white).text(String(d.count), cx, y + 14, { width: cellW, align: 'center' });
            });
            y += 44;
        }

        // Big Win & Strategic Focus
        this.drawCard(doc, 50, y, doc.page.width - 100, 70, 'Top Achievement');
        doc.font('Helvetica').fontSize(10).fillColor(this.colors.primaryDark).text(String(dash.biggestWin || 'No major win recorded.'), 65, y + 35, { width: doc.page.width - 130 });
        y += 90;
        
        const cardW = (doc.page.width - 110) / 2;
        this.drawCard(doc, 50, y, cardW, 70, 'Primary Risk');
        doc.font('Helvetica').fontSize(9).fillColor(this.colors.danger).text(String(dash.biggestRisk || 'No critical risks detected.'), 65, y + 35, { width: cardW - 30 });
        this.drawCard(doc, 50 + cardW + 10, y, cardW, 70, 'Strategic Focus');
        doc.font('Helvetica').fontSize(9).fillColor(this.colors.accent).text(String(dash.strategicFocus || 'Maintain current trajectory.'), 65 + cardW + 10, y + 35, { width: cardW - 30 });
    }

    drawPage2PerformanceIntelligence(doc, aiInsights, subtitle) {
        this.drawHeader(doc, 'Performance Intelligence', subtitle);
        let y = 130;
        const intel = aiInsights?.intelligence || {};
        const behavioral = aiInsights?.behavioral || {};
        const weeklyDelta = aiInsights?.weeklyDelta || {};

        const drawIntelRow = (title, dataBlock, currentY) => {
            const h = 85;
            this.drawCard(doc, 50, currentY, doc.page.width - 100, h, title);
            const status = dataBlock?.status || 'Unknown';
            const isCritical = status === 'Critical' || status === 'Warning';
            const color = isCritical ? this.colors.warning : (status === 'Excellent' ? this.colors.success : this.colors.secondary);
            // Score bar
            const score = dataBlock?.score ?? 0;
            const barX = 240; // Shifted right to avoid text overlap
            const barW = doc.page.width - 360; 
            doc.rect(barX, currentY + 19, barW, 6).fill(this.colors.lighter);
            doc.rect(barX, currentY + 19, (score / 100) * barW, 6).fill(color);
            doc.font('Helvetica-Bold').fontSize(8).fillColor(color).text(`${score}`, barX + barW + 10, currentY + 16);
            // Status badge
            doc.roundedRect(doc.page.width - 120, currentY + 10, 60, 16, 8).fill(this.colors.lighter);
            doc.font('Helvetica-Bold').fontSize(7).fillColor(color).text(status.toUpperCase(), doc.page.width - 120, currentY + 14, { width: 60, align: 'center' });
            // Trend + text
            doc.font('Helvetica-Bold').fontSize(13).fillColor(this.colors.text).text(dataBlock?.trend || '→', 65, currentY + 42);
            doc.font('Helvetica').fontSize(9).fillColor(this.colors.textLight).text(dataBlock?.interpretation || 'Insufficient data.', 95, currentY + 43, { width: doc.page.width - 175, lineGap: 2 });
            return currentY + h + 10;
        };

        y = drawIntelRow('Work Consistency', intel.workConsistency, y);
        y = drawIntelRow('Focus Analysis', intel.focusAnalysis, y);
        y = drawIntelRow('Collaboration Health', intel.collaboration, y);
        y = drawIntelRow('Code Quality', intel.codeQuality || intel.documentation, y);

        // Behavioral summary strip
        if (behavioral.behaviorSummary) {
            y += 5;
            this.drawCard(doc, 50, y, doc.page.width - 100, 55, 'Behavioral Pattern');
            doc.font('Helvetica').fontSize(9).fillColor(this.colors.textLight).text(String(behavioral.behaviorSummary), 65, y + 30, { width: doc.page.width - 130 });
            y += 70;
        }

        // Weekly Delta table
        if (weeklyDelta.metrics?.length > 0) {
            this.drawCard(doc, 50, y, doc.page.width - 100, 30 + weeklyDelta.metrics.length * 22, 'Weekly Change Intelligence');
            weeklyDelta.metrics.forEach((m, i) => {
                const rowY = y + 30 + i * 22;
                doc.font('Helvetica').fontSize(9).fillColor(this.colors.muted).text(m.label, 65, rowY);
                doc.font('Helvetica-Bold').fontSize(9).fillColor(this.colors.text).text(String(m.current), 200, rowY);
                doc.font('Helvetica').fontSize(9).fillColor(this.colors.muted).text(m.estimated ?? 'N/A', 270, rowY);
                const dColor = m.signal === '↑' ? this.colors.success : (m.signal === '↓' ? this.colors.danger : this.colors.muted);
                doc.font('Helvetica-Bold').fontSize(10).fillColor(dColor).text(`${m.delta ?? 'N/A'} ${m.signal}`, 340, rowY);
            });
        }
    }

    drawPage3RepositoryIntelligence(doc, repos, aiInsights, subtitle) {
        this.drawHeader(doc, 'Repository Intelligence', subtitle);
        let y = 130;

        const repoIntel = aiInsights?.repositories || {};
        const topRepos = repos.slice(0, 4); // Max 4 per page to keep it clean

        if (topRepos.length === 0) {
            doc.font('Helvetica').fontSize(12).fillColor(this.colors.muted).text('No repository activity this week.', 50, y);
            return;
        }

        topRepos.forEach(repo => {
            const name = repo.name || repo.shortName;
            // Try matching by full name or short name
            const data = repoIntel[name] || repoIntel[repo.name] || Object.values(repoIntel).find(v => name?.includes(Object.keys(repoIntel).find(k => repoIntel[k] === v) ?? '')) || {};
            const metrics = data.metrics || {};
            const state = data.state || 'UNKNOWN';

            const insightH = data.insight ? Math.max(30, doc.heightOfString(data.insight, { width: doc.page.width - 220 })) : 14;
            const cardH = 75 + insightH;
            this.drawCard(doc, 50, y, doc.page.width - 100, cardH);

            // State badge
            const stateColors = { RAPID_GROWTH: this.colors.success, SECURITY_SENSITIVE: this.colors.danger, DORMANT: this.colors.muted, MAINTENANCE_HEAVY: this.colors.warning, HIGH_VISIBILITY: this.colors.accent, FEATURE_EXPANDING: '#6366f1', UNSTABLE: this.colors.danger };
            const sBg = stateColors[state] || this.colors.secondary;
            const stateLabel = state.replace('_', ' ');
            const sw = doc.widthOfString(stateLabel) + 16;
            doc.roundedRect(doc.page.width - sw - 65, y + 12, sw, 16, 8).fill(sBg);
            doc.font('Helvetica-Bold').fontSize(7).fillColor(this.colors.white).text(stateLabel, doc.page.width - sw - 65, y + 16, { width: sw, align: 'center' });

            // Repo name + micro stats
            doc.font('Helvetica-Bold').fontSize(12).fillColor(this.colors.primaryDark).text(name, 65, y + 16);
            doc.font('Helvetica').fontSize(8).fillColor(this.colors.muted).text(`${repo.commitsThisWeek || 0} commits  ·  ${repo.stars || 0} stars  ·  momentum: ${metrics.momentum || 'N/A'}  ·  maint. ratio: ${metrics.estimatedMaintenanceRatio ?? '?'}%`, 65, y + 34);

            // Insight
            doc.font('Helvetica-Bold').fontSize(8).fillColor(this.colors.text).text('INSIGHT', 65, y + 52);
            doc.font('Helvetica').fontSize(9).fillColor(this.colors.textLight).text(data.insight || 'Insufficient commit data for unique analysis.', 125, y + 51, { width: doc.page.width - 200, lineGap: 2 });

            // Action
            doc.font('Helvetica-Bold').fontSize(8).fillColor(this.colors.accent).text('→ ' + (data.suggestedAction || 'Run dependency audit.'), 65, y + 56 + insightH, { width: doc.page.width - 130 });

            y += cardH + 12;
        });
    }

    drawPage4AdvancedAnalytics(doc, data, history, subtitle) {
        this.drawHeader(doc, 'Advanced Analytics', subtitle);
        let y = 130;

        // Reusing the vector charts from before, but refactored for the new layout
        const chartW = doc.page.width - 100;
        
        // 1. Productivity Trend (Line Chart)
        this.drawCard(doc, 50, y, chartW, 150, 'Momentum History (4 Weeks)');
        if (history && history.length > 1) {
            const scores = history.map(h => {
                return h.aiInsights?.globalScore?.total || h.stats?.impactScore || 50;
            });
            const minScore = Math.max(0, Math.min(...scores) - 10);
            const maxScore = Math.min(100, Math.max(...scores) + 10);
            const range = maxScore - minScore || 1;
            const chartInnerW = chartW - 40;
            const chartInnerH = 80;
            const cx = 70;
            const cy = y + 50;

            const points = scores.map((score, i) => {
                const px = cx + (i * (chartInnerW / (scores.length - 1)));
                const py = cy + chartInnerH - (((score - minScore) / range) * chartInnerH);
                return { px, py, score, i };
            });

            doc.moveTo(points[0].px, points[0].py);
            for (let i = 1; i < points.length; i++) { doc.lineTo(points[i].px, points[i].py); }
            doc.strokeColor(this.colors.accent).lineWidth(2).stroke();

            points.forEach(pt => {
                doc.circle(pt.px, pt.py, 4).fill(this.colors.white).strokeColor(this.colors.accent).lineWidth(2).stroke();
                doc.font('Helvetica-Bold').fontSize(8).fillColor(this.colors.text).text(Math.round(pt.score).toString(), pt.px - 10, pt.py - 15, { width: 20, align: 'center' });
                const dateStr = history[pt.i].createdAt ? new Date(history[pt.i].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `W${pt.i+1}`;
                doc.font('Helvetica').fontSize(8).fillColor(this.colors.muted).text(dateStr, pt.px - 20, cy + chartInnerH + 10, { width: 40, align: 'center' });
            });
        } else {
            doc.font('Helvetica').fontSize(10).fillColor(this.colors.muted).text('Insufficient historical data.', 70, y + 80);
        }
        
        y += 170;

        // 2. Language Distribution
        this.drawCard(doc, 50, y, chartW, 120, 'Technology Stack Ecosystem');
        const languages = data.insights.languages || [];
        if (languages.length > 0) {
            const topLangs = languages.slice(0, 5);
            let startX = 70;
            const barY = y + 50;
            const totalWidth = chartW - 40;
            const barColors = ['#111111', '#404040', '#737373', '#a3a3a3', '#d4d4d4'];

            topLangs.forEach((lang, i) => {
                const segmentWidth = (lang.percentage / 100) * totalWidth;
                if (segmentWidth > 0) {
                    doc.rect(startX, barY, segmentWidth, 16).fill(barColors[i % barColors.length]);
                    startX += segmentWidth;
                }
            });

            let legendX = 70;
            let legendY = barY + 30;
            topLangs.forEach((lang, i) => {
                const label = `${lang.name} ${lang.percentage}%`;
                const textWidth = doc.widthOfString(label) + 20;
                if (legendX + textWidth > 50 + chartW - 20) { legendX = 70; legendY += 20; }
                doc.circle(legendX, legendY + 4, 4).fill(barColors[i % barColors.length]);
                doc.font('Helvetica').fontSize(9).fillColor(this.colors.text).text(label, legendX + 10, legendY);
                legendX += textWidth + 10;
            });
        } else {
            doc.font('Helvetica').fontSize(10).fillColor(this.colors.muted).text('No language data found.', 70, y + 60);
        }
    }

    drawPage5SecurityIntelligence(doc, aiInsights, subtitle) {
        this.drawHeader(doc, 'Security Intelligence', subtitle);
        let y = 130;

        const securityLogs = aiInsights?.security || [];
        
        this.drawCard(doc, 50, y, doc.page.width - 100, 60);
        doc.font('Helvetica-Bold').fontSize(12).fillColor(this.colors.text).text('Audit Status:', 65, y + 25);
        const statusText = securityLogs.length === 0 ? 'CLEAN' : (securityLogs.some(s => s.severity === 'High') ? 'RISK DETECTED' : 'WARNINGS PRESENT');
        const statusColor = statusText === 'CLEAN' ? this.colors.success : (statusText === 'RISK DETECTED' ? this.colors.danger : this.colors.warning);
        doc.font('Helvetica-Bold').fontSize(12).fillColor(statusColor).text(statusText, 150, y + 25);
        
        y += 80;

        if (securityLogs.length === 0) {
            doc.font('Helvetica').fontSize(10).fillColor(this.colors.muted).text('No obvious security risks detected in recent commits.', 50, y);
            return;
        }

        securityLogs.forEach(sec => {
            const evH = sec.evidence ? Math.max(12, doc.heightOfString(sec.evidence, { width: doc.page.width - 210 })) : 0;
            const cardH = 110 + (evH > 12 ? evH : 0);
            this.drawCard(doc, 50, y, doc.page.width - 100, cardH);

            const sevColor = sec.severity === 'High' ? this.colors.danger : (sec.severity === 'Medium' ? this.colors.warning : this.colors.secondary);
            doc.roundedRect(65, y + 14, 55, 16, 8).fill(sevColor);
            doc.font('Helvetica-Bold').fontSize(7).fillColor(this.colors.white).text(sec.severity.toUpperCase(), 65, y + 18, { width: 55, align: 'center' });

            // Confidence badge
            const confColor = sec.confidence === 'High' ? this.colors.danger : (sec.confidence === 'Medium' ? this.colors.warning : this.colors.muted);
            doc.roundedRect(128, y + 14, 70, 16, 8).fill(this.colors.lighter);
            doc.font('Helvetica-Bold').fontSize(7).fillColor(confColor).text(`CONFIDENCE: ${(sec.confidence || 'Low').toUpperCase()}`, 128, y + 18, { width: 70, align: 'center' });

            doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.text).text(sec.issue, 65, y + 38);
            if (sec.affectedArea) {
                doc.font('Helvetica').fontSize(8).fillColor(this.colors.muted).text(`Area: ${sec.affectedArea}`, 65, y + 53);
            }
            if (sec.evidence) {
                doc.font('Helvetica-Bold').fontSize(8).fillColor(this.colors.text).text('Evidence:', 65, y + 68);
                doc.font('Helvetica').fontSize(8).fillColor(this.colors.textLight).text(sec.evidence, 125, y + 68, { width: doc.page.width - 200 });
            }
            doc.font('Helvetica-Bold').fontSize(8).fillColor(this.colors.accent).text('Fix:', 65, y + 82 + evH);
            doc.font('Helvetica').fontSize(8).fillColor(this.colors.textLight).text(sec.suggestion, 90, y + 82 + evH, { width: doc.page.width - 165 });

            y += cardH + 10;
        });
    }

    drawPage6WeeklyNarrative(doc, aiInsights, data, subtitle) {
        this.drawHeader(doc, 'Executive Narrative', subtitle);
        const globalScore = aiInsights?.globalScore || { total: 80, breakdown: {}, scoringNote: '' };
        let y = 130;

        // Large Global Score
        doc.font('Helvetica-Bold').fontSize(72).fillColor(this.colors.primaryDark).text(String(globalScore.total), 50, y, { align: 'center', width: doc.page.width - 100 });
        doc.font('Helvetica-Bold').fontSize(11).fillColor(this.colors.accent).text('GLOBAL INTELLIGENCE SCORE', 50, y + 76, { align: 'center', width: doc.page.width - 100 });
        if (globalScore.scoringNote) {
            doc.font('Helvetica').fontSize(9).fillColor(this.colors.muted).text(globalScore.scoringNote, 50, y + 93, { align: 'center', width: doc.page.width - 100 });
        }
        y += 120;

        // Score breakdown table
        const breakdown = globalScore.breakdown || {};
        const bKeys = Object.keys(breakdown);
        if (bKeys.length > 0) {
            const cols = bKeys.length;
            const colW = (doc.page.width - 100) / cols;
            bKeys.forEach((key, i) => {
                const bx = 50 + i * colW;
                const score = breakdown[key] ?? 0;
                const bColor = score >= 80 ? this.colors.success : (score >= 60 ? this.colors.accent : this.colors.warning);
                doc.roundedRect(bx + 5, y, colW - 10, 60, 4).fill(this.colors.lighter);
                doc.font('Helvetica-Bold').fontSize(20).fillColor(bColor).text(String(score), bx + 5, y + 8, { width: colW - 10, align: 'center' });
                doc.font('Helvetica').fontSize(7).fillColor(this.colors.muted).text(key.toUpperCase(), bx + 5, y + 42, { width: colW - 10, align: 'center' });
            });
            y += 76;
        }

        // Narrative block
        this.drawCard(doc, 50, y, doc.page.width - 100, 160);
        doc.font('Helvetica-Bold').fontSize(32).fillColor(this.colors.light).text('\u201C', 65, y + 12);
        const narrative = aiInsights?.narrative || 'Steady progression this week. Focus on consistent commits and code quality.';
        doc.font('Helvetica').fontSize(10).fillColor(this.colors.textLight).text(String(narrative), 65, y + 44, { width: doc.page.width - 130, lineGap: 5 });
        y += 178;

        doc.font('Helvetica').fontSize(8).fillColor(this.colors.muted).text('Generated by DevTrack Intelligence Engine  ·  AI-powered developer momentum analysis', 50, doc.page.height - 40, { align: 'center', width: doc.page.width - 100 });
    }

    // ─────────────────────────────────────────────────────────────────────────────

    async generatePDFReport(userId, preExistingData = null) {
        const userDoc = await collections.users().doc(userId).get();
        if (!userDoc.exists) {
            throw new Error(`User with ID ${userId} not found`);
        }
        const user = userDoc.data();
        
        const githubService = new GitHubService(getActiveGithubToken(user));
        
        let insights, repos, contributions, streak, recentActivity, aiInsights, history;

        if (preExistingData) {
            // Reconstruct from stored data
            insights = { stats: preExistingData.stats || {} };
            repos = []; // Not stored, but we can live without it for old reports or refactor
            contributions = { streak: preExistingData.stats?.streak || 0 };
            streak = contributions.streak;
            recentActivity = { totalEvents: (preExistingData.stats?.totalCommits || 0) + (preExistingData.stats?.totalPRs || 0) };
            aiInsights = preExistingData.aiInsights;
            history = [];
        } else {
            // Fresh generation — parallel fetch of all data sources
            [insights, repos, contributions] = await Promise.all([
                githubService.getGitHubInsights(user.githubUsername),
                githubService.getRepos(user.githubUsername, 10),
                githubService.getContributions(user.githubUsername)
            ]);

            streak = contributions?.streak || 0;

            // Get accurate 7-day weekly stats (fixes commit count bug)
            let weeklyStats = null;
            try {
                weeklyStats = await githubService.getWeeklyStats(user.githubUsername);
                console.log(`📊 Weekly stats: ${weeklyStats?.weekly?.commits} commits, ${weeklyStats?.weekly?.activeDays}/7 active days`);
            } catch (e) {
                console.warn('getWeeklyStats failed:', e.message);
            }

            try {
                // Fetch recent history for momentum line chart (in-memory sort avoids composite index)
                const reportsSnapshot = await collections.reports()
                    .where('userId', '==', userId)
                    .get();
                
                let allReports = reportsSnapshot.docs.map(d => d.data());
                allReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                history = allReports.slice(0, 4).reverse();
                
                // Most recent stored report for delta comparison
                const previousReport = allReports[0] || null;

                recentActivity = await githubService.getActivitySummary(user.githubUsername);
                const groqService = getGroqService();
                // Pass weeklyStats and previousReport for accurate counts + delta
                aiInsights = await groqService.generateWeeklyInsights(recentActivity, weeklyStats, previousReport);
                
                // Inject accurate weekly stats into aiInsights.dashboard.kpis for PDF rendering
                if (aiInsights?.dashboard?.kpis && weeklyStats) {
                    aiInsights.dashboard.kpis.weeklyCommits = weeklyStats.weekly.commits;
                    aiInsights.dashboard.kpis.weeklyPRs = weeklyStats.weekly.prs;
                    aiInsights.dashboard.kpis.consistencyScore = weeklyStats.behavioral.consistencyScore;
                    aiInsights._weeklyStats = weeklyStats; // attach for page renderers
                }

                // Add current data to history for momentum chart
                history.push({
                    createdAt: new Date().toISOString(),
                    aiInsights: aiInsights,
                    stats: { ...insights.stats, weeklyCommits: weeklyStats?.weekly?.commits }
                });
            } catch (e) {
                console.warn('Supplementary data failed:', e.message);
                history = [];
            }
        }

        const subtitle = preExistingData 
            ? new Date(preExistingData.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
            : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            
            // Footer drawing helper
            const drawFooter = (d) => {
                const footerY = d.page.height - 45;
                d.moveTo(50, footerY - 10).lineTo(d.page.width - 50, footerY - 10).strokeColor('#f1f5f9').lineWidth(1).stroke();
                d.font('Helvetica').fontSize(8).fillColor('#94a3b8')
                    .text('Confidential Weekly Performance Analysis • Generated by DevTrack Core AI Engine', 50, footerY, { align: 'center', width: d.page.width - 100 });
            };

            // Generate Impact Score early
            const activityBonus = (recentActivity?.totalEvents || 0) * 0.8;
            const impactScore = Math.min(99, Math.round((insights.rank?.score || 0) / 10 + activityBonus + (streak > 5 ? 10 : 0)));

            doc.on('end', () => {
                // Apply footer to all pages at the very end safely
                const range = doc.bufferedPageRange();
                for (let i = range.start; i < range.start + range.count; i++) {
                    doc.switchToPage(i);
                    
                    // Critical: temporarily disable margins to prevent auto-paging from the footer itself
                    const oldBottomMargin = doc.page.margins.bottom;
                    doc.page.margins.bottom = 0;
                    
                    drawFooter(doc);
                    
                    doc.page.margins.bottom = oldBottomMargin;
                }

                resolve({
                    pdfBuffer: Buffer.concat(chunks),
                    aiInsights: aiInsights,
                    stats: {
                        totalCommits: aiInsights?.dashboard?.kpis?.weeklyCommits ?? insights.stats?.totalCommits ?? 0,
                        totalPRs: aiInsights?.dashboard?.kpis?.weeklyPRs ?? insights.stats?.totalPRs ?? 0,
                        streak: streak,
                        impactScore: impactScore
                    }
                });
            });
            doc.on('error', reject);

            // ─────────────────────────────────────────────────────────────────────────────
            // 6-PAGE PDF RENDERING PIPELINE
            // ─────────────────────────────────────────────────────────────────────────────
            
            const renderData = {
                user,
                insights,
                repos: repos || [],
                // Use recentActivity repos — these have commitsThisWeek data
                activeRepos: Array.isArray(recentActivity?.reposWorkedOn)
                    ? recentActivity.reposWorkedOn
                    : Array.from((recentActivity?.reposWorkedOn || new Map()).values()),
                stats: insights.stats || {}
            };

            try {
                // PAGE 1: Executive Dashboard
                this.drawPage1ExecutiveDashboard(doc, renderData, aiInsights, subtitle);
                
                // PAGE 2: Performance Intelligence
                doc.addPage();
                this.drawPage2PerformanceIntelligence(doc, aiInsights, subtitle);

                // PAGE 3: Repository Intelligence (use activeRepos — has weekly commit data)
                doc.addPage();
                this.drawPage3RepositoryIntelligence(doc, renderData.activeRepos.length > 0 ? renderData.activeRepos : renderData.repos, aiInsights, subtitle);

                // PAGE 4: Advanced Analytics
                doc.addPage();
                this.drawPage4AdvancedAnalytics(doc, renderData, history, subtitle);

                // PAGE 5: Security Intelligence
                doc.addPage();
                this.drawPage5SecurityIntelligence(doc, aiInsights, subtitle);

                // PAGE 6: Executive Narrative
                doc.addPage();
                this.drawPage6WeeklyNarrative(doc, aiInsights, renderData, subtitle);
            } catch (err) {
                console.error("PDF Rendering Error:", err);
                doc.font('Helvetica-Bold').fontSize(14).fillColor(this.colors.danger).text('Error Rendering PDF', 50, 150);
                doc.font('Helvetica').fontSize(10).fillColor(this.colors.text).text(err.message, 50, 180);
            }

            doc.end();
        });
    }

    async sendWeeklyReportEmail(userId) {
        try {
            const userDoc = await collections.users().doc(userId).get();
            if (!userDoc.exists) {
                console.log(`User ${userId} not found`);
                return { success: false, error: 'User not found' };
            }

            const user = userDoc.data();
            if (!user.email) {
                console.log(`User ${userId} has no email`);
                return { success: false, error: 'No email' };
            }

            if (!user.githubUsername) {
                console.log(`User ${userId} has no GitHub connected`);
                return { success: false, error: 'GitHub not connected' };
            }

            console.log(`Generating PDF report and AI Insights for ${user.email}...`);
            const reportData = await this.generatePDFReport(userId);
            const { pdfBuffer, aiInsights, stats } = reportData;

            const aiSummary = aiInsights ? aiInsights.executiveSummary || aiInsights.summary : '';

            // Store the report data in Firestore for historical tracking
            try {
                const reportRef = collections.reports().doc();
                await reportRef.set({
                    userId: userId,
                    createdAt: new Date().toISOString(),
                    stats: stats,
                    aiInsights: aiInsights || null
                });
                console.log(`Saved report history to Firestore for ${user.email}`);
            } catch (dbError) {
                console.error(`Failed to save report history to Firestore:`, dbError);
                // Continue sending email even if db save fails
            }

            console.log(`Sending report to ${user.email}...`);
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
            console.error(`Error sending report to user ${userId}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * sendWeeklyReport — used by reportQueueService for queue-based delivery.
     * Alias for sendWeeklyReportEmail with options support.
     * @param {string} userId
     */
    async sendWeeklyReport(userId, options = {}) {
        return this.sendWeeklyReportEmail(userId);
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

