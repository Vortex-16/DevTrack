/**
 * Logs Controller
 * Handles CRUD operations for learning logs
 */

const { collections } = require('../config/firebase');
const { APIError } = require('../middleware/errorHandler');

/**
 * Get all logs for authenticated user
 * GET /api/logs
 */
const getLogs = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Get logs for user (simple query - no ordering to avoid index requirement)
        const logsRef = collections.logs()
            .where('uid', '==', userId)
            .limit(limitNum);

        const snapshot = await logsRef.get();

        const logs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Get total count for pagination
        const countSnapshot = await collections.logs()
            .where('uid', '==', userId)
            .count()
            .get();

        const total = countSnapshot.data().count;

        res.status(200).json({
            success: true,
            data: {
                logs,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single log by ID
 * GET /api/logs/:id
 */
const getLog = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { id } = req.params;

        const logDoc = await collections.logs().doc(id).get();

        if (!logDoc.exists) {
            throw new APIError('Log not found', 404);
        }

        const log = logDoc.data();

        // Verify ownership
        if (log.uid !== userId) {
            throw new APIError('Access denied', 403);
        }

        res.status(200).json({
            success: true,
            data: {
                id: logDoc.id,
                ...log,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new learning log
 * POST /api/logs
 */
const createLog = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { date, startTime, endTime, learnedToday, tags, mood } = req.body;

        const logData = {
            uid: userId,
            date,
            startTime,
            endTime,
            learnedToday,
            tags: tags || [],
            mood: mood || 'good',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Create the log
        const logRef = await collections.logs().add(logData);

        // Update user's last activity times (for notification system)
        // Use set with merge to create user doc if it doesn't exist
        await collections.users().doc(userId).set({
            lastStartTime: startTime,
            lastEndTime: endTime,
            updatedAt: new Date().toISOString(),
        }, { merge: true });

        res.status(201).json({
            success: true,
            message: 'Log created successfully',
            data: {
                id: logRef.id,
                ...logData,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update an existing log
 * PUT /api/logs/:id
 */
const updateLog = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { id } = req.params;
        const updates = req.body;

        const logRef = collections.logs().doc(id);
        const logDoc = await logRef.get();

        if (!logDoc.exists) {
            throw new APIError('Log not found', 404);
        }

        const log = logDoc.data();

        // Verify ownership
        if (log.uid !== userId) {
            throw new APIError('Access denied', 403);
        }

        // Update the log
        const updateData = {
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        await logRef.update(updateData);

        // If times were updated, update user's last activity
        if (updates.startTime || updates.endTime) {
            const userUpdate = {
                updatedAt: new Date().toISOString(),
            };
            if (updates.startTime) userUpdate.lastStartTime = updates.startTime;
            if (updates.endTime) userUpdate.lastEndTime = updates.endTime;

            await collections.users().doc(userId).set(userUpdate, { merge: true });
        }

        const updatedDoc = await logRef.get();

        res.status(200).json({
            success: true,
            message: 'Log updated successfully',
            data: {
                id: logRef.id,
                ...updatedDoc.data(),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a log
 * DELETE /api/logs/:id
 */
const deleteLog = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { id } = req.params;

        const logRef = collections.logs().doc(id);
        const logDoc = await logRef.get();

        if (!logDoc.exists) {
            throw new APIError('Log not found', 404);
        }

        const log = logDoc.data();

        // Verify ownership
        if (log.uid !== userId) {
            throw new APIError('Access denied', 403);
        }

        await logRef.delete();

        res.status(200).json({
            success: true,
            message: 'Log deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get logs summary/statistics
 * GET /api/logs/stats
 */
const getStats = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        // Get all logs for user
        const logsSnapshot = await collections.logs()
            .where('uid', '==', userId)
            .get();

        const logs = logsSnapshot.docs.map((doc) => doc.data());

        // Calculate statistics
        const totalLogs = logs.length;

        // Get unique dates to calculate streak
        const dates = logs.map((log) => log.date).sort();
        const uniqueDates = [...new Set(dates)];

        // Calculate current streak
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];

        for (let i = uniqueDates.length - 1; i >= 0; i--) {
            const logDate = uniqueDates[i];
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() - (uniqueDates.length - 1 - i));

            if (logDate === expectedDate.toISOString().split('T')[0]) {
                streak++;
            } else {
                break;
            }
        }

        // Count tags
        const tagCounts = {};
        logs.forEach((log) => {
            (log.tags || []).forEach((tag) => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        // Top tags
        const topTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag, count]) => ({ tag, count }));

        res.status(200).json({
            success: true,
            data: {
                totalLogs,
                currentStreak: streak,
                uniqueDays: uniqueDates.length,
                topTags,
                lastLogDate: uniqueDates[uniqueDates.length - 1] || null,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLogs,
    getLog,
    createLog,
    updateLog,
    deleteLog,
    getStats,
};
