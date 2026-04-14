require('dotenv').config();
const { collections } = require('./src/config/firebase');
const { initializeFirebase } = require('./src/config/firebase');

async function check() {
    await initializeFirebase();
    const snapshot = await collections.users().get();
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id}, Name: ${data.name}, GitHub: ${data.githubUsername || data.username}`);
    });
    process.exit(0);
}

check();
