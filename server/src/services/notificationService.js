/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles push notifications for consistency reminders
 */

const { admin, collections } = require('../config/firebase');
const { getGeminiService } = require('./geminiService');
const GitHubService = require('./githubService');

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
                        link: process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'https://devtrackweb.xyz',
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

            // Generate AI motivation message
            const gemini = getGeminiService();
            const stats = {
                streak: user.streak || 0,
                lastStartTime: user.lastStartTime || '',
                userGoal: user.userGoal || '',
                reminderMode: preferences.reminderMode || 'adaptive',
                lastActive: user.updatedAt
            };

            const aiBody = await gemini.generateMotivation(stats);
            const notification = { title, body: aiBody };

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

    /**
     * Send notification for high priority task
     * @param {string} userId - User's Clerk ID
     * @param {object} task - Task object with title, dueDate, priority
     * @param {string} notificationType - 'created' or 'reminder'
     */
    async sendTaskNotification(userId, task, notificationType = 'created') {
        try {
            const userDoc = await collections.users().doc(userId).get();

            if (!userDoc.exists) {
                return { success: false, error: 'User not found' };
            }

            const user = userDoc.data();

            if (!user.fcmToken) {
                return { success: false, error: 'No FCM token registered' };
            }

            let title, body;

            if (notificationType === 'created') {
                title = '🔥 High Priority Task Added!';
                body = `"${task.title}" is due on ${task.dueDate}`;
            } else if (notificationType === 'due_today') {
                title = '⚠️ High Priority Task Due Today!';
                body = `Don't forget: "${task.title}"`;
            } else if (notificationType === 'due_tomorrow') {
                title = '📌 High Priority Task Due Tomorrow';
                body = `Coming up: "${task.title}"`;
            } else {
                title = '📅 Task Reminder';
                body = task.title;
            }

            const notification = { title, body };

            const data = {
                type: 'task_notification',
                taskId: task.id || '',
                taskTitle: task.title,
                dueDate: task.dueDate,
                priority: task.priority,
                notificationType,
            };

            return await this.sendNotification(user.fcmToken, notification, data);
        } catch (error) {
            console.error('Error sending task notification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Comprehensive check for all dynamic notification triggers
     * Checks: Daily commits, Daily logs, Streak status, Inactive projects
     */
    async checkDynamicNotifs() {
        try {
            console.log('🔍 Starting dynamic notification check...');
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];

            // Get all users with FCM tokens
            const usersSnapshot = await collections.users()
                .where('fcmToken', '!=', null)
                .get();

            console.log(`👤 Found ${usersSnapshot.docs.length} users to check`);

            const gemini = getGeminiService();

            for (const doc of usersSnapshot.docs) {
                const userId = doc.id;
                const user = doc.data();
                const preferences = user.preferences || {};

                // Skip if notifications are disabled in preferences
                if (preferences.notifications === false) continue;

                // 1. Check Daily Commit Activity
                const hasCommits = await this.checkTodayCommits(user, todayStr);

                // 2. Check Daily Learning logs
                const hasLogs = await this.checkTodayLogs(userId, todayStr);

                // 3. Evaluate notification trigger
                let notificationType = null;
                let notificationData = {};

                if (!hasCommits && !hasLogs) {
                    // Check if day is almost ending (e.g., after 8 PM)
                    const hour = now.getHours();
                    if (hour >= 20) {
                        notificationType = 'missed_activity';
                    }
                }

                // 4. Check for project inactivity (if last push was weeks/months ago)
                if (!notificationType) {
                    const inactiveProject = await this.checkProjectInactivity(user);
                    if (inactiveProject) {
                        notificationType = 'project_revival';
                        notificationData.projectName = inactiveProject.name;
                        notificationData.lastPushed = inactiveProject.lastPushed;
                    }
                }

                // 5. Send Notification if trigger found
                if (notificationType) {
                    console.log(`🔔 Triggering ${notificationType} for user ${userId}`);

                    // Generate AI motivation message
                    const stats = {
                        streak: user.streak || 0,
                        lastActive: user.updatedAt,
                        projectName: notificationData.projectName
                    };

                    const aiBody = await gemini.generateMotivation(stats);

                    let title = '🔥 Don\'t break your streak!';
                    if (notificationType === 'project_revival') {
                        title = `🚀 Remember ${notificationData.projectName}?`;
                    }

                    await this.sendNotification(user.fcmToken, {
                        title,
                        body: aiBody
                    }, {
                        type: notificationType,
                        ...notificationData
                    });
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Error in checkDynamicNotifs:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if user has made any commits today
     */
    async checkTodayCommits(user, todayStr) {
        try {
            if (!user.githubUsername || !user.githubToken) return true; // Assume true if not linked to avoid spam

            const gh = new GitHubService(user.githubToken);
            const activity = await gh.getActivitySummary(user.githubUsername);

            // Check if there are push events today
            // getActivitySummary returns todayEvents (PushEvents, PREvents, IssueEvents)
            return activity.todayEvents > 0;
        } catch (error) {
            console.error(`Error checking GitHub activity for ${user.githubUsername}:`, error.message);
            return true; // Fallback to avoid false positives
        }
    }

    /**
     * Check if user has added a learning log today
     */
    async checkTodayLogs(userId, todayStr) {
        try {
            const logsSnapshot = await collections.logs()
                .where('uid', '==', userId)
                .where('date', '==', todayStr)
                .get();

            return !logsSnapshot.empty;
        } catch (error) {
            console.error(`Error checking logs for ${userId}:`, error.message);
            return true;
        }
    }

    /**
     * Check for projects that haven't been touched in a long time
     */
    async checkProjectInactivity(user) {
        try {
            if (!user.githubUsername || !user.githubToken) return null;

            const gh = new GitHubService(user.githubToken);
            const repos = await gh.getRepos(user.githubUsername, 5); // Check top 5 active repos

            const now = new Date();
            const twoWeeksAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));

            for (const repo of repos) {
                const lastPush = new Date(repo.updatedAt);
                if (lastPush < twoWeeksAgo) {
                    // Check if it's been more than 2 weeks but less than 3 months (to keep it relevant)
                    const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
                    if (lastPush > threeMonthsAgo) {
                        return {
                            name: repo.name,
                            lastPushed: repo.updatedAt
                        };
                    }
                }
            }
            return null;
        } catch (error) {
            return null;
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

