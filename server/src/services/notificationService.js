/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles push notifications for consistency reminders
 */

const { admin, collections } = require('../config/firebase');

// Motivational message templates based on user goals
const GOAL_MESSAGES = {
    'Learning new tech stack': [
        "🚀 Time to level up your skills!",
        "📚 Every day of learning compounds into expertise!",
        "💡 New technology mastery awaits!",
    ],
    'Working on side projects': [
        "🛠️ Your side project is waiting for you!",
        "💪 Ship something awesome today!",
        "🎯 One commit closer to launch!",
    ],
    'Preparing for placements': [
        "📝 Consistency beats cramming!",
        "🎓 Future employers notice dedication!",
        "💼 Your portfolio grows with each commit!",
    ],
    'Freelance work': [
        "💰 Your clients value your dedication!",
        "⚡ Build your reputation with consistency!",
        "🌟 Great freelancers show up daily!",
    ],
    'Personal portfolio': [
        "🖼️ Your portfolio is your best resume!",
        "✨ Showcase your growth every day!",
        "🎨 Each project tells your story!",
    ],
    'default': [
        "🔥 Time to Code!",
        "💻 Keep the streak alive!",
        "🚀 Consistency is your superpower!",
    ],
};

class NotificationService {
    constructor() {
        this.messaging = admin.messaging();
    }

    /**
     * Get a random motivational message based on user's goal
     * @param {string} userGoal - User's main focus/goal
     */
    getMotivationalMessage(userGoal) {
        const messages = GOAL_MESSAGES[userGoal] || GOAL_MESSAGES['default'];
        return messages[Math.floor(Math.random() * messages.length)];
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
                        icon: '/DevTrack.png',
                        badge: '/favicon.png',
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
     * Send consistency reminder to a user based on their preferences
     * @param {string} userId - User's Clerk ID
     */
    async sendConsistencyReminder(userId) {
        try {
            const userDoc = await collections.users().doc(userId).get();

            if (!userDoc.exists) {
                return { success: false, error: 'User not found' };
            }

            const user = userDoc.data();
            const preferences = user.preferences || {};

            if (!user.fcmToken) {
                return { success: false, error: 'No FCM token registered' };
            }

            // Get personalized motivational title
            const title = this.getMotivationalMessage(user.userGoal);

            // Build personalized body message
            let body = '';

            if (preferences.reminderMode === 'adaptive' && user.lastStartTime) {
                body = `You started at ${user.lastStartTime} yesterday. Let's stay consistent today!`;
            } else if (preferences.reminderMode === 'fixed') {
                body = `It's your scheduled coding time. Let's build something amazing!`;
            } else {
                body = `Time to write some code and keep your streak alive!`;
            }

            // Add goal context if available
            if (user.userGoal) {
                body += ` Focus: ${user.userGoal}`;
            }

            const notification = { title, body };

            const data = {
                type: 'consistency_reminder',
                lastStartTime: user.lastStartTime || '',
                userGoal: user.userGoal || '',
                reminderMode: preferences.reminderMode || 'adaptive',
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
     * Enhanced to support both adaptive and fixed reminder modes
     */
    async checkAndSendReminders() {
        try {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

            console.log(`⏰ Checking reminders for time: ${currentTime}`);

            // Get all users with FCM tokens
            const usersSnapshot = await collections.users()
                .where('fcmToken', '!=', null)
                .get();

            const results = [];

            for (const doc of usersSnapshot.docs) {
                const user = doc.data();
                const preferences = user.preferences || {};

                // Skip users who haven't completed onboarding
                if (!user.onboardingCompleted) continue;

                let shouldSendReminder = false;

                if (preferences.reminderMode === 'fixed' && preferences.fixedTime) {
                    // Fixed mode: check if current time matches fixed time (within 5 min window)
                    const [fixedHour, fixedMinute] = this.parseTime(preferences.fixedTime);

                    if (currentHour === fixedHour && Math.abs(currentMinute - fixedMinute) <= 5) {
                        shouldSendReminder = true;
                    }
                } else if (preferences.reminderMode === 'adaptive' || !preferences.reminderMode) {
                    // Adaptive mode: check if current time matches last start time
                    if (!user.lastStartTime) continue;

                    const [lastHour, lastMinute] = user.lastStartTime.split(':').map(Number);

                    if (currentHour === lastHour && Math.abs(currentMinute - lastMinute) <= 5) {
                        shouldSendReminder = true;
                    }
                }

                if (shouldSendReminder) {
                    console.log(`📤 Sending reminder to user: ${doc.id} (mode: ${preferences.reminderMode || 'adaptive'})`);
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
     * Parse time string in various formats (HH:MM, H:MM AM/PM)
     * @param {string} timeStr - Time string
     * @returns {[number, number]} - [hour, minute] in 24h format
     */
    parseTime(timeStr) {
        if (!timeStr) return [0, 0];

        // Check for AM/PM format
        const ampmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (ampmMatch) {
            let hour = parseInt(ampmMatch[1]);
            const minute = parseInt(ampmMatch[2]);
            const period = ampmMatch[3].toUpperCase();

            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;

            return [hour, minute];
        }

        // 24-hour format
        const parts = timeStr.split(':').map(Number);
        return [parts[0] || 0, parts[1] || 0];
    }

    /**
     * Send break reminder (for frequent commit pattern users)
     * @param {string} userId - User's Clerk ID
     * @param {number} inactiveMinutes - Minutes of inactivity
     */
    async sendBreakReminder(userId, inactiveMinutes = 90) {
        try {
            const userDoc = await collections.users().doc(userId).get();

            if (!userDoc.exists) {
                return { success: false, error: 'User not found' };
            }

            const user = userDoc.data();
            const preferences = user.preferences || {};

            // Only send if break detection is enabled
            if (!preferences.breakDetection) {
                return { success: false, error: 'Break detection disabled' };
            }

            // Only for frequent commit pattern users
            if (preferences.commitPattern !== 'frequent') {
                return { success: false, error: 'User uses end-only commit pattern' };
            }

            if (!user.fcmToken) {
                return { success: false, error: 'No FCM token registered' };
            }

            const notification = {
                title: '☕ Taking a break?',
                body: `No commits detected for ${inactiveMinutes} minutes. Remember to mark your break if you're stepping away!`,
            };

            const data = {
                type: 'break_reminder',
                inactiveMinutes: String(inactiveMinutes),
            };

            return await this.sendNotification(user.fcmToken, notification, data);
        } catch (error) {
            console.error('Error sending break reminder:', error);
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

