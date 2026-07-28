import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';

const COMMANDS = [
    { id: 'dash', label: 'Go to Dashboard', category: 'Navigation', path: '/dashboard', icon: '📊' },
    { id: 'projects', label: 'View Projects', category: 'Navigation', path: '/projects', icon: '📁' },
    { id: 'chat', label: 'AI Chat Assistant', category: 'AI Tools', path: '/chat', actionKey: 'ai_chat', icon: '🤖' },
    { id: 'insights', label: 'Productivity Insights', category: 'AI Tools', path: '/insights', actionKey: 'ai_insights', icon: '⚡' },
    { id: 'logs', label: 'Learning Tracker Logs', category: 'Navigation', path: '/logs', icon: '📝' },
    { id: 'pricing', label: 'Upgrade / Subscription', category: 'Account', path: '/pricing', icon: '✨' },
    { id: 'settings', label: 'Preferences & Settings', category: 'Account', path: '/settings', icon: '⚙️' },
];

const CommandPalette = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const { remaining } = useSubscription();

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen((prev) => !prev);
            } else if (e.key === 'Escape') {
                setOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!open) return null;

    const filtered = COMMANDS.filter((cmd) =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase())
    );

    const handleSelect = (path) => {
        setOpen(false);
        setQuery('');
        navigate(path);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
                {/* Search Input */}
                <div className="flex items-center px-4 border-b border-slate-800">
                    <span className="text-slate-400 mr-3">🔍</span>
                    <input
                        type="text"
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Type a command or search... (Esc to close)"
                        className="w-full py-3.5 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                    <kbd className="px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 rounded border border-slate-700">
                        ESC
                    </kbd>
                </div>

                {/* Commands List */}
                <div className="max-h-80 overflow-y-auto p-2">
                    {filtered.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">No matching commands found</div>
                    ) : (
                        filtered.map((cmd) => {
                            const rem = cmd.actionKey ? remaining(cmd.actionKey) : null;
                            return (
                                <button
                                    key={cmd.id}
                                    onClick={() => handleSelect(cmd.path)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800/80 transition-colors text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-base">{cmd.icon}</span>
                                        <div>
                                            <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                                                {cmd.label}
                                            </span>
                                            <span className="text-[10px] text-slate-500 block">{cmd.category}</span>
                                        </div>
                                    </div>
                                    {rem !== null && rem !== Infinity && (
                                        <span className="text-[11px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
                                            {rem} left
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
