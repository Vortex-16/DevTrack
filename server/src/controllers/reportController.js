/**
 * Report Controller
 * Manages PDF report history, per-user scheduling, and manual triggers.
 */

const { db, collections } = require('../config/firebase');
const reportService = require('../services/reportService');
const reportQueue = require('../services/reportQueueService');
const { APIError } = require('../middleware/errorHandler');

// Days of week labels for validation
const VALID_DAYS = [0, 1, 2, 3, 4, 5, 6]; // 0=Sun, 6=Sat
const VALID_HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23

// ─── Report History ───────────────────────────────────────────────────────────

exports.getUserReports = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);

        const reportsSnapshot = await collections.reports()
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();

        const reports = reportsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.status(200).json({
            success: true,
            data: reports,
            total: reports.length,
        });
    } catch (error) {
        next(error);
    }
};

// ─── Download Report ──────────────────────────────────────────────────────────

exports.downloadReport = async (req, res, next) => {
    try {
        const { reportId } = req.params;
        const userId = req.auth.userId;

        const reportDoc = await collections.reports().doc(reportId).get();

        if (!reportDoc.exists) {
            return res.status(404).json({ success: false, error: 'Report not found' });
        }

        const reportData = reportDoc.data();

        if (reportData.userId !== userId) {
            return res.status(403).json({ success: false, error: 'Unauthorized access to this report' });
        }

        console.log(`📥 PDF download for report ${reportId} by user ${userId}`);
        const { pdfBuffer } = await reportService.generatePDFReport(userId, reportData);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=DevTrack-Report-${(reportData.createdAt || '').split('T')[0] || 'download'}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
};

// ─── Schedule Management ──────────────────────────────────────────────────────

/**
 * GET /api/reports/schedule
 * Returns the user's current report schedule preference.
 */
exports.getSchedule = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const userDoc = await collections.users().doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        // Default: Monday 15:00 UTC (8:30 PM IST)
        const schedule = userData.reportPreferences || {
            dayOfWeek: 1,
            hour: 15,
            frequency: 'weekly',
            enabled: true,
        };

        res.status(200).json({ success: true, data: schedule });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/reports/schedule
 * Save/update the user's report schedule preference.
 * Body: { dayOfWeek: 0-6, hour: 0-23, frequency: 'weekly', enabled: boolean }
 */
exports.saveSchedule = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { dayOfWeek, hour, frequency = 'weekly', enabled = true } = req.body;

        // Validate
        if (dayOfWeek !== undefined && !VALID_DAYS.includes(Number(dayOfWeek))) {
            throw new APIError('dayOfWeek must be 0–6 (0=Sunday, 6=Saturday)', 400);
        }
        if (hour !== undefined && !VALID_HOURS.includes(Number(hour))) {
            throw new APIError('hour must be 0–23 (UTC)', 400);
        }

        const schedule = {
            dayOfWeek: Number(dayOfWeek ?? 1),
            hour: Number(hour ?? 15),
            frequency: ['weekly', 'biweekly'].includes(frequency) ? frequency : 'weekly',
            enabled: Boolean(enabled),
        };

        await collections.users().doc(userId).update({
            reportPreferences: schedule,
            updatedAt: new Date().toISOString(),
        });

        res.status(200).json({
            success: true,
            message: 'Report schedule updated',
            data: schedule,
        });
    } catch (error) {
        next(error);
    }
};

// ─── Queue Status ─────────────────────────────────────────────────────────────

/**
 * GET /api/reports/status
 * Returns the user's queue job status and last report sent time.
 */
exports.getQueueStatus = async (req, res, next) => {
    try {
        const userId = req.auth.userId;

        const [userDoc, lastJob, jobHistory] = await Promise.all([
            collections.users().doc(userId).get(),
            reportQueue.getLastCompletedJob(userId),
            reportQueue.getJobHistory(userId, 3),
        ]);

        const userData = userDoc.exists ? userDoc.data() : {};

        // Find any pending/processing job
        const pendingJob = await db.collection('reportJobs')
            .where('userId', '==', userId)
            .where('status', 'in', ['pending', 'processing'])
            .limit(1)
            .get();

        res.status(200).json({
            success: true,
            data: {
                lastReportSentAt: userData.lastReportSentAt || null,
                lastCompletedJob: lastJob,
                recentJobs: jobHistory,
                pendingJob: pendingJob.empty ? null : {
                    id: pendingJob.docs[0].id,
                    ...pendingJob.docs[0].data(),
                },
                schedule: userData.reportPreferences || { dayOfWeek: 1, hour: 15, frequency: 'weekly', enabled: true },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── Manual Trigger ───────────────────────────────────────────────────────────

/**
 * POST /api/reports/trigger
 * Queue an on-demand report for the authenticated user.
 */
exports.triggerReport = async (req, res, next) => {
    try {
        const userId = req.auth.userId;

        const userDoc = await collections.users().doc(userId).get();
        if (!userDoc.exists) throw new APIError('User not found', 404);

        const userData = userDoc.data();
        if (!userData.email) throw new APIError('Email not found on your account. Please update your profile.', 400);

        const result = await reportQueue.triggerManualReport(
            userId,
            userData.email,
            userData.githubUsername
        );

        if (result.alreadyQueued) {
            return res.status(200).json({
                success: true,
                message: 'A report is already queued for your account. It will be delivered shortly.',
                data: { jobId: result.jobId, alreadyQueued: true },
            });
        }

        res.status(201).json({
            success: true,
            message: 'Report queued! You\'ll receive it via email within a few minutes.',
            data: { jobId: result.jobId, alreadyQueued: false },
        });
    } catch (error) {
        next(error);
    }
};
