import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TOUR_STEPS = [
    {
        title: '👋 Welcome to DevTrack!',
        content: 'DevTrack connects your learning logs, GitHub projects, and AI insights to map your growth.',
        actionText: 'Next: GitHub Sync',
        path: '/dashboard',
    },
    {
        title: '🐙 Connect GitHub',
        content: 'Sync your repositories to track commits, clone count traffic, and generate automated AI project reports.',
        actionText: 'Next: AI Assistant',
        path: '/projects',
    },
    {
        title: '🤖 Intelligent AI Assistant',
        content: 'Ask technical questions, perform automated code reviews, or generate strategic weekly growth briefs.',
        actionText: 'Next: Pro Features',
        path: '/chat',
    },
    {
        title: '🚀 Pro Features & Quotas',
        content: 'Track limits directly from your header. Upgrade anytime for unlimited AI usage and deep PDF reports.',
        actionText: 'Got it!',
        path: '/pricing',
    },
];

const OnboardingTour = () => {
    const [active, setActive] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const completed = localStorage.getItem('devtrack_onboarding_completed');
        if (!completed) {
            setActive(true);
        }
    }, []);

    if (!active) return null;

    const currentStep = TOUR_STEPS[stepIndex];

    const handleNext = () => {
        if (stepIndex < TOUR_STEPS.length - 1) {
            const nextIndex = stepIndex + 1;
            setStepIndex(nextIndex);
            if (TOUR_STEPS[nextIndex].path) {
                navigate(TOUR_STEPS[nextIndex].path);
            }
        } else {
            dismissTour();
        }
    };

    const dismissTour = () => {
        localStorage.setItem('devtrack_onboarding_completed', 'true');
        setActive(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-40 max-w-sm p-5 bg-slate-900/95 border border-purple-500/40 rounded-2xl shadow-2xl backdrop-blur-md text-slate-100 animate-slide-up">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                    Guide • Step {stepIndex + 1} of {TOUR_STEPS.length}
                </span>
                <button
                    onClick={dismissTour}
                    className="text-xs text-slate-400 hover:text-slate-200"
                >
                    Skip
                </button>
            </div>

            <h4 className="text-base font-bold text-white mb-1.5">{currentStep.title}</h4>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">{currentStep.content}</p>

            <div className="flex justify-between items-center">
                <div className="flex gap-1">
                    {TOUR_STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all ${
                                i === stepIndex ? 'w-4 bg-purple-500' : 'w-1.5 bg-slate-700'
                            }`}
                        />
                    ))}
                </div>
                <button
                    onClick={handleNext}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-all"
                >
                    {currentStep.actionText} →
                </button>
            </div>
        </div>
    );
};

export default OnboardingTour;
