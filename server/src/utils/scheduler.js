// DevTrack Scheduler
// ─────────────────────────────────────────────────────────────────────────
// All node-cron scheduled jobs for automated notifications and background tasks.
// Times use UTC — server is hosted on Render (international).
//
// IST reference (UTC+5:30):
//   7:00 AM IST  = 01:30 UTC
//   9:00 AM IST  = 03:30 UTC
//   8:00 PM IST  = 14:30 UTC
//   Every 5 min  = "*/5 * * * *"
//   Every 30 min = "*/30 * * * *"
// ─────────────────────────────────────────────────────────────────────────

const cron = require('node-cron');
const { getNotificationService } = require('../services/notificationService');
const { refreshProjectsBatch } = require('../services/projectRefreshService');
const { refreshAllGitHubAvatars } = require('../services/profileSyncService');
const reportQueue = require('../services/reportQueueService');

const initializeScheduler = () => {
    console.log('Initializing DevTrack Scheduler...');
    const svc = getNotificationService();

    // ── JOB 1: Consistency Reminders ─────────────────────────────────────────
    // Every 5 minutes — checks if any user's adaptive/fixed reminder time has arrived.
    // Low overhead: only fires FCM for users whose time matches ±5 min window.
    cron.schedule('*/5 * * * *', async () => {
        try {
            await svc.checkAndSendReminders();
        } catch (error) {
            console.error('[Cron] Consistency Reminders:', error.message);
        }
    });

    // ── JOB 2: Streak Milestone Check ────────────────────────────────────────
    // Daily at 7:00 AM IST (01:30 UTC) — celebrate 7/14/30/50/100-day streaks.
    cron.schedule('30 1 * * *', async () => {
        try {
            console.log('[Cron] Streak milestone check...');
            await svc.checkStreakMilestones();
        } catch (error) {
            console.error('[Cron] Streak Milestones:', error.message);
        }
    });

    // ── JOB 3: Task Due Reminders ────────────────────────────────────────────
    // Daily at 9:00 AM IST (03:30 UTC) — notify users of high-priority tasks
    // due today or tomorrow.
    cron.schedule('30 3 * * *', async () => {
        try {
            console.log('[Cron] Task due date check...');
            await svc.checkTasksDue();
        } catch (error) {
            console.error('[Cron] Task Due check:', error.message);
        }
    });

    // ── JOB 4: Dynamic Activity Check (Evening) ──────────────────────────────
    // Daily at 8:00 PM IST (14:30 UTC) — fires "no commits today" alerts and
    // project revival nudges for users who haven't been active.
    cron.schedule('30 14 * * *', async () => {
        try {
            console.log('[Cron] Evening dynamic activity check...');
            await svc.checkDynamicNotifs();
        } catch (error) {
            console.error('[Cron] Dynamic Notifs:', error.message);
        }
    });

    // ── JOB 5: Report Queue Enqueuer (Per-User Scheduling) ───────────────────
    // Runs every hour at :00 — checks which users are due for their weekly
    // report (based on their reportPreferences.dayOfWeek + reportPreferences.hour)
    // and enqueues a job for them.
    //
    // REPLACES the old "Monday 8:20 PM IST all-at-once" approach.
    // Each user can now have an individualized schedule stored in their user doc.
    // Default schedule: Monday 15:00 UTC (8:30 PM IST) if no preference set.
    cron.schedule('0 * * * *', async () => {
        try {
            const { enqueued, skipped } = await reportQueue.enqueueWeeklyJobs();
            if (enqueued > 0) {
                console.log(`[Cron] Enqueued ${enqueued} weekly report jobs (${skipped} skipped)`);
            }
        } catch (error) {
            console.error('[Cron] Report queue enqueue:', error.message);
        }
    });

    // ── JOB 6: Report Queue Processor ────────────────────────────────────────
    // Every 30 minutes — processes up to 5 pending report jobs from Firestore queue.
    // Atomic job claiming via Firestore transactions prevents double-processing.
    // Jobs retry up to 3 times with exponential backoff (15m → 30m → 60m).
    cron.schedule('*/30 * * * *', async () => {
        try {
            const { processed, failed } = await reportQueue.processQueue(5);
            if (processed > 0 || failed > 0) {
                console.log(`[Cron] Report queue: processed=${processed}, failed=${failed}`);
            }
        } catch (error) {
            console.error('[Cron] Report queue processor:', error.message);
        }
    });

    // ── JOB 7: Auto Project Refresh (Randomized Weekly) ─────────────────────
    // Daily at 4:40 AM IST (23:10 UTC previous day) — picks a randomized due
    // subset so each project gets refreshed roughly once a week without bursts.
    cron.schedule('10 23 * * *', async () => {
        try {
            console.log('[Cron] Auto project refresh batch...');
            const summary = await refreshProjectsBatch();
            console.log(`[Cron] Project refresh | scanned=${summary.scanned} due=${summary.due} refreshed=${summary.refreshed} failed=${summary.failed}`);
        } catch (error) {
            console.error('[Cron] Auto project refresh:', error.message);
        }
    });

    // ── JOB 8: Weekly GitHub Avatar Refresh ─────────────────────────────────
    // Weekly at 2:10 AM UTC on Monday — refresh GitHub-linked profile photos.
    cron.schedule('10 2 * * 1', async () => {
        try {
            console.log('[Cron] Weekly GitHub avatar refresh...');
            const summary = await refreshAllGitHubAvatars();
            console.log(`[Cron] Avatar refresh | checked=${summary.checked} updated=${summary.updated} skipped=${summary.skipped}`);
        } catch (error) {
            console.error('❌ [Cron] Avatar refresh:', error.message);
        }
    });

    // ── JOB 9: Daily Quota Reset ──────────────────────────────────────────────
    // Daily at 00:00 UTC — flushes daily quota counters & logs reset metrics.
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('[Cron] Daily quota reset starting...');
            const cache = require('../config/cache');
            cache.delByPrefix('quota:');
            console.log('[Cron] Daily quota reset completed');
        } catch (error) {
            console.error('[Cron] Daily quota reset:', error.message);
        }
    });

    // ── JOB 10: Monthly Quota Reset & Grandfathering Check ───────────────────
    // 1st of every month at 00:05 UTC — monthly quota reset & trial check.
    cron.schedule('5 0 1 * *', async () => {
        try {
            console.log('[Cron] Monthly quota reset starting...');
            const cache = require('../config/cache');
            cache.delByPrefix('quota:');
            console.log('[Cron] Monthly quota reset completed');
        } catch (error) {
            console.error('[Cron] Monthly quota reset:', error.message);
        }
    });

    console.log('✅ Scheduler initialized — 10 cron jobs active');
    console.log('   • Every 5 min    → Consistency reminders');
    console.log('   • Every 30 min   → Report queue processor (Firestore-native)');
    console.log('   • Every hour     → Report queue enqueuer (per-user schedule)');
    console.log('   • 7:00 AM IST    → Streak milestone check');
    console.log('   • 9:00 AM IST    → Task due reminders');
    console.log('   • 8:00 PM IST    → Dynamic activity check');
    console.log('   • 4:40 AM IST    → Auto project refresh batch');
    console.log('   • Mon 2:10 AM    → Weekly GitHub avatar refresh');
    console.log('   • 00:00 UTC Daily → Daily quota reset');
    console.log('   • 1st of month    → Monthly quota reset');
};

module.exports = { initializeScheduler };
