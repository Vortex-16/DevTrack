import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../../hooks/useNotifications';

// ─── Notification type → icon + accent colour ─────────────────────────────────
const TYPE_META = {
    consistency_reminder: { icon: '🔥', color: '#f97316', label: 'Reminder' },
    streak_milestone:     { icon: '🏆', color: '#eab308', label: 'Milestone' },
    showcase_star:        { icon: '⭐', color: '#facc15', label: 'Star' },
    showcase_comment:     { icon: '💬', color: '#818cf8', label: 'Comment' },
    github_no_commits:    { icon: '⚡', color: '#ef4444', label: 'Alert' },
    project_revival:      { icon: '🚀', color: '#06b6d4', label: 'Revival' },
    task_due:             { icon: '📌', color: '#f43f5e', label: 'Task Due' },
    break_reminder:       { icon: '☕', color: '#84cc16', label: 'Break' },
    system_update:        { icon: '🆕', color: '#a78bfa', label: 'Update' },
    general:              { icon: '🔔', color: '#94a3b8', label: 'Notification' },
};

// ─── Notification route map (deep-links) ─────────────────────────────────────
const TYPE_ROUTE = {
    showcase_star:     '/showcase',
    showcase_comment:  '/showcase',
    task_due:          '/roadmap',
    project_revival:   '/projects',
    streak_milestone:  '/dashboard',
    github_no_commits: '/github-insights',
};

// ─── Time formatter ───────────────────────────────────────────────────────────
function timeAgo(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
}

// ─── Individual notification row ──────────────────────────────────────────────
function NotificationItem({ notif, onRead, onDelete, onNavigate }) {
    const meta = TYPE_META[notif.type] || TYPE_META.general;

    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.15 }}
            className="group relative flex gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors rounded-xl"
            onClick={() => {
                if (!notif.read) onRead(notif.id);
                const route = TYPE_ROUTE[notif.type];
                if (route) onNavigate(route);
            }}
        >
            {/* Unread dot */}
            {!notif.read && (
                <span
                    className="absolute left-2 top-4 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                />
            )}

            {/* Icon */}
            <div
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: `${meta.color}18` }}
            >
                {meta.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p
                    className="text-sm font-medium leading-snug truncate"
                    style={{ color: notif.read ? '#94a3b8' : '#f1f5f9' }}
                >
                    {notif.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-snug">
                    {notif.body}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                        style={{ color: meta.color, background: `${meta.color}18` }}
                    >
                        {meta.label}
                    </span>
                    <span className="text-[10px] text-slate-600">{timeAgo(notif.createdAt)}</span>
                </div>
            </div>

            {/* Delete */}
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-6 h-6 rounded-lg
                           flex items-center justify-center text-slate-500 hover:text-red-400
                           hover:bg-red-500/10 transition-all self-start mt-0.5"
                title="Delete"
            >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </motion.div>
    );
}

// ─── Notification Panel (dropdown) ────────────────────────────────────────────
function NotificationPanel({ onClose, position = 'sidebar' }) {
    const navigate = useNavigate();
    const { notifications, notificationsLoading, unreadCount, markRead, markAllRead, deleteNotification } = useNotifications();

    const handleNavigate = useCallback((route) => {
        navigate(route);
        onClose();
    }, [navigate, onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, x: -12, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -12, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={position === 'settings'
                ? 'absolute right-0 top-full mt-2 z-[12000] w-[min(22rem,calc(100vw-3rem))]'
                : 'absolute left-14 top-0 z-[10100] w-80'}
        >
            <div
                className="rounded-2xl border overflow-hidden shadow-2xl"
                style={{
                    background: 'linear-gradient(145deg, #1a1b2e, #0f1021)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">Notifications</span>
                        {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/30 text-purple-300">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors font-medium"
                        >
                            Mark all read
                        </button>
                    )}
                </div>

                {/* List */}
                <div className="max-h-[420px] overflow-y-auto custom-scrollbar py-1">
                    {notificationsLoading && notifications.length === 0 ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                            <span className="text-3xl">🔔</span>
                            <p className="text-sm text-slate-500">No notifications yet</p>
                            <p className="text-xs text-slate-600">We'll let you know when something happens!</p>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {notifications.map(notif => (
                                <NotificationItem
                                    key={notif.id}
                                    notif={notif}
                                    onRead={markRead}
                                    onDelete={deleteNotification}
                                    onNavigate={handleNavigate}
                                />
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="border-t border-white/5 px-4 py-2.5">
                        <p className="text-[11px] text-slate-600 text-center">
                            Showing last {notifications.length} notifications
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── Main Bell Button ─────────────────────────────────────────────────────────
export default function NotificationBell({ position = 'sidebar', showTooltip = true }) {
    const { unreadCount } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    return (
        <div ref={containerRef} className="relative flex items-center justify-center w-12 h-12">
            {/* Bell button */}
            <motion.button
                onClick={() => setIsOpen(o => !o)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer
                           transition-all duration-200 hover:bg-white/5 relative group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Notifications"
            >
                {/* Bell icon with pulse effect */}
                <div className="relative">
                    {unreadCount > 0 && (
                        <motion.div
                            layoutId="bell-pulse"
                            className="absolute inset-0 bg-purple-500/20 rounded-full"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ 
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 0, 0.5]
                            }}
                            transition={{ 
                                duration: 2, 
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    )}
                    <svg
                        className={`w-5 h-5 transition-colors relative z-10 ${isOpen ? 'text-purple-400' : 'text-slate-400'}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round" strokeLinejoin="round"
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                    </svg>
                </div>

                {/* Unread badge */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            key="badge"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
                                       rounded-full text-[10px] font-bold flex items-center justify-center
                                       bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* Tooltip */}
                {showTooltip && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-white text-sm rounded-lg
                        opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'Notifications'}
                    </div>
                )}
            </motion.button>

            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <NotificationPanel onClose={() => setIsOpen(false)} position={position} />
                )}
            </AnimatePresence>
        </div>
    );
}
