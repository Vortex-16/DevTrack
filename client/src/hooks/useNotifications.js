import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { notificationsApi } from '../services/api';
import {
    requestNotificationPermission,
    onForegroundMessage,
    showNotification,
    initializeFirebase,
    getFirebaseDb
} from '../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Custom hook for managing both push and in-app notifications.
 *
 * Manages:
 *  - Browser Notification permission + FCM token registration
 *  - In-app notification list (polled every 60s from /api/notifications)
 *  - Unread count badge for the notification bell
 *  - Mark read / mark all read / delete actions
 */
const useNotifications = () => {
    const { isSignedIn, user } = useUser();

    // ── FCM / Push state ──────────────────────────────────────────────────────
    const [permission, setPermission] = useState('default');
    const [isEnabled, setIsEnabled] = useState(false);
    const [fcmToken, setFcmToken] = useState(null);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [isFirebaseAuthReady, setIsFirebaseAuthReady] = useState(false);

    // ── Shared state ──────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const pollIntervalRef = useRef(null);

    // ── Firebase init + auth state listener ───────────────────────────────────
    useEffect(() => {
        const app = initializeFirebase();
        if (!app) return;

        const { getFirebaseAuth } = import('../config/firebase'); // Dynamic import to be safe
        
        // Track Firebase Auth state
        const setupAuthListener = async () => {
            const { getFirebaseAuth } = await import('../config/firebase');
            const auth = getFirebaseAuth();
            if (!auth) return;

            return onAuthStateChanged(auth, (fbUser) => {
                if (fbUser) {
                    // console.log('🔥 Firebase Auth session active:', fbUser.uid);
                    setIsFirebaseAuthReady(true);
                } else {
                    // console.log('🔥 No Firebase Auth session');
                    setIsFirebaseAuthReady(false);
                }
            });
        };

        let unsubscribe;
        setupAuthListener().then(unsub => { unsubscribe = unsub; });

        if ('Notification' in window) {
            setPermission(Notification.permission);
        }

        return () => { if (unsubscribe) unsubscribe(); };
    }, []);

    // ── Fetch in-app notifications ────────────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        if (!isSignedIn) return;
        try {
            setNotificationsLoading(true);
            const res = await notificationsApi.getAll(20);
            const data = res.data?.data || [];
            setNotifications(data);
            setUnreadCount(res.data?.unreadCount || data.filter(n => !n.read).length);
        } catch (err) {
            // Non-fatal — just don't update
        } finally {
            setNotificationsLoading(false);
        }
    }, [isSignedIn]);

    // ── Real-time listener for notifications ──────────────────────────────────
    useEffect(() => {
        // Wait for BOTH Clerk and Firebase Auth to be ready
        if (!isSignedIn || !user?.id || !isFirebaseAuthReady) {
            if (isSignedIn && user?.id && !isFirebaseAuthReady) {
                // console.log('⏳ Waiting for Firebase Auth before starting listener...');
            }
            return;
        }

        const db = getFirebaseDb();
        if (!db) return;

        // console.log('📡 Starting real-time notification listener for:', user.id);
        
        const unsubscribe = onSnapshot(doc(db, 'users', user.id), (snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.data();
                const newNotifs = userData.notifications || [];
                
                // Update state
                setNotifications(newNotifs);
                
                // Calculate unread count
                const unread = newNotifs.filter(n => !n.read).length;
                setUnreadCount(unread);
                
                setIsEnabled(!!userData.fcmToken || (userData.fcmTokens && userData.fcmTokens.length > 0));
            }
            setNotificationsLoading(false);
        }, (err) => {
            // If we get a permission error, it might be because the session expired
            console.error('❌ Notification listener error:', err);
            if (err.code === 'permission-denied') {
                setIsFirebaseAuthReady(false); // Force re-auth
            }
            setNotificationsLoading(false);
        });

        return () => unsubscribe();
    }, [isSignedIn, user?.id, isFirebaseAuthReady]);

    // ── FCM status check + token refresh on sign-in ───────────────────────────
    useEffect(() => {
        const checkStatusAndRefreshToken = async () => {
            if (!isSignedIn) return;
            try {
                const response = await notificationsApi.getStatus();
                const { enabled, firebaseToken } = response.data.data || {};
                setIsEnabled(enabled || false);

                // Sign in to Firebase Auth for onSnapshot permissions
                if (firebaseToken) {
                    const { signInToFirebase } = await import('../config/firebase');
                    await signInToFirebase(firebaseToken);
                    // console.log('✅ Signed into Firebase Auth');
                }

                if (enabled && Notification.permission === 'granted') {
                    const token = await requestNotificationPermission();
                    if (token) {
                        await notificationsApi.registerToken(token);
                        setFcmToken(token);
                    }
                }

                // Also refresh in-app unread count from status endpoint
                const unread = response.data.data?.unreadCount || 0;
                setUnreadCount(prev => Math.max(prev, unread));
            } catch (err) {
                console.error('Error checking notification status:', err);
            }
        };

        checkStatusAndRefreshToken();
    }, [isSignedIn]);

    // ── Foreground FCM message handler ───────────────────────────────────────
    useEffect(() => {
        if (!isEnabled) return;

        const unsubscribe = onForegroundMessage((payload) => {
            showNotification(
                payload.notification?.title || 'DevTrack',
                { body: payload.notification?.body, data: payload.data }
            );
            // Refresh in-app list when a push arrives in foreground
            fetchNotifications();
        });

        return () => { if (unsubscribe) unsubscribe(); };
    }, [isEnabled, fetchNotifications]);

    // ── Actions ───────────────────────────────────────────────────────────────

    const markRead = useCallback(async (id) => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await notificationsApi.markRead(id);
        } catch (err) {
            console.error('Failed to mark notification read:', err);
            // Revert state on failure (optional, listener will eventually sync anyway)
        }
    }, []);

    const markAllRead = useCallback(async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            await notificationsApi.markAllRead();
        } catch (err) {
            console.error('Failed to mark all read:', err);
        }
    }, []);

    const deleteNotification = useCallback(async (id) => {
        // Optimistic update
        setNotifications(prev => {
            const removed = prev.find(n => n.id === id);
            if (removed && !removed.read) {
                setUnreadCount(c => Math.max(0, c - 1));
            }
            return prev.filter(n => n.id !== id);
        });

        try {
            await notificationsApi.deleteOne(id);
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    }, []);

    const requestPermissionHandler = useCallback(async () => {
        if (!('Notification' in window)) {
            setError('Notifications are not supported in this browser');
            return false;
        }
        if (Notification.permission === 'denied') {
            setPermission('denied');
            setError('Notification permission denied. Please enable it in your browser settings.');
            return false;
        }
        const result = await Notification.requestPermission();
        setPermission(result);
        return result === 'granted';
    }, []);

    const registerForNotifications = useCallback(async () => {
        if (!isSignedIn) {
            setError('You must be signed in to enable notifications');
            return false;
        }
        setLoading(true);
        setError(null);
        try {
            const token = await requestNotificationPermission();
            if (!token) {
                setError('Could not get notification token. Please check browser permissions.');
                return false;
            }
            setFcmToken(token);
            setPermission('granted');
            await notificationsApi.registerToken(token);
            setIsEnabled(true);
            return true;
        } catch (err) {
            setError(err.message || 'Failed to enable notifications');
            return false;
        } finally {
            setLoading(false);
        }
    }, [isSignedIn]);

    const unregisterFromNotifications = useCallback(async () => {
        if (!isSignedIn) return false;
        setLoading(true);
        setError(null);
        try {
            await notificationsApi.unregisterToken(fcmToken);
            setIsEnabled(false);
            setFcmToken(null);
            return true;
        } catch (err) {
            setError(err.message || 'Failed to disable notifications');
            return false;
        } finally {
            setLoading(false);
        }
    }, [isSignedIn, fcmToken]);

    const sendTestNotification = useCallback(async () => {
        if (!isSignedIn || !isEnabled) {
            setError('Notifications must be enabled first');
            return false;
        }
        setLoading(true);
        setError(null);
        try {
            await notificationsApi.sendTest();
            // Refresh list after test
            setTimeout(fetchNotifications, 1500);
            return true;
        } catch (err) {
            setError(err.message || 'Failed to send test notification');
            return false;
        } finally {
            setLoading(false);
        }
    }, [isSignedIn, isEnabled, fetchNotifications]);

    const showLocalNotification = useCallback((title, options = {}) => {
        if (permission !== 'granted') return;
        showNotification(title, options);
    }, [permission]);

    return {
        // Push / FCM state
        permission,
        isEnabled,
        loading,
        error,
        fcmToken,
        isSupported: 'Notification' in window,

        // In-app notifications
        notifications,
        unreadCount,
        notificationsLoading,

        // Push actions
        requestPermission: requestPermissionHandler,
        registerForNotifications,
        unregisterFromNotifications,
        sendTestNotification,
        showLocalNotification,

        // In-app notification actions
        fetchNotifications,
        markRead,
        markAllRead,
        deleteNotification,

        // Misc
        clearError: () => setError(null),
    };
};

export default useNotifications;
