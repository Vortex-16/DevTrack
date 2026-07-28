require('dotenv').config();
const emailService = require('../src/services/emailService');

async function testSend() {
    console.log('🚀 Sending test email for Vortex-16...');
    const targetEmail = process.env.EMAIL_FROM || 'alpha4coders@gmail.com';

    const result = await emailService.sendProTrialAnnouncementEmail(
        targetEmail,
        'Vortex-16',
        true // isExempt = true (Founder Permanent Pro)
    );

    console.log('STATUS RESULT:', JSON.stringify(result, null, 2));
}

testSend();
