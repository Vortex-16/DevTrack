/**
 * Notification Controller
 * Handles FCM token registration, in-app notification CRUD,
 * and scheduled check triggers.
 */

const { getNotificationService } = require('../services/notificationService');
const { APIError } = require('../middleware/errorHandler');

// ─── FCM Token Management ────────────────────────────────────────────────────

/**
 * Register FCM token for push notifications
 * POST /api/notifications/register
 */
const registerToken = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { token } = req.body;

        if (!token) throw new APIError('FCM token is required', 400);

        const svc = getNotificationService();
        const result = await svc.registerToken(userId, token);

        if (!result.success) throw new APIError(result.error, 500);

        res.status(200).json({ success: true, message: 'Push notifications enabled' });
    } catch (error) {
        next(error);
    }
};

/**
 * Unregister FCM token
 * DELETE /api/notifications/register
 */
const unregisterToken = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        const svc = getNotificationService();
        const result = await svc.removeToken(userId);

        if (!result.success) throw new APIError(result.error, 500);

        res.status(200).json({ success: true, message: 'Push notifications disabled' });
    } catch (error) {
        next(error);
    }
};

// ─── In-App Notification CRUD ────────────────────────────────────────────────

/**
 * Get in-app notifications for current user
 * GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);

        const svc = getNotificationService();
        const result = await svc.getUserNotifications(userId, limit);

        if (!result.success) throw new APIError(result.error, 500);

        res.status(200).json({
            success: true,
            data: result.notifications,
            unreadCount: result.unreadCount,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark a specific notification as read
 * PATCH /api/notifications/:id/read
 */
const markRead = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { id } = req.params;

        const svc = getNotificationService();
        const result = await svc.markNotificationRead(userId, id);

        if (!result.success) throw new APIError(result.error, 500);

        res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
const markAllRead = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        const svc = getNotificationService();
        const result = await svc.markAllNotificationsRead(userId);

        if (!result.success) throw new APIError(result.error, 500);

        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a specific notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { id } = req.params;

        const svc = getNotificationService();
        const result = await svc.deleteNotification(userId, id);

        if (!result.success) throw new APIError(result.error, 500);

        res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        next(error);
    }
};

// ─── Test Notification ───────────────────────────────────────────────────────

/**
 * Send test notification to verify full pipeline
 * POST /api/notifications/test
 */
const sendTestNotification = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        const svc = getNotificationService();
        const result = await svc.sendConsistencyReminder(userId);

        if (!result.success) throw new APIError(result.error || 'Failed to send test notification', 400);

        res.status(200).json({
            success: true,
            message: 'Test notification sent',
            notification: result.notification,
            push: result.push,
        });
    } catch (error) {
        next(error);
    }
};

// ─── Scheduled Check Triggers (called by node-cron or external scheduler) ───

/**
 * Trigger consistency reminder check
 * POST /api/notifications/check-reminders
 * Protected by SCHEDULER_API_KEY
 */
const checkReminders = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const expectedKey = process.env.SCHEDULER_API_KEY;
        if (expectedKey && apiKey !== expectedKey) throw new APIError('Invalid API key', 401);

        const svc = getNotificationService();
        const result = await svc.checkAndSendReminders();

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * Trigger dynamic notification check (missed commits, project revival)
 * POST /api/notifications/check-dynamic
 */
const checkDynamic = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const expectedKey = process.env.SCHEDULER_API_KEY;
        if (expectedKey && apiKey !== expectedKey) throw new APIError('Invalid API key', 401);

        const svc = getNotificationService();
        const result = await svc.checkDynamicNotifs();

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * Get notification status (FCM enabled, last times)
 * GET /api/notifications/status
 */
const getNotificationStatus = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { collections } = require('../config/firebase');

        const userDoc = await collections.users().doc(userId).get();
        if (!userDoc.exists) throw new APIError('User not found', 404);

        const user = userDoc.data();

        res.status(200).json({
            success: true,
            data: {
                enabled: !!user.fcmToken,
                lastStartTime: user.lastStartTime || null,
                lastEndTime: user.lastEndTime || null,
                tokenUpdatedAt: user.fcmTokenUpdatedAt || null,
                unreadCount: (user.notifications || []).filter(n => !n.read).length,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerToken,
    unregisterToken,
    getNotifications,
    markRead,
    markAllRead,
    deleteNotification,
    sendTestNotification,
    checkReminders,
    checkDynamic,
    getNotificationStatus,
};
