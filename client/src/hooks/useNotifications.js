import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { notificationsApi } from '../services/api';
import {
    requestNotificationPermission,
    onForegroundMessage,
    showNotification,
    initializeFirebase
} from '../config/firebase';

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
    const { isSignedIn } = useUser();

    // ── FCM / Push state ──────────────────────────────────────────────────────
    const [permission, setPermission] = useState('default');
    const [isEnabled, setIsEnabled] = useState(false);
    const [fcmToken, setFcmToken] = useState(null);

    // ── In-app notifications state ────────────────────────────────────────────
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationsLoading, setNotificationsLoading] = useState(false);

    // ── Shared state ──────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const pollIntervalRef = useRef(null);

    // ── Firebase init + permission check on mount ─────────────────────────────
    useEffect(() => {
        initializeFirebase();
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
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

    // ── Auto-poll every 60 seconds ────────────────────────────────────────────
    useEffect(() => {
        if (!isSignedIn) return;

        fetchNotifications();

        pollIntervalRef.current = setInterval(fetchNotifications, 60_000);

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [isSignedIn, fetchNotifications]);

    // ── FCM status check + token refresh on sign-in ───────────────────────────
    useEffect(() => {
        const checkStatusAndRefreshToken = async () => {
            if (!isSignedIn) return;
            try {
                const response = await notificationsApi.getStatus();
                const enabled = response.data.data?.enabled || false;
                setIsEnabled(enabled);

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
        try {
            await notificationsApi.markRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark notification read:', err);
        }
    }, []);

    const markAllRead = useCallback(async () => {
        try {
            await notificationsApi.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all read:', err);
        }
    }, []);

    const deleteNotification = useCallback(async (id) => {
        try {
            await notificationsApi.deleteOne(id);
            setNotifications(prev => {
                const removed = prev.find(n => n.id === id);
                const updated = prev.filter(n => n.id !== id);
                if (removed && !removed.read) {
                    setUnreadCount(c => Math.max(0, c - 1));
                }
                return updated;
            });
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
            await notificationsApi.unregisterToken();
            setIsEnabled(false);
            setFcmToken(null);
            return true;
        } catch (err) {
            setError(err.message || 'Failed to disable notifications');
            return false;
        } finally {
            setLoading(false);
        }
    }, [isSignedIn]);

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
