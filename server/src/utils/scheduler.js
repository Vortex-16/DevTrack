/**
 * DevTrack Scheduler
 * Handles cron jobs for automated notifications and maintenance
 */

const cron = require('node-cron');
const { getNotificationService } = require('../services/notificationService');

/**
 * Initialize all scheduled jobs
 */
const initializeScheduler = () => {
    console.log('⏰ Initializing DevTrack Scheduler...');
    const notificationService = getNotificationService();

    // 1. Regular Consistency Reminders (Fixed/Adaptive Time)
    // Runs every 5 minutes to check if any user's scheduled time has arrived
    cron.schedule('*/5 * * * *', async () => {
        try {
            console.log('🕒 Running Consistency Reminders check...');
            await notificationService.checkAndSendReminders();
        } catch (error) {
            console.error('❌ Scheduler Error (Consistency Reminders):', error.message);
        }
    });

    // 2. Dynamic Activity Checks (Missing Commits/Logs, Project Inactivity)
    // Runs every hour to check if anyone is falling behind or has inactive projects
    cron.schedule('0 * * * *', async () => {
        try {
            console.log('🕒 Running Dynamic Activity checks...');
            await notificationService.checkDynamicNotifs();
        } catch (error) {
            console.error('❌ Scheduler Error (Dynamic Notifs):', error.message);
        }
    });

    // 3. Nightly Streak Warning (8:00 PM)
    // A specific check for users who haven't done anything yet today
    cron.schedule('0 20 * * *', async () => {
        try {
            console.log('🕒 Running Nightly Streak Warning...');
            await notificationService.checkDynamicNotifs();
        } catch (error) {
            console.error('❌ Scheduler Error (Nightly Warning):', error.message);
        }
    });

    // 4. Weekly GitHub PDF Report (Every Sunday at 3:07 PM IST / 09:37 UTC)
    // Sends comprehensive activity reports to all users
    cron.schedule('37 9 * * 0', async () => {
        try {
            console.log('📊 Running Weekly PDF Report generation...');
            const reportService = require('../services/reportService');
            await reportService.sendAllWeeklyReports();
        } catch (error) {
            console.error('❌ Scheduler Error (Weekly Reports):', error.message);
        }
    });

    console.log('✅ Scheduler initialized successfully');
};

module.exports = {
    initializeScheduler,
};
