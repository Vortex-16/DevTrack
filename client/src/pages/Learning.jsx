import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { logsApi } from '../services/api'
import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import ProfessionalLoader from '../components/ui/ProfessionalLoader'
import { useCache } from '../context/CacheContext'
import { motion, AnimatePresence } from 'framer-motion'

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
                className={`rounded-2xl p-5 border ${c.border} backdrop-blur-sm h-full`}
                style={{
                    background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.9), rgba(20, 25, 40, 0.95))',
                }}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center text-xl shadow-lg ${c.glow}`}>
                        {icon}
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">
                            <AnimatedCounter value={value} />
                        </p>
                        <p className="text-slate-400 text-sm">{label}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// Entry Card Component
function EntryCard({ entry, onEdit, onDelete, delay = 0 }) {
    const moodEmojis = {
        great: '🚀',
        good: '👍',
        okay: '😐',
        tired: '😓'
    }
    const moodColors = {
        great: 'from-emerald-500 to-emerald-600',
        good: 'from-blue-500 to-blue-600',
        okay: 'from-orange-500 to-orange-600',
        tired: 'from-slate-500 to-slate-600'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="group"
        >
            <div
                className="rounded-2xl p-5 border border-white/10 hover:border-purple-500/30 transition-all duration-300"
                style={{
                    background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.9), rgba(20, 25, 40, 0.95))',
                }}
            >
                <div className="flex items-start gap-4">
                    {/* Date badge */}
                    <div className="flex-shrink-0">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${moodColors[entry.mood] || moodColors.good} flex flex-col items-center justify-center shadow-lg`}>
                            <span className="text-lg">{moodEmojis[entry.mood] || '👍'}</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{formatDate(entry.date)}</h3>
                            <span className="text-slate-500 text-sm">
                                {entry.startTime} - {entry.endTime}
                            </span>
                        </div>
                        <p className="text-slate-300 mb-3 line-clamp-2">{entry.learnedToday}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                            {(entry.tags || []).map((tag, i) => (
                                <span
                                    key={i}
                                    className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-medium"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(entry)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onDelete(entry.id)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden"
                    style={{
                        background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.98), rgba(20, 25, 40, 0.99))',
                        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
                    }}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center p-6 border-b border-white/10">
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
                    <div className="p-6">
                        {children}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

export default function Learning() {
    const { isLoaded, isSignedIn, getToken } = useAuth()
    const { hasCachedData, setCachedData } = useCache()
    const [learningEntries, setLearningEntries] = useState([])
    const [loading, setLoading] = useState(!hasCachedData('learning'))
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [editingEntry, setEditingEntry] = useState(null)
    const [stats, setStats] = useState({ totalLogs: 0, currentStreak: 0, uniqueDays: 0 })
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
            fetchLogs()
            fetchStats()
        }
    }, [isLoaded, isSignedIn])

    const fetchLogs = async () => {
        try {
            if (!hasCachedData('learning')) setLoading(true)
            const token = await getToken({ skipCache: true })
            if (!token) {
                setLoading(false)
                return
            }
            const response = await logsApi.getAll(
                { limit: 50 },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setLearningEntries(response.data.data.logs || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
            if (!error) setCachedData('learning', true)
        }
    }

    const fetchStats = async () => {
        try {
            const token = await getToken({ skipCache: true })
            if (!token) return
            const response = await logsApi.getStats({
                headers: { Authorization: `Bearer ${token}` }
            })
            setStats(response.data.data || {})
        } catch (err) {
            console.error('Error fetching stats:', err)
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

            if (editingEntry) {
                await logsApi.update(editingEntry.id, payload)
            } else {
                await logsApi.create(payload)
            }

            closeModal()
            fetchLogs()
            fetchStats()
        } catch (err) {
            console.error('Error saving log:', err)
            alert(`Failed to ${editingEntry ? 'update' : 'create'} log entry`)
        }
    }

    const handleDelete = async (id) => {
        try {
            await logsApi.delete(id)
            setDeleteConfirm(null)
            fetchLogs()
            fetchStats()
        } catch (err) {
            console.error('Error deleting log:', err)
            alert('Failed to delete log entry')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <ProfessionalLoader size="lg" />
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Main Container */}
            <div
                className="rounded-[2rem] p-6 lg:p-8 border border-white/10"
                style={{
                    background: 'linear-gradient(145deg, rgba(15, 20, 35, 0.8), rgba(10, 15, 25, 0.9))',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                }}
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">Learning Tracker</h1>
                        <p className="text-slate-400 text-sm">Track your courses, tutorials, and skills</p>
                    </div>
                    <Button onClick={openAddModal} className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Entry
                    </Button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <StatCard icon="📚" label="Total Entries" value={stats.totalLogs || 0} color="purple" delay={0.1} />
                    <StatCard icon="🔥" label="Current Streak" value={stats.currentStreak || 0} color="cyan" delay={0.15} />
                    <StatCard icon="📅" label="Unique Days" value={stats.uniqueDays || 0} color="green" delay={0.2} />
                </div>

                {/* Error State */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl p-4 bg-red-500/10 border border-red-500/30 mb-6"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-red-400">⚠️</span>
                            <p className="text-red-400 flex-1">Error: {error}</p>
                            <Button variant="ghost" onClick={fetchLogs} className="text-sm">Retry</Button>
                        </div>
                    </motion.div>
                )}

                {/* Empty State */}
                {!loading && learningEntries.length === 0 && !error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16 rounded-2xl border-2 border-dashed border-purple-500/30"
                    >
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold text-white mb-2">No Learning Entries Yet</h3>
                        <p className="text-slate-400 mb-6">Start tracking your learning journey!</p>
                        <Button onClick={openAddModal}>Add Your First Entry</Button>
                    </motion.div>
                )}

                {/* Entries List */}
                {learningEntries.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white">Recent Entries</h2>
                            <span className="text-slate-500 text-sm">{learningEntries.length} entries</span>
                        </div>
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
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Entry?"
            >
                <div className="text-center">
                    <div className="text-5xl mb-4">⚠️</div>
                    <p className="text-slate-400 mb-6">This action cannot be undone.</p>
                    <div className="flex gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteConfirm(null)}
                            className="flex-1"
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
                        <label className="block text-sm text-slate-400 mb-2">Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                            required
                        />
                    </div>

                    {/* Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Start Time</label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">End Time</label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                                required
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
                        <label className="block text-sm text-slate-400 mb-2">Mood</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { value: 'great', emoji: '🚀', label: 'Great' },
                                { value: 'good', emoji: '👍', label: 'Good' },
                                { value: 'okay', emoji: '😐', label: 'Okay' },
                                { value: 'tired', emoji: '😓', label: 'Tired' },
                            ].map((mood) => (
                                <button
                                    key={mood.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, mood: mood.value })}
                                    className={`p-3 rounded-xl border transition-all ${formData.mood === mood.value
                                            ? 'bg-purple-500/20 border-purple-500 text-white'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
                                        }`}
                                >
                                    <div className="text-xl mb-1">{mood.emoji}</div>
                                    <div className="text-xs">{mood.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4 pt-2">
                        <Button type="button" variant="ghost" onClick={closeModal} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            {editingEntry ? 'Update Entry' : 'Save Entry'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </motion.div>
    )
}
