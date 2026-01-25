import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SiLeetcode } from 'react-icons/si';
import { leetCodeApi } from '../../services/api';
import { Trophy, Flame, Target, Calendar, ExternalLink, RefreshCw, AlertTriangle, Edit2, Check, X, Zap } from 'lucide-react';
import Button from '../ui/Button';

export default function LeetCodeStats() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [usernameInput, setUsernameInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [verificationStep, setVerificationStep] = useState('INPUT');
    const [verificationCode, setVerificationCode] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await leetCodeApi.getStats();
            setStats(response.data.data);
            if (response.data.data?.username) {
                setUsernameInput(response.data.data.username);
            }
        } catch (err) {
            console.error('Failed to fetch LeetCode stats:', err);
            setError('Failed to load LeetCode data');
        } finally {
            setLoading(false);
        }
    };

    const handleInitiateVerification = () => {
        if (!usernameInput.trim()) return;
        // Generate a random 6-character code
        const code = `devtrack-${Math.random().toString(36).substring(2, 8)}`;
        setVerificationCode(code);
        setVerificationStep('VERIFY');
        setError(null);
    };

    const handleVerifyAndSave = async () => {
        try {
            setSaving(true);
            await leetCodeApi.updateConfig(usernameInput, verificationCode);
            setIsEditing(false);
            fetchStats();
            // Reset state
            setVerificationStep('INPUT');
            setVerificationCode('');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Verification failed');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setError(null);
        setVerificationStep('INPUT');
        setVerificationCode('');
    };

    if (loading) {
        return (
            <div className="rounded-2xl p-6 border border-white/10 bg-white/5 h-full animate-pulse flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
            </div>
        );
    }

    if (!stats && !isEditing) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-6 border border-white/10 h-full relative overflow-hidden group"
                style={{
                    background: 'linear-gradient(145deg, rgba(40, 40, 40, 0.9), rgba(30, 30, 30, 0.95))',
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center mb-2 shadow-lg shadow-orange-500/20">
                        <SiLeetcode className="text-white text-3xl" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Connect LeetCode</h3>
                        <p className="text-slate-400 text-sm mt-1 max-w-[200px] mx-auto">
                            Track your coding practice progress directly in your learning log.
                        </p>
                    </div>
                    <Button onClick={() => setIsEditing(true)} className="mt-2">
                        Connect Account
                    </Button>
                </div>
            </motion.div>
        );
    }

    if (isEditing) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-6 border border-white/10 h-full flex flex-col justify-center"
                style={{
                    background: 'linear-gradient(145deg, rgba(40, 40, 40, 0.9), rgba(30, 30, 30, 0.95))',
                }}
            >
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <SiLeetcode className="text-orange-500" />
                    {verificationStep === 'INPUT' ? 'Connect LeetCode' : 'Verify Ownership'}
                </h3>

                {verificationStep === 'INPUT' ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-bold">Username</label>
                            <input
                                type="text"
                                value={usernameInput}
                                onChange={(e) => setUsernameInput(e.target.value)}
                                placeholder="e.g. tourist"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none transition-colors"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-xs">
                                <AlertTriangle size={14} className="flex-shrink-0" />
                                <span className="flex-1">{error}</span>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={handleCancel} className="flex-1">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleInitiateVerification}
                                className="flex-1 bg-orange-500 hover:bg-orange-600 border-none"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                            <p className="text-xs text-orange-200 mb-2 font-medium">
                                To verify this account is yours:
                            </p>
                            <ol className="list-decimal list-inside text-[10px] text-slate-400 space-y-1 mb-3">
                                <li>Go to your LeetCode <strong>Profile</strong> settings</li>
                                <li>Add the code below to your <strong>Summary</strong></li>
                                <li>Come back and click verify</li>
                            </ol>
                            <div className="flex bg-black/40 rounded-lg p-2 items-center justify-between border border-white/10">
                                <code className="text-orange-400 font-mono text-xs select-all text-center flex-1">{verificationCode}</code>
                                <Button
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                                    onClick={() => navigator.clipboard.writeText(verificationCode)}
                                >
                                    <Check size={12} />
                                </Button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-xs">
                                <AlertTriangle size={14} className="flex-shrink-0" />
                                <span className="flex-1">{error}</span>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setVerificationStep('INPUT')} className="flex-1 text-xs">
                                Back
                            </Button>
                            <Button
                                onClick={handleVerifyAndSave}
                                disabled={saving}
                                className="flex-1 bg-orange-500 hover:bg-orange-600 border-none"
                            >
                                {saving ? <RefreshCw className="animate-spin w-4 h-4" /> : 'Verify & Save'}
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>
        );
    }

    const difficultyColor = {
        All: 'text-white',
        Easy: 'text-emerald-500',
        Medium: 'text-yellow-500',
        Hard: 'text-red-500'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5 border border-white/10 h-full flex flex-col relative overflow-hidden group"
            style={{
                background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.9), rgba(20, 25, 40, 0.95))',
            }}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5">
                        <img src={stats.avatar} alt={stats.realName} className="w-full h-full rounded-xl object-cover" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">{stats.realName || stats.username}</h3>
                        <p className="text-xs text-slate-400">Rank: #{stats.ranking.toLocaleString()}</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-white/5 hover:text-white transition-colors"
                >
                    <Edit2 size={14} />
                </button>
            </div>

            {/* Main Stats Grid */}
            <div className="flex items-center gap-3 mb-3 relative z-10 text-white h-12 flex-shrink-0">
                <div className="bg-white/5 rounded-lg border border-white/5 px-4 h-full flex flex-col justify-center items-center min-w-[80px]">
                    <div className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Solved</div>
                    <div className="text-xl font-bold leading-none mt-0.5">{stats.totalSolved}</div>
                </div>

                <div className="flex-1 flex border-l border-white/10 pl-4 h-8 items-center justify-around">
                    <div className="flex flex-col items-center justify-center gap-1" title="Easy">
                        <Target size={14} className="text-emerald-500" />
                        <span className="text-xs font-bold text-white">{stats.easySolved}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1" title="Medium">
                        <Zap size={14} className="text-yellow-500 fill-yellow-500/20" />
                        <span className="text-xs font-bold text-white">{stats.mediumSolved}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1" title="Hard">
                        <Flame size={14} className="text-red-500 fill-red-500/20" />
                        <span className="text-xs font-bold text-white">{stats.hardSolved}</span>
                    </div>
                </div>
            </div>

            {/* Recent Submissions */}
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2 flex-shrink-0">
                <Calendar size={10} /> Recent Activity
            </h4>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar relative z-10 -mr-1">
                <div className="space-y-2 pb-1">
                    {stats.recentSubmissions.map((sub) => (
                        <a
                            key={sub.id}
                            href={`https://leetcode.com/problems/${sub.titleSlug}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group/item"
                        >
                            <div className="flex justify-between items-start gap-2">
                                <span className="text-xs text-slate-200 font-medium line-clamp-1 group-hover/item:text-orange-400 transition-colors flex-1" title={sub.title}>
                                    {sub.title}
                                </span>
                                <ExternalLink size={10} className="text-slate-500 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">
                                {new Date(parseInt(sub.timestamp) * 1000).toLocaleDateString()}
                            </div>
                        </a>
                    ))}
                    {stats.recentSubmissions.length === 0 && (
                        <div className="text-center py-4 text-slate-500 text-xs italic">
                            No recent submissions
                        </div>
                    )}
                </div>
            </div>

            {/* Decor */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        </motion.div>
    );
}
