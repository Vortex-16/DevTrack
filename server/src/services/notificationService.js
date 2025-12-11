/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles push notifications for consistency reminders
 */

const { admin, collections } = require('../config/firebase');

class NotificationService {
    constructor() {
        this.messaging = admin.messaging();
    }

    /**
     * Send a push notification to a specific device
     * @param {string} fcmToken - Device FCM token
     * @param {object} notification - { title, body }
     * @param {object} data - Additional data payload
     */
    async sendNotification(fcmToken, notification, data = {}) {
        try {
            const message = {
                token: fcmToken,
                notification: {
                    title: notification.title,
                    body: notification.body,
                },
                data: {
                    ...data,
                    click_action: 'OPEN_APP',
                },
                webpush: {
                    notification: {
                        icon: '/icon.png',
                        badge: '/badge.png',
                        vibrate: [200, 100, 200],
                    },
                    fcmOptions: {
                        link: process.env.CORS_ORIGIN || 'http://localhost:5173',
                    },
                },
            };

            const response = await this.messaging.send(message);
            console.log('✅ Notification sent:', response);
            return { success: true, messageId: response };
        } catch (error) {
            console.error('❌ Failed to send notification:', error.message);

            // If token is invalid, we should remove it
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
                return { success: false, error: 'invalid_token', shouldRemove: true };
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * Send consistency reminder to a user
     * @param {string} userId - User's Clerk ID
     */
    async sendConsistencyReminder(userId) {
        try {
            const userDoc = await collections.users().doc(userId).get();

            if (!userDoc.exists) {
                return { success: false, error: 'User not found' };
            }

            const user = userDoc.data();

            if (!user.fcmToken) {
                return { success: false, error: 'No FCM token registered' };
            }

            if (!user.lastStartTime) {
                return { success: false, error: 'No previous activity recorded' };
            }

            const notification = {
                title: '🔥 Time to Code!',
                body: `You started at ${user.lastStartTime} yesterday. Let's stay consistent today!`,
            };

            const data = {
                type: 'consistency_reminder',
                lastStartTime: user.lastStartTime,
            };

            return await this.sendNotification(user.fcmToken, notification, data);
        } catch (error) {
            console.error('Error sending consistency reminder:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send notification to multiple users
     * @param {Array} userIds - Array of user IDs
     * @param {object} notification - { title, body }
     */
    async sendToMultipleUsers(userIds, notification) {
        const results = [];

        for (const userId of userIds) {
            const userDoc = await collections.users().doc(userId).get();

            if (userDoc.exists && userDoc.data().fcmToken) {
                const result = await this.sendNotification(
                    userDoc.data().fcmToken,
                    notification
                );
                results.push({ userId, ...result });
            }
        }

        return results;
    }

    /**
     * Check and send reminders to all eligible users
     * This should be called by a scheduler/cron job
     */
    async checkAndSendReminders() {
        try {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

            console.log(`⏰ Checking reminders for time: ${currentTime}`);

            // Get users whose lastStartTime matches current time (within 5 minute window)
            const usersSnapshot = await collections.users()
                .where('fcmToken', '!=', null)
                .get();

            const results = [];

            for (const doc of usersSnapshot.docs) {
                const user = doc.data();

                if (!user.lastStartTime) continue;

                // Check if current time is within 5 minutes of last start time
                const [lastHour, lastMinute] = user.lastStartTime.split(':').map(Number);

                if (currentHour === lastHour && Math.abs(currentMinute - lastMinute) <= 5) {
                    console.log(`📤 Sending reminder to user: ${doc.id}`);
                    const result = await this.sendConsistencyReminder(doc.id);
                    results.push({ userId: doc.id, ...result });
                }
            }

            return {
                success: true,
                checkedAt: currentTime,
                notificationsSent: results.length,
                results,
            };
        } catch (error) {
            console.error('Error checking reminders:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Register FCM token for a user
     * @param {string} userId - User's Clerk ID
     * @param {string} token - FCM token from client
     */
    async registerToken(userId, token) {
        try {
            await collections.users().doc(userId).set({
                fcmToken: token,
                fcmTokenUpdatedAt: new Date().toISOString(),
            }, { merge: true });

            return { success: true, message: 'Token registered successfully' };
        } catch (error) {
            console.error('Error registering FCM token:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Remove FCM token for a user
     * @param {string} userId - User's Clerk ID
     */
    async removeToken(userId) {
        try {
            await collections.users().doc(userId).set({
                fcmToken: null,
                fcmTokenUpdatedAt: new Date().toISOString(),
            }, { merge: true });

            return { success: true, message: 'Token removed successfully' };
        } catch (error) {
            console.error('Error removing FCM token:', error);
            return { success: false, error: error.message };
        }
    }
}

// Singleton instance
let instance = null;

const getNotificationService = () => {
    if (!instance) {
        instance = new NotificationService();
    }
    return instance;
};

module.exports = {
    NotificationService,
    getNotificationService,
};
