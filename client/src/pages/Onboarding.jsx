import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { preferencesApi, authApi } from '../services/api';
import {
    Rocket,
    Zap,
    Package,
    PartyPopper,
    CheckCircle
} from 'lucide-react';

// Step 1: Welcome Step
const WelcomeStep = ({ onNext, onSkip }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="text-center"
    >
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Rocket size={48} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">
            Welcome to DevTrack
        </h1>
        <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
            Your coding consistency tracker. Just one quick question to personalize your experience!
        </p>
        <div className="flex flex-col gap-3">
            <button
                onClick={onNext}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
            >
                Let's Get Started
            </button>
            <button
                onClick={onSkip}
                className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
                Skip with defaults
            </button>
        </div>
    </motion.div>
);

// Step 2: Quick Setup - Only the essential question
const QuickSetupStep = ({ value, onChange, onComplete, onBack, loading }) => (
    <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
    >
        <h2 className="text-2xl font-bold text-white mb-2">Quick Setup</h2>
        <p className="text-slate-400 mb-6">How do you usually commit your code?</p>

        <div className="space-y-4 mb-8">
            <button
                onClick={() => onChange('frequent')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${value === 'frequent'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
            >
                <div className="flex items-center gap-4">
                    <Zap className="text-purple-400" size={24} />
                    <div>
                        <p className="font-semibold text-white">Frequent commits</p>
                        <p className="text-sm text-slate-400">I commit regularly while coding</p>
                    </div>
                    {value === 'frequent' && <CheckCircle className="ml-auto text-purple-400" size={20} />}
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
                    <Package className="text-pink-400" size={24} />
                    <div>
                        <p className="font-semibold text-white">End-of-session commits</p>
                        <p className="text-sm text-slate-400">I commit once when I'm done</p>
                    </div>
                    {value === 'end-only' && <CheckCircle className="ml-auto text-purple-400" size={20} />}
                </div>
            </button>
        </div>

        <div className="flex gap-4">
            <button onClick={onBack} className="px-6 py-3 text-slate-400 hover:text-white transition-colors">
                Back
            </button>
            <button
                onClick={onComplete}
                disabled={!value || loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                    </>
                ) : (
                    <>
                        <PartyPopper size={18} />
                        Complete Setup
                    </>
                )}
            </button>
        </div>
    </motion.div>
);

// Progress indicator (2 steps only)
const ProgressBar = ({ currentStep }) => (
    <div className="flex gap-2 mb-8">
        {[0, 1].map((index) => (
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
            // Save preferences with sensible defaults
            await preferencesApi.save({
                preferences,
                userGoal: 'Building great projects',
            });

            // Trigger sync to get GitHub data
            try {
                await authApi.sync();
            } catch (syncErr) {
                console.error('Initial sync failed:', syncErr);
            }

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
        <WelcomeStep key="welcome" onNext={() => setStep(1)} onSkip={handleSkip} />,
        <QuickSetupStep
            key="setup"
            value={preferences.commitPattern}
            onChange={(v) => setPreferences({ ...preferences, commitPattern: v })}
            onComplete={handleComplete}
            onBack={() => setStep(0)}
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
                {step > 0 && <ProgressBar currentStep={step - 1} />}

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
