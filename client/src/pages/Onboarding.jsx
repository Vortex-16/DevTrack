import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { preferencesApi, notificationsApi } from '../services/api';

// Step components
const WelcomeStep = ({ onNext }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="text-center"
    >
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-5xl">🚀</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">
            Welcome to DevTrack
        </h1>
        <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
            Your coding consistency tracker. Let's personalize your workflow to help you build better habits.
        </p>
        <button
            onClick={onNext}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
        >
            Let's Get Started
        </button>
    </motion.div>
);

const WorkPatternStep = ({ value, onChange, onNext, onBack }) => (
    <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
    >
        <h2 className="text-2xl font-bold text-white mb-2">Work Pattern</h2>
        <p className="text-slate-400 mb-6">How do you usually work during the day?</p>

        <div className="space-y-4 mb-8">
            <button
                onClick={() => onChange('frequent')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${value === 'frequent'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
            >
                <div className="flex items-center gap-4">
                    <span className="text-2xl">⚡</span>
                    <div>
                        <p className="font-semibold text-white">I commit frequently while coding</p>
                        <p className="text-sm text-slate-400">Uses commit timestamps, detects breaks automatically after 90 min inactivity</p>
                    </div>
                </div>
            </button>

            <button
                onClick={() => onChange('end-only')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${value === 'end-only'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
            >
                <div className="flex items-center gap-4">
                    <span className="text-2xl">📦</span>
                    <div>
                        <p className="font-semibold text-white">I commit only once after finishing work</p>
                        <p className="text-sm text-slate-400">Manual confirmation required, no automatic break marking</p>
                    </div>
                </div>
            </button>
        </div>

        <div className="flex gap-4">
            <button onClick={onBack} className="px-6 py-3 text-slate-400 hover:text-white transition-colors">
                Back
            </button>
            <button
                onClick={onNext}
                disabled={!value}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Continue
            </button>
        </div>
    </motion.div>
);

const AutoEndStep = ({ value, onChange, onNext, onBack }) => {
    const options = [
        { value: 'midnight', label: 'End at midnight', description: 'Default - Sessions end at 12:00 AM' },
        { value: '12h', label: '12 hours', description: 'Automatically end after 12 hours' },
        { value: '24h', label: '24 hours', description: 'Automatically end after 24 hours' },
        { value: '48h', label: '48 hours', description: 'Maximum - End after 48 hours' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
        >
            <h2 className="text-2xl font-bold text-white mb-2">Auto-End Settings</h2>
            <p className="text-slate-400 mb-6">How long should DevTrack keep your session active if you forget to end it?</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${value === option.value
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                            }`}
                    >
                        <p className="font-semibold text-white">{option.label}</p>
                        <p className="text-sm text-slate-400">{option.description}</p>
                    </button>
                ))}
            </div>

            <div className="flex gap-4">
                <button onClick={onBack} className="px-6 py-3 text-slate-400 hover:text-white transition-colors">
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!value}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Continue
                </button>
            </div>
        </motion.div>
    );
};

const ReminderStep = ({ mode, fixedTime, onModeChange, onTimeChange, onNext, onBack }) => (
    <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
    >
        <h2 className="text-2xl font-bold text-white mb-2">Reminder Timing</h2>
        <p className="text-slate-400 mb-6">When should DevTrack remind you to start coding every day?</p>

        <div className="space-y-4 mb-6">
            <button
                onClick={() => onModeChange('adaptive')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${mode === 'adaptive'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
            >
                <div className="flex items-center gap-4">
                    <span className="text-2xl">🎯</span>
                    <div>
                        <p className="font-semibold text-white">Same time as yesterday's start</p>
                        <p className="text-sm text-slate-400">Adaptive mode - learns from your habits</p>
                    </div>
                </div>
            </button>

            <button
                onClick={() => onModeChange('fixed')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${mode === 'fixed'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
            >
                <div className="flex items-center gap-4">
                    <span className="text-2xl">⏰</span>
                    <div>
                        <p className="font-semibold text-white">Fixed time every day</p>
                        <p className="text-sm text-slate-400">Set a specific time for daily reminders</p>
                    </div>
                </div>
            </button>
        </div>

        {mode === 'fixed' && (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6"
            >
                <label className="block text-sm text-slate-400 mb-2">Reminder Time</label>
                <input
                    type="time"
                    value={fixedTime || '09:00'}
                    onChange={(e) => onTimeChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                />
            </motion.div>
        )}

        <div className="flex gap-4">
            <button onClick={onBack} className="px-6 py-3 text-slate-400 hover:text-white transition-colors">
                Back
            </button>
            <button
                onClick={onNext}
                disabled={!mode}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Continue
            </button>
        </div>
    </motion.div>
);

const GoalStep = ({ value, onChange, onNext, onBack }) => {
    const goals = [
        { value: 'Learning new tech stack', emoji: '📚' },
        { value: 'Working on side projects', emoji: '🛠️' },
        { value: 'Preparing for placements', emoji: '💼' },
        { value: 'Freelance work', emoji: '💰' },
        { value: 'Personal portfolio', emoji: '🖼️' },
    ];

    const [customGoal, setCustomGoal] = useState('');

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
        >
            <h2 className="text-2xl font-bold text-white mb-2">Focus & Motivation</h2>
            <p className="text-slate-400 mb-6">What's your main focus right now?</p>

            <div className="grid grid-cols-1 gap-3 mb-4">
                {goals.map((goal) => (
                    <button
                        key={goal.value}
                        onClick={() => onChange(goal.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${value === goal.value
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                            }`}
                    >
                        <span className="text-xl mr-3">{goal.emoji}</span>
                        <span className="text-white">{goal.value}</span>
                    </button>
                ))}
            </div>

            <div className="mb-8">
                <label className="block text-sm text-slate-400 mb-2">Or enter your own:</label>
                <input
                    type="text"
                    value={customGoal}
                    onChange={(e) => {
                        setCustomGoal(e.target.value);
                        if (e.target.value) onChange(e.target.value);
                    }}
                    placeholder="e.g., Building a startup"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
            </div>

            <div className="flex gap-4">
                <button onClick={onBack} className="px-6 py-3 text-slate-400 hover:text-white transition-colors">
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!value}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Continue
                </button>
            </div>
        </motion.div>
    );
};

const BreakDetectionStep = ({ value, onChange, onNext, onBack }) => (
    <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
    >
        <h2 className="text-2xl font-bold text-white mb-2">Break Tracking</h2>
        <p className="text-slate-400 mb-6">Would you like DevTrack to detect breaks automatically?</p>

        <div className="space-y-4 mb-8">
            <button
                onClick={() => onChange(true)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${value === true
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
            >
                <div className="flex items-center gap-4">
                    <span className="text-2xl">🤖</span>
                    <div>
                        <p className="font-semibold text-white">Yes, auto-detect inactive periods</p>
                        <p className="text-sm text-slate-400">DevTrack will notify you after 90 minutes of no commits</p>
                    </div>
                </div>
            </button>

            <button
                onClick={() => onChange(false)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${value === false
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
            >
                <div className="flex items-center gap-4">
                    <span className="text-2xl">✋</span>
                    <div>
                        <p className="font-semibold text-white">No, I'll manage breaks manually</p>
                        <p className="text-sm text-slate-400">You control when to mark breaks</p>
                    </div>
                </div>
            </button>
        </div>

        <div className="flex gap-4">
            <button onClick={onBack} className="px-6 py-3 text-slate-400 hover:text-white transition-colors">
                Back
            </button>
            <button
                onClick={onNext}
                disabled={value === null}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Continue
            </button>
        </div>
    </motion.div>
);

const ConfirmationStep = ({ preferences, userGoal, onBack, onComplete, loading }) => (
    <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
    >
        <h2 className="text-2xl font-bold text-white mb-2">Ready to Go! 🎉</h2>
        <p className="text-slate-400 mb-6">Here's a summary of your preferences:</p>

        <div className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-slate-700">
            <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400">Work Pattern</span>
                    <span className="text-white font-medium">
                        {preferences.commitPattern === 'frequent' ? '⚡ Frequent commits' : '📦 End-only commits'}
                    </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400">Auto-End</span>
                    <span className="text-white font-medium">
                        {preferences.autoEndDuration === 'midnight' ? '🌙 At midnight' : `⏱️ After ${preferences.autoEndDuration}`}
                    </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400">Reminders</span>
                    <span className="text-white font-medium">
                        {preferences.reminderMode === 'adaptive'
                            ? '🎯 Adaptive'
                            : `⏰ Fixed at ${preferences.fixedTime}`}
                    </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400">Break Detection</span>
                    <span className="text-white font-medium">
                        {preferences.breakDetection ? '🤖 Auto-detect' : '✋ Manual'}
                    </span>
                </div>
                <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400">Focus</span>
                    <span className="text-white font-medium">{userGoal || 'Not set'}</span>
                </div>
            </div>
        </div>

        <div className="flex gap-4">
            <button onClick={onBack} className="px-6 py-3 text-slate-400 hover:text-white transition-colors">
                Back
            </button>
            <button
                onClick={onComplete}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all duration-300 disabled:opacity-50"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                    </span>
                ) : (
                    'Complete Setup'
                )}
            </button>
        </div>
    </motion.div>
);

// Progress indicator
const ProgressBar = ({ currentStep, totalSteps }) => (
    <div className="flex gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, index) => (
            <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${index <= currentStep ? 'bg-purple-500' : 'bg-slate-700'
                    }`}
            />
        ))}
    </div>
);

// Main Onboarding Component
const Onboarding = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    const [preferences, setPreferences] = useState({
        commitPattern: 'frequent',
        autoEndDuration: 'midnight',
        reminderMode: 'adaptive',
        fixedTime: null,
        breakDetection: true,
    });
    const [userGoal, setUserGoal] = useState('');

    // Check if user has already completed onboarding
    useEffect(() => {
        const checkOnboardingStatus = async () => {
            try {
                const response = await preferencesApi.get();
                if (response.data?.data?.onboardingCompleted) {
                    navigate('/dashboard', { replace: true });
                }
            } catch (error) {
                console.log('No existing preferences, showing onboarding');
            } finally {
                setCheckingStatus(false);
            }
        };

        checkOnboardingStatus();
    }, [navigate]);

    const handleComplete = async () => {
        setLoading(true);
        try {
            // Save preferences
            await preferencesApi.save({
                preferences,
                userGoal,
            });

            // Request notification permission
            if ('Notification' in window && Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                console.log('Notification permission:', permission);
            }

            // Navigate to dashboard
            navigate('/dashboard', { replace: true });
        } catch (error) {
            console.error('Error saving preferences:', error);
            alert('Failed to save preferences. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        setLoading(true);
        try {
            await preferencesApi.skip();
            navigate('/dashboard', { replace: true });
        } catch (error) {
            console.error('Error skipping onboarding:', error);
            navigate('/dashboard', { replace: true });
        } finally {
            setLoading(false);
        }
    };

    if (checkingStatus) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const steps = [
        <WelcomeStep key="welcome" onNext={() => setStep(1)} />,
        <WorkPatternStep
            key="work"
            value={preferences.commitPattern}
            onChange={(v) => setPreferences({ ...preferences, commitPattern: v })}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
        />,
        <AutoEndStep
            key="autoend"
            value={preferences.autoEndDuration}
            onChange={(v) => setPreferences({ ...preferences, autoEndDuration: v })}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
        />,
        <ReminderStep
            key="reminder"
            mode={preferences.reminderMode}
            fixedTime={preferences.fixedTime}
            onModeChange={(v) => setPreferences({ ...preferences, reminderMode: v })}
            onTimeChange={(v) => setPreferences({ ...preferences, fixedTime: v })}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
        />,
        <GoalStep
            key="goal"
            value={userGoal}
            onChange={setUserGoal}
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
        />,
        <BreakDetectionStep
            key="break"
            value={preferences.breakDetection}
            onChange={(v) => setPreferences({ ...preferences, breakDetection: v })}
            onNext={() => setStep(6)}
            onBack={() => setStep(4)}
        />,
        <ConfirmationStep
            key="confirm"
            preferences={preferences}
            userGoal={userGoal}
            onBack={() => setStep(5)}
            onComplete={handleComplete}
            loading={loading}
        />,
    ];

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            {/* Background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-lg relative z-10">


                {/* Progress bar */}
                {step > 0 && <ProgressBar currentStep={step - 1} totalSteps={6} />}

                {/* Step content */}
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-800 shadow-2xl">
                    <AnimatePresence mode="wait">
                        {steps[step]}
                    </AnimatePresence>
                </div>

                {/* User info */}
                {user && (
                    <div className="mt-6 text-center text-slate-500 text-sm">
                        Setting up for <span className="text-purple-400">{user.primaryEmailAddress?.emailAddress || user.username}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Onboarding;
