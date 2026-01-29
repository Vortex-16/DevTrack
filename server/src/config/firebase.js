/**
 * Firebase Admin SDK Configuration
 */

const admin = require('firebase-admin');

let db = null;

const initializeFirebase = () => {
    return new Promise((resolve, reject) => {
        try {
            // Check if Firebase is already initialized
            if (admin.apps.length > 0) {
                db = admin.firestore();
                resolve(db);
                return;
            }

            // Validate required environment variables
            const requiredVars = [
                'FIREBASE_PROJECT_ID',
                'FIREBASE_PRIVATE_KEY',
                'FIREBASE_CLIENT_EMAIL',
            ];

            for (const varName of requiredVars) {
                if (!process.env[varName]) {
                    throw new Error(`Missing required environment variable: ${varName}`);
                }
            }

            // Initialize Firebase Admin SDK
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                }),
            });

            db = admin.firestore();

            // Firestore settings
            db.settings({
                ignoreUndefinedProperties: true,
            });

            resolve(db);
        } catch (error) {
            reject(new Error(`Firebase initialization failed: ${error.message}`));
        }
    });
};

// Get Firestore instance
const getFirestore = () => {
    if (!db) {
        throw new Error('Firebase not initialized. Call initializeFirebase() first.');
    }
    return db;
};

// Collection references (for easy access)
const collections = {
    users: () => getFirestore().collection('users'),
    logs: () => getFirestore().collection('logs'),
    activities: () => getFirestore().collection('activities'),
    projects: () => getFirestore().collection('projects'),
    tasks: () => getFirestore().collection('tasks'),
    showcases: () => getFirestore().collection('showcases'),
    resumes: () => getFirestore().collection('resumes'),
};

module.exports = {
    initializeFirebase,
    getFirestore,
    collections,
    admin,
};
