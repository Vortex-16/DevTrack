import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { notificationsApi } from '../services/api';
import {
    requestNotificationPermission,
    onForegroundMessage,
    showNotification,
    initializeFirebase
} from '../config/firebase';

/**
 * Custom hook for managing push notifications
 * Handles permission requests, FCM token registration, and notification status
 */
const useNotifications = () => {
    const { isSignedIn } = useUser();
    const [permission, setPermission] = useState('default');
    const [isEnabled, setIsEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fcmToken, setFcmToken] = useState(null);

    // Initialize Firebase and check permission on mount
    useEffect(() => {
        // Initialize Firebase
        initializeFirebase();

        // Check current notification permission
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    // Check if notifications are enabled for this user
    // If enabled, also refresh the FCM token to ensure it's for the current domain
    useEffect(() => {
        const checkStatusAndRefreshToken = async () => {
            if (!isSignedIn) return;

            try {
                const response = await notificationsApi.getStatus();
                const enabled = response.data.data?.enabled || false;
                setIsEnabled(enabled);

                // If notifications are enabled, refresh the FCM token
                // This ensures the token is for the CURRENT domain (not localhost)
                if (enabled && Notification.permission === 'granted') {
                    console.log('🔄 Refreshing FCM token for current domain...');
                    try {
                        const token = await requestNotificationPermission();
                        if (token) {
                            console.log('✅ FCM Token refreshed, registering with backend...');
                            await notificationsApi.registerToken(token);
                            setFcmToken(token);
                            console.log('✅ FCM Token registered successfully for this domain');
                        } else {
                            console.warn('⚠️ Could not get FCM token - service worker may not be registered');
                        }
                    } catch (tokenError) {
                        console.error('❌ Error refreshing FCM token:', tokenError);
                    }
                }
            } catch (err) {
                console.error('Error checking notification status:', err);
            }
        };

        checkStatusAndRefreshToken();
    }, [isSignedIn]);


    // Set up foreground message handler
    useEffect(() => {
        if (!isEnabled) return;

        const unsubscribe = onForegroundMessage((payload) => {
            // Show notification when app is in foreground
            showNotification(
                payload.notification?.title || 'DevTrack',
                {
                    body: payload.notification?.body,
                    data: payload.data,
                }
            );
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [isEnabled]);

    /**
     * Request notification permission from the browser
     */
    const requestPermissionHandler = useCallback(async () => {
        if (!('Notification' in window)) {
            setError('Notifications are not supported in this browser');
            return false;
        }

        if (Notification.permission === 'granted') {
            setPermission('granted');
            return true;
        }

        if (Notification.permission === 'denied') {
            setPermission('denied');
            setError('Notification permission was denied. Please enable it in your browser settings.');
            return false;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result === 'granted';
        } catch (err) {
            setError('Failed to request notification permission');
            return false;
        }
    }, []);

    /**
     * Register FCM token with the server
     */
    const registerForNotifications = useCallback(async () => {
        if (!isSignedIn) {
            setError('You must be signed in to enable notifications');
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            // Get FCM token (this also requests permission)
            const token = await requestNotificationPermission();

            if (!token) {
                setError('Could not get notification token. Please check browser permissions.');
                setLoading(false);
                return false;
            }

            setFcmToken(token);
            setPermission('granted');

            // Register token with backend
            await notificationsApi.registerToken(token);
            setIsEnabled(true);

            console.log('✅ Notifications enabled successfully');
            return true;
        } catch (err) {
            console.error('Error registering for notifications:', err);
            setError(err.message || 'Failed to enable notifications');
            return false;
        } finally {
            setLoading(false);
        }
    }, [isSignedIn]);

    /**
     * Unregister from notifications
     */
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
            console.error('Error unregistering from notifications:', err);
            setError(err.message || 'Failed to disable notifications');
            return false;
        } finally {
            setLoading(false);
        }
    }, [isSignedIn]);

    /**
     * Send a test notification to verify setup
     */
    const sendTestNotification = useCallback(async () => {
        if (!isSignedIn || !isEnabled) {
            setError('Notifications must be enabled first');
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            await notificationsApi.sendTest();
            return true;
        } catch (err) {
            console.error('Error sending test notification:', err);
            setError(err.message || 'Failed to send test notification');
            return false;
        } finally {
            setLoading(false);
        }
    }, [isSignedIn, isEnabled]);

    /**
     * Show a local browser notification (for testing)
     */
    const showLocalNotification = useCallback((title, options = {}) => {
        if (permission !== 'granted') {
            console.warn('Notification permission not granted');
            return;
        }

        showNotification(title, options);
    }, [permission]);

    return {
        // State
        permission,
        isEnabled,
        loading,
        error,
        fcmToken,
        isSupported: 'Notification' in window,

        // Actions
        requestPermission: requestPermissionHandler,
        registerForNotifications,
        unregisterFromNotifications,
        sendTestNotification,
        showLocalNotification,

        // Clear error
        clearError: () => setError(null),
    };
};

export default useNotifications;
