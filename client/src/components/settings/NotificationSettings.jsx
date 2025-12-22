import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { preferencesApi, notificationsApi } from '../../services/api';
import useNotifications from '../../hooks/useNotifications';
import MobileAppToken from '../MobileAppToken';

/**
 * Notification Settings Modal/Panel
 * Allows users to update their notification preferences
 */
const NotificationSettings = ({ isOpen, onClose }) => {
    const {
        permission,
        isEnabled,
        isSupported,
        loading: notifLoading,
        requestPermission,
        registerForNotifications,
        unregisterFromNotifications,
        sendTestNotification,
    } = useNotifications();

    const [preferences, setPreferences] = useState({
        commitPattern: 'frequent',
        autoEndDuration: 'midnight',
        reminderMode: 'adaptive',
        fixedTime: null,
        breakDetection: true,
    });
    const [userGoal, setUserGoal] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Load current preferences
    useEffect(() => {
        if (isOpen) {
            loadPreferences();
        }
    }, [isOpen]);

    const loadPreferences = async () => {
        try {
            const response = await preferencesApi.get();
            const data = response.data.data;
            if (data.preferences) {
                setPreferences(data.preferences);
            }
            if (data.userGoal) {
                setUserGoal(data.userGoal);
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await preferencesApi.update({ preferences, userGoal });
            setMessage({ type: 'success', text: 'Preferences saved successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save preferences' });
        } finally {
            setSaving(false);
        }
    };

    const handleTestNotification = async () => {
        try {
            await sendTestNotification();
            setMessage({ type: 'success', text: 'Test notification sent!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to send test notification' });
        }
    };

    const goals = [
        'Learning new tech stack',
        'Working on side projects',
        'Preparing for placements',
        'Freelance work',
        'Personal portfolio',
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-800">
                        <h2 className="text-xl font-bold text-white">Settings</h2>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Notification Status */}
                                <div className="bg-slate-800/50 rounded-xl p-4">
                                    <h3 className="text-lg font-semibold text-white mb-3">Push Notifications</h3>

                                    {!isSupported ? (
                                        <p className="text-yellow-400 text-sm">
                                            Your browser doesn't support push notifications.
                                        </p>
                                    ) : permission === 'denied' ? (
                                        <p className="text-red-400 text-sm">
                                            Notifications are blocked. Please enable them in your browser settings.
                                        </p>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white">
                                                    Status: {isEnabled ? (
                                                        <span className="text-green-400">Enabled</span>
                                                    ) : (
                                                        <span className="text-slate-400">Disabled</span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-slate-400">
                                                    {isEnabled
                                                        ? 'You will receive reminders at your scheduled time'
                                                        : 'Enable to receive daily coding reminders'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={isEnabled ? unregisterFromNotifications : registerForNotifications}
                                                disabled={notifLoading}
                                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isEnabled
                                                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                                                    : 'bg-purple-600 text-white hover:bg-purple-500'
                                                    }`}
                                            >
                                                {notifLoading ? 'Loading...' : isEnabled ? 'Disable' : 'Enable'}
                                            </button>
                                        </div>
                                    )}

                                    {isEnabled && (
                                        <button
                                            onClick={handleTestNotification}
                                            className="mt-3 text-sm text-purple-400 hover:text-purple-300"
                                        >
                                            Send test notification →
                                        </button>
                                    )}
                                </div>

                                {/* Mobile App Token */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Mobile Connectivity</h3>
                                    <MobileAppToken />
                                </div>

                                {/* Reminder Mode */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Reminder Timing</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setPreferences({ ...preferences, reminderMode: 'adaptive' })}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${preferences.reminderMode === 'adaptive'
                                                ? 'border-purple-500 bg-purple-500/10'
                                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                                }`}
                                        >
                                            <p className="font-semibold text-white">🎯 Adaptive</p>
                                            <p className="text-sm text-slate-400">Same time as yesterday</p>
                                        </button>
                                        <button
                                            onClick={() => setPreferences({ ...preferences, reminderMode: 'fixed' })}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${preferences.reminderMode === 'fixed'
                                                ? 'border-purple-500 bg-purple-500/10'
                                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                                }`}
                                        >
                                            <p className="font-semibold text-white">⏰ Fixed Time</p>
                                            <p className="text-sm text-slate-400">Set a specific time</p>
                                        </button>
                                    </div>

                                    {preferences.reminderMode === 'fixed' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mt-4"
                                        >
                                            <label className="block text-sm text-slate-400 mb-2">Daily reminder time</label>
                                            <input
                                                type="time"
                                                value={preferences.fixedTime || '09:00'}
                                                onChange={(e) => setPreferences({ ...preferences, fixedTime: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                                            />
                                        </motion.div>
                                    )}
                                </div>

                                {/* Work Pattern */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Work Pattern</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setPreferences({ ...preferences, commitPattern: 'frequent' })}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${preferences.commitPattern === 'frequent'
                                                ? 'border-purple-500 bg-purple-500/10'
                                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                                }`}
                                        >
                                            <p className="font-semibold text-white">⚡ Frequent</p>
                                            <p className="text-sm text-slate-400">Multiple commits per day</p>
                                        </button>
                                        <button
                                            onClick={() => setPreferences({ ...preferences, commitPattern: 'end-only' })}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${preferences.commitPattern === 'end-only'
                                                ? 'border-purple-500 bg-purple-500/10'
                                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                                }`}
                                        >
                                            <p className="font-semibold text-white">📦 End-only</p>
                                            <p className="text-sm text-slate-400">One commit at end of day</p>
                                        </button>
                                    </div>
                                </div>

                                {/* Break Detection */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Break Detection</h3>
                                    <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-4">
                                        <div>
                                            <p className="text-white">Auto-detect breaks</p>
                                            <p className="text-sm text-slate-400">Notify after 90 minutes of inactivity</p>
                                        </div>
                                        <button
                                            onClick={() => setPreferences({ ...preferences, breakDetection: !preferences.breakDetection })}
                                            className={`w-14 h-8 rounded-full transition-colors ${preferences.breakDetection ? 'bg-purple-600' : 'bg-slate-700'
                                                }`}
                                        >
                                            <div className={`w-6 h-6 bg-white rounded-full transition-transform mx-1 ${preferences.breakDetection ? 'translate-x-6' : 'translate-x-0'
                                                }`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Auto-End Duration */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Auto-End Session</h3>
                                    <select
                                        value={preferences.autoEndDuration}
                                        onChange={(e) => setPreferences({ ...preferences, autoEndDuration: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                                    >
                                        <option value="midnight">At midnight</option>
                                        <option value="12h">After 12 hours</option>
                                        <option value="24h">After 24 hours</option>
                                        <option value="48h">After 48 hours</option>
                                    </select>
                                </div>

                                {/* User Goal */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Current Focus</h3>
                                    <select
                                        value={userGoal}
                                        onChange={(e) => setUserGoal(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                                    >
                                        <option value="">Select your focus...</option>
                                        {goals.map((goal) => (
                                            <option key={goal} value={goal}>{goal}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        value={!goals.includes(userGoal) ? userGoal : ''}
                                        onChange={(e) => setUserGoal(e.target.value)}
                                        placeholder="Or type your own..."
                                        className="w-full mt-2 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                                    />
                                </div>

                                {/* Message */}
                                {message.text && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-xl ${message.type === 'success'
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            }`}
                                    >
                                        {message.text}
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-4 p-6 border-t border-slate-800">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default NotificationSettings;
