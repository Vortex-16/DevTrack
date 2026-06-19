#!/usr/bin/env node
/**
 * Weekly report PDF preview harness.
 *
 * Modes:
 *   node scripts/preview-report.js                 # --mock (default): instant, offline, no API cost
 *   node scripts/preview-report.js --mock          # explicit mock mode
 *   node scripts/preview-report.js --mock --empty  # mock with stripped AI data (tests graceful fallbacks)
 *   node scripts/preview-report.js --user <id>     # REAL data for a specific Firestore user
 *   node scripts/preview-report.js --user          # REAL data for the first user found
 *   node scripts/preview-report.js --no-open       # don't auto-open the PDF
 *
 * Output: server/report-preview.pdf  (auto-opened on win/mac/linux)
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const reportService = require('../src/services/reportService');

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueOf = (flag) => {
    const i = args.indexOf(flag);
    if (i === -1) return undefined;
    const next = args[i + 1];
    return next && !next.startsWith('--') ? next : undefined;
};

const OUT = path.resolve(__dirname, '../report-preview.pdf');
const shouldOpen = !has('--no-open');
const realMode = has('--user') || has('--email');

function openFile(file) {
    if (!shouldOpen) return;
    const platform = process.platform;
    try {
        if (platform === 'win32') {
            // 'start' is a cmd builtin; empty title arg avoids quoting issues
            spawn('cmd', ['/c', 'start', '', file], { detached: true, stdio: 'ignore' }).unref();
        } else if (platform === 'darwin') {
            spawn('open', [file], { detached: true, stdio: 'ignore' }).unref();
        } else {
            spawn('xdg-open', [file], { detached: true, stdio: 'ignore' }).unref();
        }
        console.log('🖥️  Opening PDF…');
    } catch (e) {
        console.warn('Could not auto-open PDF:', e.message);
    }
}

async function runMock() {
    const data = { ...require('./mockReportData') };

    if (has('--empty')) {
        // Strip AI + supplementary data to exercise the graceful-fallback paths.
        data.aiInsights = {};
        data.repos = [];
        data.activeRepos = [];
        data.history = [];
        data.recentActivity = { totalEvents: 0 };
        console.log('🧪 --empty: rendering with stripped AI/repo/history data');
    }

    console.log('🎨 Rendering MOCK report (offline, no API calls)…');
    const { pdfBuffer } = await reportService.renderReportDocument(data);
    fs.writeFileSync(OUT, pdfBuffer);
    console.log(`✅ Saved ${OUT} (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
    openFile(OUT);
}

async function runReal() {
    const { initializeFirebase, collections } = require('../src/config/firebase');
    await initializeFirebase();

    let userId = valueOf('--user');

    if (!userId && valueOf('--email')) {
        const email = valueOf('--email');
        const snap = await collections.users().where('email', '==', email).limit(1).get();
        if (snap.empty) throw new Error(`No user found with email ${email}`);
        userId = snap.docs[0].id;
    }

    if (!userId) {
        const snap = await collections.users().limit(1).get();
        if (snap.empty) throw new Error('No users found in Firestore');
        userId = snap.docs[0].id;
        console.log(`ℹ️  No --user id given; using first user: ${userId}`);
    }

    console.log(`🌐 Generating REAL report for user ${userId} (live GitHub + AI)…`);
    const { pdfBuffer, stats } = await reportService.generatePDFReport(userId);
    fs.writeFileSync(OUT, pdfBuffer);
    console.log(`✅ Saved ${OUT} (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
    console.log('📊 Stats:', stats);
    openFile(OUT);
}

(async () => {
    try {
        if (realMode) {
            await runReal();
        } else {
            await runMock();
        }
        process.exit(0);
    } catch (err) {
        console.error('💥 Preview failed:', err);
        process.exit(1);
    }
})();
