require('dotenv').config();
const { collections, initializeFirebase } = require('./src/config/firebase');
const reportQueue = require('./src/services/reportQueueService');

async function testTrigger() {
    await initializeFirebase();
    const userId = process.argv[2] || 'user_2pg6Fz4mR0P0uC9Z1K9q9f3Z3zZ'; // Default or from arg
    
    console.log(`🚀 Force-triggering weekly report check for user ${userId}...`);
    
    // We override the time check by manually enqueuing
    const userDoc = await collections.users().doc(userId).get();
    if (!userDoc.exists) {
        console.error('User not found');
        process.exit(1);
    }
    
    const data = userDoc.data();
    const result = await reportQueue.enqueueJob(userId, {
        email: data.email,
        username: data.githubUsername,
        reportType: 'weekly'
    });
    
    console.log('Result:', result);
    
    console.log('⚙️ Starting queue processing...');
    const processResult = await reportQueue.processQueue(1, userId);
    console.log('Process Result:', processResult);
    
    process.exit(0);
}

testTrigger();
