import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, RefreshCw } from 'lucide-react';

const ACTIVITY_BACKEND_URL = 'http://localhost:5000';

function formatTime(seconds) {
    if (!seconds || seconds < 60) return '0m';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
}

export default function ActivityStats({ onShowExtensionHelp }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = async (isRefresh = false) => {
        try {
            if (isRefresh) setIsRefreshing(true);
            else setLoading(true);
            const response = await fetch(`${ACTIVITY_BACKEND_URL}/insights/daily`);
            if (!response.ok) throw new Error('Offline');
            setData(await response.json());
            setError(null);
        } catch {
            setError('Offline');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 120000);
        return () => clearInterval(interval);
    }, []);

    const score = data?.summary?.productivity_score || 0;
    const webTime = data?.summary?.total_web_time_seconds || 0;
    const appTime = data?.summary?.total_app_time_seconds || 0;
    const totalTime = webTime + appTime;
    const hasWebData = data?.top_sites?.length > 0;

    const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

    return (
        <div className="h-full rounded-2xl p-4 bg-white/5 backdrop-blur-sm relative overflow-hidden flex flex-col">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-cyan-400" />
                    <span className="text-xs font-medium text-white/90">Daily Activity</span>
                </div>
                <div className="flex items-center gap-2">
                    {!loading && !error && !hasWebData && onShowExtensionHelp && (
                        <button
                            onClick={onShowExtensionHelp}
                            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[9px] px-2 py-0.5 rounded border border-purple-500/20 transition-colors"
                        >
                            Connect Browser
                        </button>
                    )}
                    <button onClick={() => fetchData(true)} disabled={isRefreshing}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/40 hover:text-white transition-all">
                        <RefreshCw size={10} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center flex-1">
                    <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {!loading && error && (
                <div className="flex items-center justify-center flex-1 gap-2">
                    <Zap size={14} className="text-orange-400" />
                    <span className="text-[10px] text-white/40">{error}</span>
                </div>
            )}

            {!loading && !error && data && (
                <div className="flex-1 flex gap-4 min-h-0">
                    {/* Left Col: Score & Totals */}
                    <div className="w-24 flex flex-col justify-between flex-shrink-0">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-white leading-none mb-1">{score}</span>
                            <span className="text-[9px] text-white/50 uppercase tracking-wider">Score</span>
                            <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: scoreColor }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-400">Web</span>
                                <span className="text-white font-medium">{formatTime(webTime)}</span>
                            </div>
                            <div className="w-full h-[1px] bg-white/5" />
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-400">Apps</span>
                                <span className="text-white font-medium">{formatTime(appTime)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Top Activities List */}
                    <div className="flex-1 min-w-0 flex flex-col">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Top Usage</h4>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1 space-y-1.5">
                            {/* Combine Top Sites & Apps */}
                            {[...(data.top_apps || []), ...(data.top_sites || [])]
                                .sort((a, b) => b.total_time - a.total_time)
                                .slice(0, 5)
                                .map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 border border-white/5">
                                        <span className="text-[10px] text-slate-200 truncate flex-1 mr-2" title={item.app_name || item.title || item.domain}>
                                            {item.app_name || item.domain || "Unknown"}
                                        </span>
                                        <span className="text-[10px] text-cyan-400 font-medium whitespace-nowrap">
                                            {formatTime(item.total_time)}
                                        </span>
                                    </div>
                                ))}

                            {(!data.top_apps?.length && !data.top_sites?.length) && (
                                <div className="text-[10px] text-slate-500 text-center py-2">No details yet</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!loading && !error && data && totalTime === 0 && (
                <div className="flex items-center justify-center flex-1">
                    <span className="text-[10px] text-white/30">No activity yet</span>
                </div>
            )}
        </div>
    );
}
