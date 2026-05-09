/**
 * Report Queue Service — Firestore-native Job Queue
 *
 * Manages per-user PDF report scheduling without Redis.
 * Jobs are stored in the `reportJobs` Firestore collection.
 *
 * Job lifecycle:
 *   pending → processing → completed
 *                        → failed (retried up to MAX_RETRIES times)
 *                        → abandoned (after max retries)
 *
 * The cron job (scheduler.js) runs every 30 minutes and calls processQueue()
 * to pick up and process due jobs, one at a time per user to avoid race conditions.
 */

const { getFirestore, collections } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');

const MAX_RETRIES = 3;

// ─── Job Schema ───────────────────────────────────────────────────────────────
// {
//   userId:         string  — Firestore user doc ID
//   email:          string  — user email for sending the report
//   username:       string  — GitHub username
//   status:         'pending' | 'processing' | 'completed' | 'failed' | 'abandoned'
//   scheduledAt:    ISO string — when this job is due to run
//   createdAt:      ISO string
//   updatedAt:      ISO string
//   retries:        number  — how many times we've attempted
//   lastError:      string  — last error message (if failed)
//   completedAt:    ISO string — when successfully completed
//   reportType:     'weekly' | 'manual'
// }

// ─── Enqueue ─────────────────────────────────────────────────────────────────

/**
 * Enqueue a report job for a user.
 * If the user already has a pending/processing job, skip (idempotent).
 *
 * @param {string} userId
 * @param {object} options
 * @param {string} options.email
 * @param {string} options.username
 * @param {Date|string} [options.scheduledAt] - defaults to now
 * @param {'weekly'|'manual'} [options.reportType]
 * @returns {Promise<{jobId: string, alreadyQueued: boolean}>}
 */
const enqueueJob = async (userId, options = {}) => {
    const { email, username, scheduledAt, reportType = 'weekly' } = options;

    // Check for an existing pending/processing job to prevent duplicates
    const existing = await getFirestore().collection('reportJobs')
        .where('userId', '==', userId)
        .where('status', 'in', ['pending', 'processing'])
        .limit(1)
        .get();

    if (!existing.empty) {
        return { jobId: existing.docs[0].id, alreadyQueued: true };
    }

    const now = new Date();
    const dueAt = scheduledAt ? new Date(scheduledAt) : now;

    const jobRef = getFirestore().collection('reportJobs').doc();
    await jobRef.set({
        userId,
        email: email || null,
        username: username || null,
        status: 'pending',
        reportType,
        scheduledAt: dueAt.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        retries: 0,
        lastError: null,
        completedAt: null,
    });

    console.log(`📬 Enqueued ${reportType} report job ${jobRef.id} for user ${userId}, due at ${dueAt.toISOString()}`);
    return { jobId: jobRef.id, alreadyQueued: false };
};

// ─── Queue All Active Users ───────────────────────────────────────────────────

/**
 * Enqueue weekly report jobs for all active users based on their schedule preference.
 * Called by the cron scheduler.
 *
 * A user is due if:
 *   1. Their preferences.reportSchedule.dayOfWeek matches today (0=Sun…6=Sat)
 *   2. Their preferences.reportSchedule.hour matches current UTC hour
 *   3. They haven't received a report in the last 6 days
 *
 * @returns {Promise<{enqueued: number, skipped: number}>}
 */
const enqueueWeeklyJobs = async () => {
    const now = new Date();
    const currentDay = now.getUTCDay();   // 0=Sun, 1=Mon, …, 6=Sat
    const currentHour = now.getUTCHours();

    const sixDaysAgo = new Date(now);
    sixDaysAgo.setUTCDate(sixDaysAgo.getUTCDate() - 6);

    let enqueued = 0;
    let skipped = 0;

    try {
        // Fetch all users with email (required for sending)
        const usersSnapshot = await collections.users()
            .select('email', 'githubUsername', 'reportPreferences', 'lastReportSentAt')
            .get();

        const jobs = [];

        for (const userDoc of usersSnapshot.docs) {
            const data = userDoc.data();
            if (!data.email) { skipped++; continue; }

            // Use reportPreferences (matches reportController.js)
            const schedule = data.reportPreferences || { dayOfWeek: 1, hour: 15 };
            const targetDay = typeof schedule.dayOfWeek === 'number' ? schedule.dayOfWeek : 1;
            const targetHour = typeof schedule.hour === 'number' ? schedule.hour : 15;

            if (currentDay !== targetDay) { skipped++; continue; }
            if (currentHour !== targetHour) { skipped++; continue; }

            // Don't send if already sent in the last 6 days
            if (data.lastReportSentAt) {
                const lastSent = new Date(data.lastReportSentAt);
                if (lastSent > sixDaysAgo) { skipped++; continue; }
            }

            jobs.push({
                userId: userDoc.id,
                email: data.email,
                username: data.githubUsername || null,
            });
        }

        // Enqueue all due jobs (in parallel, up to 10 at a time)
        const CHUNK_SIZE = 10;
        for (let i = 0; i < jobs.length; i += CHUNK_SIZE) {
            const chunk = jobs.slice(i, i + CHUNK_SIZE);
            const results = await Promise.allSettled(
                chunk.map(job => enqueueJob(job.userId, job))
            );
            results.forEach(result => {
                if (result.status === 'fulfilled' && !result.value.alreadyQueued) {
                    enqueued++;
                } else {
                    skipped++;
                }
            });
        }

        console.log(`📊 Weekly report queue: enqueued=${enqueued}, skipped=${skipped}`);
        return { enqueued, skipped };
    } catch (err) {
        console.error('❌ Error in enqueueWeeklyJobs:', err.message);
        return { enqueued, skipped };
    }
};

// ─── Process Queue ────────────────────────────────────────────────────────────

/**
 * Process the next batch of due pending jobs.
 * Called by the cron scheduler every 30 minutes.
 *
 * Uses Firestore transactions to atomically claim a job (pending → processing)
 * before processing it, preventing race conditions if multiple instances run.
 *
 * @param {number} [batchSize=5] - max jobs to process per invocation
 * @param {string} [targetUserId] - optional: process only jobs for this user
 * @returns {Promise<{processed: number, failed: number}>}
 */
const processQueue = async (batchSize = 5, targetUserId = null) => {
    const now = new Date();
    let processed = 0;
    let failed = 0;

    const reportService = require('./reportService');

    try {
        const pendingJobsSnapshot = await getFirestore().collection('reportJobs')
            .where('status', '==', 'pending')
            .get();

        if (pendingJobsSnapshot.empty) {
            console.log('📭 Report queue: no jobs pending');
            return { processed: 0, failed: 0 };
        }

        const nowStr = now.toISOString();
        
        // Filter in-memory for jobs that are due to avoid composite index error
        let dueJobsDocs = pendingJobsSnapshot.docs
            .filter(doc => doc.data().scheduledAt <= nowStr);

        // If targetUserId is provided, prioritize/limit to that user
        if (targetUserId) {
            dueJobsDocs = dueJobsDocs.filter(doc => doc.data().userId === targetUserId);
        }

        dueJobsDocs = dueJobsDocs
            .sort((a, b) => a.data().scheduledAt.localeCompare(b.data().scheduledAt))
            .slice(0, batchSize);

        if (dueJobsDocs.length === 0) {
            console.log('📭 Report queue: no jobs due');
            return { processed: 0, failed: 0 };
        }

        console.log(`⚙️ Processing ${dueJobsDocs.length} report job(s)...`);

        for (const jobDoc of dueJobsDocs) {
            const job = jobDoc.data();
            const jobRef = jobDoc.ref;

            try {
                // Atomically claim the job: pending → processing
                const claimed = await getFirestore().runTransaction(async (tx) => {
                    const current = await tx.get(jobRef);
                    if (!current.exists || current.data().status !== 'pending') {
                        return false; // Already claimed by another instance
                    }
                    tx.update(jobRef, {
                        status: 'processing',
                        updatedAt: now.toISOString(),
                    });
                    return true;
                });

                if (!claimed) {
                    console.log(`⏭️ Job ${jobDoc.id} already claimed, skipping`);
                    continue;
                }

                // Process the job — this may take 10-30 seconds
                console.log(`📄 Processing ${job.reportType || 'weekly'} report for user ${job.userId}...`);
                const result = await reportService.sendWeeklyReport(job.userId, { 
                    fromQueue: true,
                    reportType: job.reportType || 'weekly'
                });

                if (!result || result.success === false) {
                    throw new Error(result?.error || 'Report generation failed without specific error');
                }

                // Mark completed and record timestamp on user doc
                const completedAt = new Date().toISOString();
                await jobRef.update({
                    status: 'completed',
                    completedAt,
                    updatedAt: completedAt,
                });

                await collections.users().doc(job.userId).update({
                    lastReportSentAt: completedAt,
                });

                processed++;
                console.log(`✅ Report job ${jobDoc.id} completed for user ${job.userId}`);
            } catch (jobErr) {
                failed++;
                const retries = (job.retries || 0) + 1;
                const nextStatus = retries >= MAX_RETRIES ? 'abandoned' : 'failed';

                // Exponential backoff: retry after 15min, 30min, 1hr
                const backoffMinutes = [15, 30, 60][retries - 1] || 60;
                const retryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

                await jobRef.update({
                    status: nextStatus,
                    retries,
                    lastError: jobErr.message?.substring(0, 500) || 'Unknown error',
                    scheduledAt: nextStatus === 'failed' ? retryAt.toISOString() : jobDoc.data().scheduledAt,
                    updatedAt: new Date().toISOString(),
                }).catch(() => null);

                console.error(`❌ Report job ${jobDoc.id} failed (attempt ${retries}/${MAX_RETRIES}):`, jobErr.message);

                if (nextStatus === 'failed') {
                    // Re-enqueue for retry by resetting to pending after backoff
                    await jobRef.update({ status: 'pending' }).catch(() => null);
                }
            }
        }

        return { processed, failed };
    } catch (err) {
        console.error('❌ Critical error in processQueue:', err.message);
        return { processed, failed };
    }
};

// ─── Job History ──────────────────────────────────────────────────────────────

/**
 * Get report job history for a user (for frontend display).
 * @param {string} userId
 * @param {number} [limit=10]
 */
const getJobHistory = async (userId, limit = 10) => {
    const snapshot = await getFirestore().collection('reportJobs')
        .where('userId', '==', userId)
        .get();

    const jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }));

    // Sort by createdAt desc in-memory
    jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return jobs.slice(0, limit);
};

/**
 * Get the last completed report job for a user.
 * @param {string} userId
 */
const getLastCompletedJob = async (userId) => {
    const snapshot = await getFirestore().collection('reportJobs')
        .where('userId', '==', userId)
        .where('status', '==', 'completed')
        .get();

    if (snapshot.empty) return null;

    const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort by completedAt desc in-memory
    jobs.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    return jobs[0];
};

/**
 * Manually trigger a report for a user (on-demand from the frontend).
 * @param {string} userId
 * @param {string} email
 * @param {string} username
 * @returns {Promise<{jobId: string}>}
 */
const triggerManualReport = async (userId, email, username) => {
    const result = await enqueueJob(userId, {
        email,
        username,
        scheduledAt: new Date(),
        reportType: 'manual',
    });

    // Kick off processing in the background immediately for THIS user
    // We don't await this so the API response remains fast
    processQueue(1, userId).catch(err => console.error('Error starting manual job processing:', err));

    return result;
};

module.exports = {
    enqueueJob,
    enqueueWeeklyJobs,
    processQueue,
    getJobHistory,
    getLastCompletedJob,
    triggerManualReport,
    MAX_RETRIES,
};
