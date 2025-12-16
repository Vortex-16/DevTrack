/**
 * Firebase Cloud Messaging Service Worker
 * Handles background push notifications for DevTrack
 * 
 * NOTE: Firebase config is loaded from the main app.
 * This service worker receives messages from Firebase Cloud Messaging.
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration for DevTrack
firebase.initializeApp({
    apiKey: "AIzaSyCkI_Nzpsc_J78xZ3TYZ5-T7d1S-XGoLmE",
    authDomain: "devtrack-7c798.firebaseapp.com",
    projectId: "devtrack-7c798",
    storageBucket: "devtrack-7c798.firebasestorage.app",
    messagingSenderId: "629682965288",
    appId: "1:629682965288:web:824486fce7d84227961e1d"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'DevTrack';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/DevTrack.png',
        badge: '/favicon.png',
        vibrate: [200, 100, 200],
        tag: 'devtrack-notification',
        renotify: true,
        data: payload.data || {},
        actions: [
            {
                action: 'open',
                title: 'Open DevTrack',
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
            },
        ],
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click:', event);

    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    // Open or focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there's already a window/tab open
            for (const client of clientList) {
                if (client.url.includes('/dashboard') && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow('/dashboard');
            }
        })
    );
});

// Handle push event directly (fallback)
self.addEventListener('push', (event) => {
    console.log('[firebase-messaging-sw.js] Push event received');

    if (event.data) {
        const data = event.data.json();
        console.log('[firebase-messaging-sw.js] Push data:', data);
    }
});

