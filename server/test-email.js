require('dotenv').config();
const reportService = require('./src/services/reportService');
const { collections } = require('./src/config/firebase');

async function sendActualReport() {
    const targetEmail = 'yourgithubmail/email used during clerk auth';
    const targetGithub = 'yourGithubid';

    console.log(`Searching for user with email: ${targetEmail} or GitHub: ${targetGithub}...`);

    try {
        // Initialize Firebase
        const { initializeFirebase } = require('./src/config/firebase');
        await initializeFirebase();
        console.log('Firebase initialized');

        let userDoc = null;

        // Try searching by email
        const emailQuery = await collections.users().where('email', '==', targetEmail).limit(1).get();
        if (!emailQuery.empty) {
            userDoc = emailQuery.docs[0];
            console.log(`Found user by email: ${userDoc.id}`);
        } else {
            // Try searching by GitHub username
            const githubQuery = await collections.users().where('githubUsername', '==', targetGithub).limit(1).get();
            if (!githubQuery.empty) {
                userDoc = githubQuery.docs[0];
                console.log(`Found user by GitHub: ${userDoc.id}`);
            }
        }

        if (!userDoc) {
            console.error('User not found in database. Cannot generate actual report.');
            process.exit(1);
        }

        const userId = userDoc.id;
        console.log(`Starting report generation for user: ${userId}`);

        const result = await reportService.sendWeeklyReportEmail(userId);

        if (result.success) {
            console.log('✅ Weekly report sent successfully!');
            console.log('Result:', result);
        } else {
            console.error('❌ Failed to send weekly report:', result.error);
        }

    } catch (error) {
        console.error('Error during report generation:', error);
    }

    process.exit(0);
}

sendActualReport();
