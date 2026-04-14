require('dotenv').config();
const { collections } = require('./src/config/firebase');
const { initializeFirebase } = require('./src/config/firebase');

async function check() {
    await initializeFirebase();
    const snapshot = await collections.showcases().get();
    console.log(`Total showcases: ${snapshot.size}`);
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id}, Name: ${data.projectName}, Owner: ${data.userId}`);
    });
    process.exit(0);
}

check();
