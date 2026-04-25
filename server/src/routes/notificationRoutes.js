/**
 * Notification Routes
 * All routes for push notification management and in-app notification CRUD.
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/notificationController');

// ─── Status ──────────────────────────────────────────────────────────────────
router.get('/status', requireAuth, c.getNotificationStatus);

// ─── FCM Token ───────────────────────────────────────────────────────────────
router.post('/register', requireAuth, c.registerToken);
router.delete('/register', requireAuth, c.unregisterToken);

// ─── In-App Notifications CRUD ───────────────────────────────────────────────
router.get('/', requireAuth, c.getNotifications);                    // GET  /api/notifications
router.patch('/read-all', requireAuth, c.markAllRead);               // PATCH /api/notifications/read-all
router.patch('/:id/read', requireAuth, c.markRead);                  // PATCH /api/notifications/:id/read
router.delete('/:id', requireAuth, c.deleteNotification);            // DELETE /api/notifications/:id

// ─── Test & Scheduled Checks ─────────────────────────────────────────────────
router.post('/test', requireAuth, c.sendTestNotification);           // POST /api/notifications/test
router.post('/check-reminders', c.checkReminders);                   // POST /api/notifications/check-reminders
router.post('/check-dynamic', c.checkDynamic);                       // POST /api/notifications/check-dynamic

module.exports = router;
