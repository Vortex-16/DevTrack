import { useState, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { motion, AnimatePresence } from 'framer-motion';
import { preferencesApi, notificationsApi, githubApi, reportsApi } from '../../services/api';
import useNotifications from '../../hooks/useNotifications';
import NotificationBell from '../notifications/NotificationBell';
import { Target, Clock, Zap, Package, FileDown } from 'lucide-react';

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
        githubAccessRetentionDays: 7,
        reportSchedule: { dayOfWeek: 1, hour: 15 }
    });
    const [userGoal, setUserGoal] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [downloading, setDownloading] = useState(false);
    const [triggering, setTriggering] = useState(false);
    const [queueStatus, setQueueStatus] = useState(null);
    const [hasReports, setHasReports] = useState(false);
    const [autoDownload, setAutoDownload] = useState(false);
    const autoDownloadRef = useRef(false);
    
    // Sync ref with state
    useEffect(() => {
        autoDownloadRef.current = autoDownload;
    }, [autoDownload]);
    
    const pollingInterval = useRef(null);
    const contentRef = useRef(null);

    // Initialize Lenis for smooth scrolling
    useEffect(() => {
        if (!isOpen || !contentRef.current || loading) return;

        const lenis = new Lenis({
            wrapper: contentRef.current,
            content: contentRef.current.firstElementChild, // Target the inner content div
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            smoothTouch: false,
            touchMultiplier: 2,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, [isOpen, loading]);

    // Load initial data and start polling
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [statusRes, historyRes] = await Promise.all([
                    reportsApi.getStatus(),
                    reportsApi.getHistory({ limit: 1 })
                ]);
                
                if (statusRes.data.success) {
                    setQueueStatus(statusRes.data.data);
                }

                if (historyRes.data.success) {
                    setHasReports(historyRes.data.data.length > 0);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };

        if (isOpen) {
            loadPreferences();
            fetchInitialData();
            startPolling();
        }

        return () => stopPolling();
    }, [isOpen]);

    const startPolling = () => {
        if (pollingInterval.current) return;
        pollingInterval.current = setInterval(async () => {
            // Safety check: Don't poll if Clerk isn't ready or user isn't logged in
            if (!window.Clerk?.session) return;

            try {
                const res = await reportsApi.getStatus();
                if (res.data.success) {
                    const status = res.data.data;
                    setQueueStatus(status);
                    
                    // If auto-download is active and job just finished
                    if (autoDownloadRef.current && !status.pendingJob) {
                        setAutoDownload(false);
                        handleDownloadReport();
                    }

                    // If a job just finished, update reports status
                    if (!status.pendingJob && hasReports === false) {
                        const historyRes = await reportsApi.getHistory({ limit: 1 });
                        if (historyRes.data.success && historyRes.data.data.length > 0) {
                            setHasReports(true);
                        }
                    }
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        }, 5000);
    };

    const stopPolling = () => {
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
        }
    };

    const loadPreferences = async () => {
        try {
            const response = await preferencesApi.get();
            const data = response.data.data;
            
            let finalPreferences = { ...preferences };

            if (data.preferences) {
                finalPreferences = { ...finalPreferences, ...data.preferences };
            }

            if (data.reportPreferences) {
                // Convert UTC (day + hour) from server to local for UI
                const utcHour = data.reportPreferences.hour ?? 15;
                const utcDay = data.reportPreferences.dayOfWeek ?? 1;
                
                // Use a reference date (May 4, 2026 was a Monday, day 1)
                const date = new Date(Date.UTC(2026, 4, 3 + utcDay, utcHour));
                
                finalPreferences.reportSchedule = {
                    ...data.reportPreferences,
                    dayOfWeek: date.getDay(),
                    hour: date.getHours()
                };
            }

            setPreferences(finalPreferences);

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
            const localHour = preferences.reportSchedule?.hour ?? 15;
            const localDay = preferences.reportSchedule?.dayOfWeek ?? 1;
            
            // Use local date to get UTC equivalents
            const date = new Date(2026, 4, 3 + localDay, localHour);
            const utcHour = date.getUTCHours();
            const utcDay = date.getUTCDay();

            const scheduleToSave = {
                ...preferences.reportSchedule,
                dayOfWeek: utcDay,
                hour: utcHour
            };

            await preferencesApi.update({ 
                preferences, 
                userGoal,
                reportPreferences: scheduleToSave 
            });
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

    const handleDownloadReport = async () => {
        setDownloading(true);
        setMessage({ type: '', text: '' });
        try {
            const response = await githubApi.downloadReport();
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `devtrack-report-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setMessage({ type: 'success', text: 'Report downloaded!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            console.error('Download error:', error);
            const errorMsg = error.response?.status === 404 
                ? 'No reports found. Please click "Generate Fresh Report" first.' 
                : 'Failed to download report. Make sure GitHub is connected.';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setDownloading(false);
        }
    };
    const handleTriggerReport = async () => {
        setTriggering(true);
        setAutoDownload(true); // Enable auto-download for this trigger
        setMessage({ type: '', text: '' });
        try {
            await reportsApi.trigger();
            setMessage({ type: 'success', text: 'Report generation started! It will download automatically when ready.' });
            // Start polling immediately to catch the new job
            const res = await reportsApi.getStatus();
            if (res.data.success) setQueueStatus(res.data.data);
        } catch (error) {
            console.error('Trigger error:', error);
            setMessage({ type: 'error', text: 'Failed to start report generation.' });
            setAutoDownload(false);
        } finally {
            setTriggering(false);
        }
    };

    const getProgressStatus = () => {
        if (!queueStatus?.pendingJob) return null;
        const status = queueStatus.pendingJob.status;
        if (status === 'pending') return { label: 'In Queue: Waiting for processing...', percent: 15 };
        if (status === 'processing') return { label: 'Deep Analysis: AI is scanning your GitHub activity...', percent: 65 };
        return { label: `Current Status: ${status}...`, percent: 40 };
    };

    const progress = getProgressStatus();

    const handleScheduleChange = (field, value) => {
        const schedule = preferences.reportSchedule || { dayOfWeek: 1, hour: 15 };
        setPreferences({
            ...preferences,
            reportSchedule: { ...schedule, [field]: Number(value) }
        });
    };

    const getScheduleText = () => {
        const schedule = preferences.reportSchedule || { dayOfWeek: 1, hour: 15 };
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        const localDay = days[schedule.dayOfWeek];
        let localHour = schedule.hour;
        const ampm = localHour >= 12 ? 'PM' : 'AM';
        const displayHour = localHour % 12 || 12;
        
        return `every ${localDay} at ${displayHour}:00 ${ampm}`;
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
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[11000] flex items-center justify-center p-4"
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
                    <div className="flex items-center justify-between p-5 border-b border-slate-800">
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
                    <div ref={contentRef} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Notification Status */}
                                <div className="bg-slate-800/50 rounded-xl p-4">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <h3 className="text-lg font-semibold text-white">Push Notifications</h3>
                                        <div className="relative">
                                            <NotificationBell position="settings" showTooltip={false} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-3">
                                        In-app notifications are now available inside Settings.
                                    </p>

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



                                {/* GitHub Report */}
                                <div className="bg-slate-800/50 rounded-xl p-4">
                                    <h3 className="text-lg font-semibold text-white mb-3">GitHub Report</h3>
                                    <p className="text-sm text-slate-400 mb-4">
                                        Download a comprehensive PDF report of your GitHub activity, including commits, issues, PRs, and more.
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={handleDownloadReport}
                                            disabled={downloading || !hasReports}
                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                            title={!hasReports ? "No reports available yet" : ""}
                                        >
                                            <FileDown size={18} />
                                            {downloading ? 'Downloading...' : 'Download Latest Report'}
                                        </button>
                                        <button
                                            onClick={handleTriggerReport}
                                            disabled={triggering || !!progress}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg border border-slate-700 hover:bg-slate-700 transition-all disabled:opacity-50"
                                        >
                                            <Zap size={18} className={progress ? "text-yellow-400 animate-pulse" : "text-yellow-400"} />
                                            {progress ? 'Processing...' : 'Generate Fresh Report'}
                                        </button>
                                    </div>

                                    {progress && (
                                        <div className="mt-4 p-4 bg-slate-800/80 rounded-xl border border-purple-500/20 shadow-xl shadow-purple-500/5 relative overflow-hidden group">
                                            {/* Background glow */}
                                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
                                            
                                            <div className="flex justify-between items-center mb-3 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{progress.label}</span>
                                                </div>
                                                <span className="text-xs font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">{progress.percent}%</span>
                                            </div>
                                            
                                            <div className="w-full bg-slate-950/50 h-2 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress.percent}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 relative"
                                                    style={{ backgroundSize: '200% 100%' }}
                                                >
                                                    {/* Shimmer Effect */}
                                                    <div className="absolute inset-0 shimmer-gradient animate-shimmer" style={{ width: '200%' }} />
                                                    
                                                    {/* Glow tip */}
                                                    <div className="absolute right-0 top-0 h-full w-4 bg-white/20 blur-sm rounded-full" />
                                                </motion.div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between mt-3">
                                                <p className="text-[10px] text-slate-500 italic">
                                                    Our engine is processing 365 days of data...
                                                </p>
                                                <div className="flex gap-1">
                                                    <div className="w-1 h-1 rounded-full bg-purple-500/30 animate-bounce [animation-delay:-0.3s]" />
                                                    <div className="w-1 h-1 rounded-full bg-purple-500/30 animate-bounce [animation-delay:-0.15s]" />
                                                    <div className="w-1 h-1 rounded-full bg-purple-500/30 animate-bounce" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-4 pt-4 border-t border-slate-700">
                                        <p className="text-sm font-semibold text-white mb-2">Automated Delivery</p>
                                        <div className="flex gap-2 mb-2">
                                            <select
                                                value={preferences.reportSchedule?.dayOfWeek ?? 1}
                                                onChange={(e) => handleScheduleChange('dayOfWeek', e.target.value)}
                                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                                            >
                                                <option value={0}>Sunday</option>
                                                <option value={1}>Monday</option>
                                                <option value={2}>Tuesday</option>
                                                <option value={3}>Wednesday</option>
                                                <option value={4}>Thursday</option>
                                                <option value={5}>Friday</option>
                                                <option value={6}>Saturday</option>
                                            </select>
                                            <select
                                                value={preferences.reportSchedule?.hour ?? 15}
                                                onChange={(e) => handleScheduleChange('hour', e.target.value)}
                                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                                            >
                                                {[...Array(24)].map((_, i) => {
                                                    const d = new Date();
                                                    d.setHours(i, 0, 0, 0);
                                                    const ampm = i >= 12 ? 'PM' : 'AM';
                                                    const displayHour = i % 12 || 12;
                                                    const utcHour = d.getUTCHours();
                                                    return <option key={i} value={i}>{`${displayHour}:00 ${ampm} (${utcHour}:00 UTC)`}</option>
                                                })}
                                            </select>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Reports are currently scheduled to be sent automatically {getScheduleText()} your local time.
                                        </p>
                                    </div>
                                </div>

                                {/* GitHub Private Access Retention */}
                                <div className="bg-slate-800/50 rounded-xl p-4">
                                    <h3 className="text-lg font-semibold text-white mb-3">Private Repo Access Window</h3>
                                    <p className="text-sm text-slate-400 mb-4">
                                        Control how long DevTrack keeps your private-repo OAuth access active before requiring reauthorization.
                                    </p>
                                    <select
                                        value={preferences.githubAccessRetentionDays || 7}
                                        onChange={(e) => setPreferences({ ...preferences, githubAccessRetentionDays: Number(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                                    >
                                        <option value={1}>1 day</option>
                                        <option value={3}>3 days</option>
                                        <option value={7}>7 days (recommended)</option>
                                        <option value={14}>14 days</option>
                                        <option value={30}>30 days</option>
                                    </select>
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
                                            <p className="font-semibold text-white flex items-center gap-2">
                                                <Target size={16} className="text-purple-400" /> Adaptive
                                            </p>
                                            <p className="text-sm text-slate-400">Same time as yesterday</p>
                                        </button>
                                        <button
                                            onClick={() => setPreferences({ ...preferences, reminderMode: 'fixed' })}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${preferences.reminderMode === 'fixed'
                                                ? 'border-purple-500 bg-purple-500/10'
                                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                                }`}
                                        >
                                            <p className="font-semibold text-white flex items-center gap-2">
                                                <Clock size={16} className="text-pink-400" /> Fixed Time
                                            </p>
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
                                            <p className="font-semibold text-white flex items-center gap-2">
                                                <Zap size={16} className="text-purple-400" /> Frequent
                                            </p>
                                            <p className="text-sm text-slate-400">Multiple commits per day</p>
                                        </button>
                                        <button
                                            onClick={() => setPreferences({ ...preferences, commitPattern: 'end-only' })}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${preferences.commitPattern === 'end-only'
                                                ? 'border-purple-500 bg-purple-500/10'
                                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                                }`}
                                        >
                                            <p className="font-semibold text-white flex items-center gap-2">
                                                <Package size={16} className="text-pink-400" /> End-only
                                            </p>
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
                    <div className="flex justify-end gap-4 p-3 border-t border-slate-800">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all"
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
