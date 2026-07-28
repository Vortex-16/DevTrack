import React from 'react';

/**
 * UsageBar — Visual quota progress indicator
 * Color shifts dynamically:
 *   - Green: < 50% used
 *   - Amber: 50% - 80% used
 *   - Red: > 80% used
 */
const UsageBar = ({ label, used = 0, limit = Infinity, compact = false, showLabel = true }) => {
    if (limit === Infinity) {
        return compact ? (
            <span className="text-xs text-purple-400 font-medium">Unlimited</span>
        ) : (
            <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-400">{label}</span>
                <span className="text-purple-400 font-medium">Unlimited</span>
            </div>
        );
    }

    const percentage = Math.min(100, Math.round((used / limit) * 100));

    let barColor = 'bg-emerald-500';
    let textColor = 'text-emerald-400';

    if (percentage >= 85) {
        barColor = 'bg-rose-500';
        textColor = 'text-rose-400';
    } else if (percentage >= 50) {
        barColor = 'bg-amber-500';
        textColor = 'text-amber-400';
    }

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${barColor} transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <span className={`text-xs font-mono ${textColor}`}>
                    {used}/{limit}
                </span>
            </div>
        );
    }

    return (
        <div className="w-full my-1.5">
            {showLabel && (
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">{label}</span>
                    <span className={`font-mono font-medium ${textColor}`}>
                        {used} / {limit}
                    </span>
                </div>
            )}
            <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
                <div
                    className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

export default UsageBar;
