import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';

/**
 * UpgradePrompt — Modal dialogue shown when a user hits a Free tier quota limit.
 */
const UpgradePrompt = () => {
    const { promptState, closePrompt } = useSubscription();
    const navigate = useNavigate();

    if (!promptState.open) return null;

    const { action, details } = promptState;
    const limit = details?.limit;
    const used = details?.used;
    const resetAt = details?.resetAt ? new Date(details.resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

    const handleUpgradeClick = () => {
        closePrompt();
        navigate('/pricing');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md p-6 bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-950/50 text-slate-100">
                {/* Close Button */}
                <button
                    onClick={closePrompt}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1"
                    aria-label="Close"
                >
                    ✕
                </button>

                {/* Badge Header */}
                <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/50 rounded-full mb-4">
                    <span>✨ DevTrack Pro Feature</span>
                </div>

                <h3 className="text-xl font-bold tracking-tight text-white mb-2">
                    Limit Reached
                </h3>

                <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                    {details?.message || `You've used all available quota for ${action || 'this feature'} on your current plan.`}
                </p>

                {used !== undefined && limit !== undefined && (
                    <div className="p-3 mb-5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs flex justify-between items-center">
                        <span className="text-slate-400">Current Usage</span>
                        <span className="font-mono text-rose-400 font-semibold">{used} / {limit}</span>
                    </div>
                )}

                {resetAt && (
                    <p className="text-xs text-slate-400 mb-5">
                        Daily quota resets at <span className="text-slate-200 font-medium">{resetAt} UTC</span>, or upgrade now for immediate unlimited access.
                    </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={closePrompt}
                        className="w-1/2 px-4 py-2.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                    >
                        Maybe Later
                    </button>
                    <button
                        onClick={handleUpgradeClick}
                        className="w-1/2 px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-600/30 transition-all transform hover:-translate-y-0.5"
                    >
                        Upgrade to Pro →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpgradePrompt;
