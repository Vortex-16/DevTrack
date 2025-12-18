/**
 * Firebase Client Configuration
 * Handles Firebase initialization for push notifications
 */

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// VAPID key for web push
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let app = null;
let messaging = null;

/**
 * Initialize Firebase app
 */
export const initializeFirebase = () => {
    if (app) return app;

    try {
        // Check if config is properly set
        if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_FIREBASE_WEB_API_KEY') {
            console.warn('Firebase not configured. Push notifications will not work.');
            return null;
        }

        app = initializeApp(firebaseConfig);
        console.log('✅ Firebase initialized');
        return app;
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        return null;
    }
};

/**
 * Get Firebase Messaging instance
 */
export const getFirebaseMessaging = () => {
    if (messaging) return messaging;

    try {
        const firebaseApp = initializeFirebase();
        if (!firebaseApp) return null;

        messaging = getMessaging(firebaseApp);
        return messaging;
    } catch (error) {
        console.error('Failed to get Firebase Messaging:', error);
        return null;
    }
};

/**
 * Request permission and get FCM token
 * @returns {Promise<string|null>} FCM token or null if failed
 */
export const requestNotificationPermission = async () => {
    try {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.warn('Notifications not supported in this browser');
            return null;
        }

        // Check if service workers are supported
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Workers not supported in this browser');
            return null;
        }

        // Check VAPID key
        if (!VAPID_KEY) {
            console.error('❌ VAPID key is not configured! Check VITE_FIREBASE_VAPID_KEY environment variable.');
            return null;
        }
        console.log('🔑 VAPID key is configured');

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }
        console.log('✅ Notification permission granted');

        // Get messaging instance
        const messagingInstance = getFirebaseMessaging();
        if (!messagingInstance) {
            console.warn('Firebase Messaging not available');
            return null;
        }

        // Register service worker with error handling
        let registration;
        try {
            console.log('📝 Registering service worker...');
            registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('✅ Service Worker registered:', registration.scope);

            // Wait for the service worker to be ready
            await navigator.serviceWorker.ready;
            console.log('✅ Service Worker is ready');
        } catch (swError) {
            console.error('❌ Service Worker registration failed:', swError);
            return null;
        }

        // Get FCM token with detailed error handling
        try {
            console.log('📲 Getting FCM token...');
            const token = await getToken(messagingInstance, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration,
            });

            if (token) {
                console.log('✅ FCM Token obtained:', token.substring(0, 20) + '...');
                return token;
            } else {
                console.warn('⚠️ No FCM token available - getToken returned null');
                return null;
            }
        } catch (tokenError) {
            console.error('❌ Error getting FCM token:', tokenError);
            console.error('Token error details:', {
                code: tokenError.code,
                message: tokenError.message,
            });
            return null;
        }
    } catch (error) {
        console.error('❌ Error in requestNotificationPermission:', error);
        return null;
    }
};


/**
 * Set up foreground message handler
 * @param {Function} callback - Callback function for incoming messages
 */
export const onForegroundMessage = (callback) => {
    const messagingInstance = getFirebaseMessaging();
    if (!messagingInstance) return null;

    return onMessage(messagingInstance, (payload) => {
        console.log('📬 Foreground message received:', payload);
        callback(payload);
    });
};

/**
 * Show a notification using the Notification API
 */
export const showNotification = (title, options = {}) => {
    if (Notification.permission === 'granted') {
        new Notification(title, {
            icon: '/DevTrack.png',
            badge: '/favicon.png',
            ...options,
        });
    }
};

export default {
    initializeFirebase,
    getFirebaseMessaging,
    requestNotificationPermission,
    onForegroundMessage,
    showNotification,
};
