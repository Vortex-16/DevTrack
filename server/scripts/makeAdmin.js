const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const admin = require('firebase-admin');

// Initialize Firebase (copied from config/firebase.js to run standalone)
const initializeFirebase = () => {
    if (admin.apps.length > 0) return admin.firestore();

    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    if (!serviceAccount.privateKey) {
        console.error("❌ Missing FIREBASE_PRIVATE_KEY in .env");
        process.exit(1);
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    return admin.firestore();
};

const makeAdmin = async () => {
    const db = initializeFirebase();
    const target = 'vortex-16';

    try {
        console.log(`🔍 Searching for user: ${target}...`);

        // Search by githubUsername or name
        const usersRef = db.collection('users');
        const snapshot = await usersRef.get(); // Get all to filter locally if needed, or query

        let targetUser = null;

        // Query by githubUsername
        const byGithub = await usersRef.where('githubUsername', '==', target).get();
        if (!byGithub.empty) {
            targetUser = byGithub.docs[0];
        }

        // Query by name if not found
        if (!targetUser) {
            const byName = await usersRef.where('name', '==', target).get();
            if (!byName.empty) {
                targetUser = byName.docs[0];
            }
        }

        if (!targetUser) {
            console.error(`❌ User '${target}' not found.`);
            // List some users to help debug
            console.log("Available users (first 5):");
            snapshot.docs.slice(0, 5).forEach(d => console.log(`- ${d.id}: ${d.data().name} (${d.data().githubUsername})`));
            process.exit(1);
        }

        await usersRef.doc(targetUser.id).update({
            role: 'admin',
            isAdmin: true // Redundant but safe
        });

        console.log(`✅ Successfully granted ADMIN access to: ${targetUser.data().name} (${targetUser.id})`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

// Debug Env
console.log("📂 __dirname:", __dirname);
const envPath = path.join(__dirname, '../.env');
console.log("📂 Loading .env from:", envPath);
require('dotenv').config({ path: envPath });
console.log("🔑 Env loaded. Project ID:", process.env.FIREBASE_PROJECT_ID);

makeAdmin();
