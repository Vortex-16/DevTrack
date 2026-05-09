/**
 * Report Controller
 * Manages PDF report history, per-user scheduling, and manual triggers.
 */

const { getFirestore, collections } = require('../config/firebase');
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

        // Fetch all user reports and sort in-memory to avoid index requirements
        const reportsSnapshot = await collections.reports()
            .where('userId', '==', userId)
            .get();

        let reports = reportsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Sort by createdAt desc
        reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Apply limit
        const limitedReports = reports.slice(0, limit);

        res.status(200).json({
            success: true,
            data: limitedReports,
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

/**
 * GET /api/reports/latest
 * Finds and downloads the user's most recent report PDF.
 */
exports.downloadLatestReport = async (req, res, next) => {
    try {
        const userId = req.auth.userId;

        // Get all reports for this user and sort in-memory to avoid needing a Firestore composite index
        const reportsSnapshot = await collections.reports()
            .where('userId', '==', userId)
            .get();

        if (reportsSnapshot.empty) {
            return res.status(404).json({
                success: false,
                error: 'No reports found. Please generate a report first.'
            });
        }

        // Sort by createdAt descending
        const allReports = reportsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        allReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const latestReport = allReports[0];

        console.log(`📥 Downloading LATEST report ${latestReport.id} for user ${userId}`);
        const { pdfBuffer } = await reportService.generatePDFReport(userId, latestReport);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=DevTrack-Latest-Report-${(latestReport.createdAt || '').split('T')[0] || 'download'}.pdf`);
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

        // Fetch jobs and filter in-memory to avoid composite index requirements
        const jobsSnapshot = await getFirestore().collection('reportJobs')
            .where('userId', '==', userId)
            .get();

        const allUserJobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const pendingJob = allUserJobs.find(job => ['pending', 'processing'].includes(job.status));

        res.status(200).json({
            success: true,
            data: {
                lastReportSentAt: userData.lastReportSentAt || null,
                lastCompletedJob: lastJob,
                recentJobs: jobHistory,
                pendingJob: pendingJob || null,
                schedule: userData.reportPreferences || { dayOfWeek: 1, hour: 15, frequency: 'weekly', enabled: true },
            }
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
// Get latest job status for polling
exports.getLatestJobStatus = async (req, res, next) => {
    try {
        const userId = req.auth.userId;

        // Get the most recent job for this user
        const snapshot = await getFirestore().collection('reportJobs')
            .where('userId', '==', userId)
            .get();

        if (snapshot.empty) {
            return res.status(200).json({ success: true, status: 'none' });
        }

        // Sort in-memory to avoid index requirement
        const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const latestJob = jobs[0];

        res.status(200).json({
            success: true,
            jobId: latestJob.id,
            status: latestJob.status,
            reportType: latestJob.reportType,
            createdAt: latestJob.createdAt,
            completedAt: latestJob.completedAt,
            lastError: latestJob.lastError
        });
    } catch (error) {
        next(error);
    }
};
