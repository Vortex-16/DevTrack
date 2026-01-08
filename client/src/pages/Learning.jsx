import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { logsApi } from '../services/api'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useCache } from '../context/CacheContext'
import PixelTransition from '../components/ui/PixelTransition'
import { motion, AnimatePresence } from 'framer-motion'
import Lenis from 'lenis'
import { ReactLenis, useLenis } from 'lenis/react'
import DatePicker from '../components/ui/DatePicker'
import TimePicker from '../components/ui/TimePicker'


import { createPortal } from 'react-dom'
import {
    BookOpen,
    Flame,
    Calendar,
    Rocket,
    ThumbsUp,
    Meh,
    Frown,
    AlertTriangle,
    Plus,
    Trash2,
    Pencil,
    Clock,
    Tag,
    Smile
} from 'lucide-react'

// Helper to format dates
const formatDate = (date) => {
    if (!date) return 'Unknown date'
    if (date._seconds !== undefined) {
        return new Date(date._seconds * 1000).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        })
    }
    if (typeof date === 'string') {
        const d = new Date(date)
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }
    if (date instanceof Date) return date.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
    })
    return String(date)
}

const getRawDate = (date) => {
    if (!date) return new Date().toISOString().split('T')[0]
    if (date._seconds !== undefined) {
        return new Date(date._seconds * 1000).toISOString().split('T')[0]
    }
    if (typeof date === 'string') return date.split('T')[0]
    if (date instanceof Date) return date.toISOString().split('T')[0]
    return new Date().toISOString().split('T')[0]
}

// Helper to format time to AM/PM
const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes}${suffix}`;
}

// Animated counter
function AnimatedCounter({ value }) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        const numValue = parseInt(value) || 0
        if (numValue === 0) { setCount(0); return }
        const step = numValue / 60
        let current = 0
        const timer = setInterval(() => {
            current += step
            if (current >= numValue) {
                setCount(numValue)
                clearInterval(timer)
            } else {
                setCount(Math.floor(current))
            }
        }, 1000 / 60)
        return () => clearInterval(timer)
    }, [value])
    return <span>{count}</span>
}

// Stat Card Component
function StatCard({ icon, label, value, color, delay = 0 }) {
    const colors = {
        purple: { border: 'border-purple-500/30', iconBg: 'from-purple-500 to-purple-600', glow: 'shadow-purple-500/20' },
        cyan: { border: 'border-cyan-500/30', iconBg: 'from-cyan-500 to-cyan-600', glow: 'shadow-cyan-500/20' },
        green: { border: 'border-emerald-500/30', iconBg: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/20' },
    }
    const c = colors[color] || colors.purple

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <div
                className={`rounded-2xl p-3 md:p-4 border ${c.border} backdrop-blur-sm h-full`}
                style={{
                    background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.9), rgba(20, 25, 40, 0.95))',
                }}
            >
                <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center text-lg shadow-lg ${c.glow} flex-shrink-0`}>
                        {icon}
                    </div>
                    <div className="min-w-0 flex flex-col justify-center min-h-[2.5rem]">
                        <p className="text-xl font-bold text-white leading-none mb-1">
                            <AnimatedCounter value={value} />
                        </p>
                        <p className="text-slate-400 text-xs leading-tight line-clamp-2">{label}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// Entry Card Component
function EntryCard({ entry, onEdit, onDelete, delay = 0 }) {
    const MoodIcon = {
        great: Rocket,
        good: ThumbsUp,
        okay: Meh,
        tired: Frown
    }
    const moodColors = {
        great: 'from-emerald-500 to-emerald-600',
        good: 'from-blue-500 to-blue-600',
        okay: 'from-orange-500 to-orange-600',
        tired: 'from-slate-500 to-slate-600'
    }

    const Icon = MoodIcon[entry.mood] || ThumbsUp;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="group h-full"
        >
            <div
                className="rounded-2xl p-5 border border-white/10 hover:border-purple-500/30 transition-all duration-300 h-full flex flex-col"
                style={{
                    background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.9), rgba(20, 25, 40, 0.95))',
                }}
            >
                <div className="flex items-start gap-4 flex-1">
                    {/* Date badge */}
                    <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${moodColors[entry.mood] || moodColors.good} flex flex-col items-center justify-center shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col h-full">

                        <div className="flex flex-row items-center justify-between gap-2 lg:gap-5 mb-2">
                            <h3 className="text-xs lg:text-sm font-bold text-white leading-tight whitespace-nowrap min-w-0 truncate">{formatDate(entry.date)}</h3>
                            <span className="bg-white/10 backdrop-blur-md border border-white/10 px-2 py-1 rounded-xl text-slate-400 text-[10px] lg:text-xs hidden sm:flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                                <Clock size={12} />
                                {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                            </span>
                        </div>
                        <p className="text-slate-300 text-sm mb-3 flex-1 truncate">{entry.learnedToday}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mt-auto">
                            {(entry.tags || []).map((tag, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-400 text-[10px] font-medium flex items-center gap-1"
                                >
                                    <Tag size={10} />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 md:flex-col lg:flex-row opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(entry)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => onDelete(entry.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
    const lenis = useLenis()

    useEffect(() => {
        if (isOpen) {
            lenis?.stop()
            document.body.style.overflow = 'hidden'
        } else {
            lenis?.start()
            document.body.style.overflow = 'unset'
        }
        return () => {
            lenis?.start()
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, lenis])

    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh]"
                    style={{
                        background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.98), rgba(20, 25, 40, 0.99))',
                        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
                    }}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center p-6 border-b border-white/10 flex-shrink-0">
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <ReactLenis root={false} className="p-6 overflow-y-auto flex-1 min-h-0">
                        {children}
                    </ReactLenis>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    )
}

export default function Learning() {
    const { isLoaded, isSignedIn, getToken } = useAuth()
    const { getCachedData, setCachedData, hasCachedData } = useCache()

    // Initialize from cache
    const cachedData = getCachedData('learning_data') || {}

    const [learningEntries, setLearningEntries] = useState(cachedData.entries || [])
    const [stats, setStats] = useState(cachedData.stats || { totalLogs: 0, currentStreak: 0, uniqueDays: 0 })

    const [loading, setLoading] = useState(!hasCachedData('learning_data'))
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [editingEntry, setEditingEntry] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const defaultFormData = {
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        learnedToday: '',
        tags: '',
        mood: 'good'
    }

    const [formData, setFormData] = useState(defaultFormData)

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchData()
        }
    }, [isLoaded, isSignedIn])

    const fetchData = async () => {
        try {
            if (!hasCachedData('learning_data')) {
                setLoading(true)
            } else {
                setIsRefreshing(true)
            }

            const token = await getToken({ skipCache: true })
            if (!token) {
                setLoading(false)
                setIsRefreshing(false)
                return
            }

            const [logsRes, statsRes] = await Promise.all([
                logsApi.getAll(
                    { limit: 50 },
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
                logsApi.getStats({
                    headers: { Authorization: `Bearer ${token}` }
                })
            ])

            const newEntries = logsRes.data.data.logs || []
            const newStats = statsRes.data.data || { totalLogs: 0, currentStreak: 0, uniqueDays: 0 }

            setLearningEntries(newEntries)
            setStats(newStats)

            // Cache data
            setCachedData('learning_data', {
                entries: newEntries,
                stats: newStats
            })
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }

    const resetForm = () => {
        setFormData(defaultFormData)
        setEditingEntry(null)
    }

    const openAddModal = () => {
        resetForm()
        setShowModal(true)
    }

    const openEditModal = (entry) => {
        setEditingEntry(entry)
        setFormData({
            date: getRawDate(entry.date),
            startTime: entry.startTime || '09:00',
            endTime: entry.endTime || '10:00',
            learnedToday: entry.learnedToday || '',
            tags: (entry.tags || []).join(', '),
            mood: entry.mood || 'good'
        })
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        resetForm()
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t)
            const payload = { ...formData, tags: tagsArray }

            // Close modal immediately for fast UX
            closeModal()

            if (editingEntry) {
                // For edits, update then refresh
                await logsApi.update(editingEntry.id, payload)
                fetchData()
            } else {
                // For new entries: optimistic UI
                const response = await logsApi.create(payload)
                const newEntry = response.data?.data

                if (newEntry) {
                    // Add to state immediately (prepend to show at top)
                    setLearningEntries(prev => [newEntry, ...prev])

                    // Update stats optimistically
                    setStats(prev => ({
                        ...prev,
                        totalLogs: (prev.totalLogs || 0) + 1,
                        uniqueDays: prev.uniqueDays + 1 // May not be accurate but close enough
                    }))

                    // Update cache
                    setCachedData('learning_data', {
                        entries: [newEntry, ...learningEntries],
                        stats: {
                            ...stats,
                            totalLogs: (stats.totalLogs || 0) + 1
                        }
                    })
                }
            }
        } catch (err) {
            console.error('Error saving log:', err)
            alert(`Failed to ${editingEntry ? 'update' : 'create'} log entry`)
        }
    }

    const handleDelete = async (id) => {
        try {
            await logsApi.delete(id)
            setDeleteConfirm(null)
            fetchData()
        } catch (err) {
            console.error('Error deleting log:', err)
            alert('Failed to delete log entry')
        }
    }

    const learningContainerRef = useRef(null);
    const learningContentRef = useRef(null);
    const lenisRef = useRef(null);

    // Initialize Lenis for smooth scrolling
    useEffect(() => {
        if (!learningContainerRef.current || !learningContentRef.current) return;

        const lenis = new Lenis({
            wrapper: learningContainerRef.current,
            content: learningContentRef.current,
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });

        lenisRef.current = lenis;

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        const rafId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(rafId);
            lenis.destroy();
        };
    }, [learningEntries]);

    return (
        <PixelTransition loading={loading}>
            <motion.div>
                {/* Main Container - Background removed */}
                <div
                    className="px-4 md:px-6 py-0 flex flex-col h-[calc(100vh-4rem)] overflow-hidden overflow-x-hidden"
                >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 flex-shrink-0">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">Learning Tracker</h1>
                            <p className="text-slate-400 text-sm">Track your courses, tutorials, and skills</p>
                        </div>
                        <Button onClick={openAddModal} className="flex items-center gap-2 text-xs lg:text-sm h-8 lg:h-10 px-3 lg:px-4">
                            <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                            Add Entry
                        </Button>
                    </div>

                    {/* Stats Row */}
                    <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 mb-4 flex-shrink-0">
                        <div className="flex-shrink-0 w-48 sm:w-56 md:w-auto">
                            <StatCard icon={<BookOpen size={20} />} label="Total Entries" value={stats.totalLogs || 0} color="purple" delay={0.1} />
                        </div>
                        <div className="flex-shrink-0 w-48 sm:w-56 md:w-auto">
                            <StatCard icon={<Flame size={20} />} label="Current Streak" value={stats.currentStreak || 0} color="cyan" delay={0.15} />
                        </div>
                        <div className="flex-shrink-0 w-48 sm:w-56 md:w-auto">
                            <StatCard icon={<Calendar size={20} />} label="Unique Days" value={stats.uniqueDays || 0} color="green" delay={0.2} />
                        </div>
                    </div>

                    {/* Scrollable Content Area */}
                    <div
                        ref={learningContainerRef}
                        id="learning-scroll-container"
                        className="flex-1 overflow-y-auto min-h-0 pr-6 -mr-6 relative"
                    >
                        <div ref={learningContentRef} className="pb-4">
                            {/* Error State */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-xl p-4 bg-red-500/10 border border-red-500/30 mb-6"
                                >
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="text-red-400" size={20} />
                                        <p className="text-red-400 flex-1">Error: {error}</p>
                                        <Button variant="ghost" onClick={fetchData} className="text-sm">Retry</Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Empty State */}
                            {!loading && learningEntries.length === 0 && !error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-20 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02]"
                                >
                                    <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
                                        <BookOpen size={40} className="text-purple-500" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">No Learning Entries Yet</h3>
                                    <p className="text-slate-400 mb-8 max-w-sm mx-auto">Start tracking your learning journey, skills, and progress today!</p>
                                    <Button onClick={openAddModal} className="px-8">Add Your First Entry</Button>
                                </motion.div>
                            )}

                            {/* Entries List */}
                            {learningEntries.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-white">Recent Entries</h2>
                                        <span className="text-slate-500 text-sm">{learningEntries.length} entries</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
                                        {learningEntries.map((entry, idx) => (
                                            <EntryCard
                                                key={entry.id}
                                                entry={entry}
                                                onEdit={openEditModal}
                                                onDelete={(id) => setDeleteConfirm(id)}
                                                delay={0.1 + idx * 0.05}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={!!deleteConfirm}
                    onClose={() => setDeleteConfirm(null)}
                    title="Delete Entry?"
                >
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={40} className="text-red-500" />
                        </div>
                        <p className="text-white text-lg font-semibold mb-2">Are you sure?</p>
                        <p className="text-slate-400 mb-6">This action cannot be undone and will permanently remove this learning entry.</p>
                        <div className="flex gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 border border-white/10"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Add/Edit Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={closeModal}
                    title={editingEntry ? 'Edit Learning Entry' : 'Add Learning Entry'}
                >
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Date */}
                        <div>
                            <DatePicker
                                label="Date"
                                value={formData.date}
                                onChange={(date) => setFormData({ ...formData, date })}
                            />
                        </div>

                        {/* Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <TimePicker
                                    label="Start Time"
                                    value={formData.startTime}
                                    onChange={(time) => setFormData({ ...formData, startTime: time })}
                                />
                            </div>
                            <div>
                                <TimePicker
                                    label="End Time"
                                    value={formData.endTime}
                                    onChange={(time) => setFormData({ ...formData, endTime: time })}
                                    minTime={formData.startTime}
                                />
                            </div>
                        </div>

                        {/* What learned */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">What did you learn today?</label>
                            <textarea
                                value={formData.learnedToday}
                                onChange={(e) => setFormData({ ...formData, learnedToday: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white min-h-[120px] focus:border-purple-500 focus:outline-none transition-colors resize-none"
                                placeholder="Describe what you learned..."
                                required
                            />
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Tags (comma separated)</label>
                            <input
                                type="text"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                                placeholder="React, JavaScript, CSS"
                            />
                        </div>

                        {/* Mood */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                                <Smile size={14} />
                                How was your learning session?
                            </label>
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { value: 'great', icon: Rocket, label: 'Great' },
                                    { value: 'good', icon: ThumbsUp, label: 'Good' },
                                    { value: 'okay', icon: Meh, label: 'Okay' },
                                    { value: 'tired', icon: Frown, label: 'Tired' },
                                ].map((mood) => {
                                    const MoodIcon = mood.icon;
                                    return (
                                        <button
                                            key={mood.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, mood: mood.value })}
                                            className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${formData.mood === mood.value
                                                ? 'bg-purple-500/20 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                                                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
                                                }`}
                                        >
                                            <MoodIcon size={24} />
                                            <div className="text-xs font-medium">{mood.label}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-4 pt-2">
                            <Button type="button" variant="ghost" onClick={closeModal} className="flex-1 border border-white/10">
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1">
                                {editingEntry ? 'Update Entry' : 'Save Entry'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </motion.div>
        </PixelTransition>
    );
}
