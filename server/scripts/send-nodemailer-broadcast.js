require('dotenv').config();
const { initializeFirebase, collections } = require('../src/config/firebase');
const emailService = require('../src/services/emailService');

async function broadcastWithNodemailer() {
    console.log('📧 Initializing Firebase and starting Nodemailer + Gmail SMTP broadcast...');
    
    try {
        await initializeFirebase();
        console.log('✅ Firebase initialized');

        const usersSnapshot = await collections.users().get();
        if (usersSnapshot.empty) {
            console.log('No users found in Firestore.');
            return;
        }

        console.log(`Found ${usersSnapshot.size} total users in Firestore.`);
        let sentCount = 0;
        let skippedCount = 0;

        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            const userId = doc.id;
            const email = userData.email;

            if (!email) {
                skippedCount++;
                continue;
            }

            const githubUsername = (userData.githubUsername || '').toLowerCase();
            const isExempt = githubUsername === 'vortex-16' ||
                             githubUsername === 'vortex16' ||
                             email.toLowerCase().includes('alpha4coders') ||
                             userData.isExemptFromDowngrade === true;

            console.log(`Sending email with inline CID poster to ${email} (Founder: ${isExempt})...`);
            const result = await emailService.sendProTrialAnnouncementEmail(
                email,
                userData.name || 'Developer',
                isExempt
            );

            if (result.success) {
                sentCount++;
                await collections.users().doc(userId).set({
                    proTrialEmailSentV2: true,
                    proTrialEmailSentAtV2: new Date().toISOString(),
                }, { merge: true });
            } else {
                console.error(`Failed to send to ${email}:`, result.error);
            }

            // 500ms delay between emails to respect Gmail SMTP rate limits
            await new Promise(r => setTimeout(r, 500));
        }

        console.log(`\n🎉 Broadcast Complete! Total Sent: ${sentCount}, Skipped: ${skippedCount}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Broadcast failed:', error.message);
        process.exit(1);
    }
}

broadcastWithNodemailer();
