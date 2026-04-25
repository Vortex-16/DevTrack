// DevTrack Scheduler
// ─────────────────────────────────────────────────────────────────────────
// All node-cron scheduled jobs for automated notifications.
// Times use UTC — server is hosted internationally.
//
// IST reference (UTC+5:30):
//   7:00 AM IST  = 01:30 UTC
//   9:00 AM IST  = 03:30 UTC
//   8:00 PM IST  = 14:30 UTC
//   Every 5 min  = "* /5 * * * *" (no space in actual cron string)
// ─────────────────────────────────────────────────────────────────────────

const cron = require('node-cron');
const { getNotificationService } = require('../services/notificationService');
const { refreshProjectsBatch } = require('../services/projectRefreshService');
const { refreshAllGitHubAvatars } = require('../services/profileSyncService');

const initializeScheduler = () => {
    console.log('⏰ Initializing DevTrack Notification Scheduler...');
    const svc = getNotificationService();

    // ── JOB 1: Consistency Reminders ─────────────────────────────────────────
    // Every 5 minutes — checks if any user's adaptive/fixed reminder time has arrived.
    // Low overhead: only fires FCM for users whose time matches ±5 min window.
    cron.schedule('*/5 * * * *', async () => {
        try {
            console.log('🔔 [Cron] Consistency reminder check...');
            await svc.checkAndSendReminders();
        } catch (error) {
            console.error('❌ [Cron] Consistency Reminders error:', error.message);
        }
    });

    // ── JOB 2: Streak Milestone Check ────────────────────────────────────────
    // Daily at 7:00 AM IST (01:30 UTC) — celebrate 7/14/30/50/100-day streaks.
    cron.schedule('30 1 * * *', async () => {
        try {
            console.log('🏆 [Cron] Streak milestone check...');
            await svc.checkStreakMilestones();
        } catch (error) {
            console.error('❌ [Cron] Streak Milestones error:', error.message);
        }
    });

    // ── JOB 3: Task Due Reminders ────────────────────────────────────────────
    // Daily at 9:00 AM IST (03:30 UTC) — notify users of high-priority tasks
    // due today or tomorrow.
    cron.schedule('30 3 * * *', async () => {
        try {
            console.log('📋 [Cron] Task due date check...');
            await svc.checkTasksDue();
        } catch (error) {
            console.error('❌ [Cron] Task Due check error:', error.message);
        }
    });

    // ── JOB 4: Dynamic Activity Check (Evening) ──────────────────────────────
    // Daily at 8:00 PM IST (14:30 UTC) — fires "no commits today" alerts and
    // project revival nudges for users who haven't been active.
    cron.schedule('30 14 * * *', async () => {
        try {
            console.log('🔍 [Cron] Evening dynamic activity check (8 PM IST)...');
            await svc.checkDynamicNotifs();
        } catch (error) {
            console.error('❌ [Cron] Dynamic Notifs error:', error.message);
        }
    });

    // ── JOB 5: Weekly GitHub PDF Report ──────────────────────────────────────
    // Every Monday at ~8:20 PM IST (14:50 UTC) — comprehensive activity report.
    cron.schedule('50 14 * * 1', async () => {
        try {
            console.log('📊 [Cron] Weekly PDF Report generation...');
            const reportService = require('../services/reportService');
            await reportService.sendAllWeeklyReports();
        } catch (error) {
            console.error('❌ [Cron] Weekly Reports error:', error.message);
        }
    });

    // ── JOB 6: Auto Project Refresh (Randomized Weekly) ─────────────────────
    // Daily at 4:40 AM IST (23:10 UTC previous day) — picks a randomized due
    // subset so each project gets refreshed roughly once a week without bursts.
    cron.schedule('10 23 * * *', async () => {
        try {
            console.log('♻️ [Cron] Auto project refresh batch...');
            const summary = await refreshProjectsBatch();
            console.log(`✅ [Cron] Project refresh done | scanned=${summary.scanned} due=${summary.due} selected=${summary.selected || 0} refreshed=${summary.refreshed} failed=${summary.failed}`);
        } catch (error) {
            console.error('❌ [Cron] Auto project refresh error:', error.message);
        }
    });

    // ── JOB 7: Weekly GitHub Avatar Refresh ─────────────────────────────────
    // Weekly at 2:10 AM UTC on Monday — refresh GitHub-linked profile photos.
    cron.schedule('10 2 * * 1', async () => {
        try {
            console.log('🖼️ [Cron] Weekly GitHub avatar refresh...');
            const summary = await refreshAllGitHubAvatars();
            console.log(`✅ [Cron] Avatar refresh done | checked=${summary.checked} updated=${summary.updated} skipped=${summary.skipped}`);
        } catch (error) {
            console.error('❌ [Cron] Avatar refresh error:', error.message);
        }
    });

    console.log('✅ Scheduler initialized — 7 cron jobs active');
    console.log('   • Every 5 min  → Consistency reminders');
    console.log('   • 7:00 AM IST  → Streak milestone check');
    console.log('   • 9:00 AM IST  → Task due reminders');
    console.log('   • 8:00 PM IST  → Dynamic activity check');
    console.log('   • Mon 8:20 PM  → Weekly PDF reports');
    console.log('   • 4:40 AM IST  → Auto project refresh batch');
    console.log('   • Mon 2:10 AM  → Weekly GitHub avatar refresh');
};

module.exports = { initializeScheduler };
