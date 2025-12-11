import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { logsApi } from '../services/api'
import { useState, useEffect } from 'react'

// Helper to format dates - handles both strings and Firestore Timestamps
const formatDate = (date) => {
    if (!date) return 'Unknown date'
    // If it's a Firestore Timestamp object
    if (date._seconds !== undefined) {
        return new Date(date._seconds * 1000).toLocaleDateString()
    }
    // If it's already a string or Date
    if (typeof date === 'string') return date
    if (date instanceof Date) return date.toLocaleDateString()
    return String(date)
}

// Helper to get raw date string for form inputs
const getRawDate = (date) => {
    if (!date) return new Date().toISOString().split('T')[0]
    if (date._seconds !== undefined) {
        return new Date(date._seconds * 1000).toISOString().split('T')[0]
    }
    if (typeof date === 'string') return date.split('T')[0]
    if (date instanceof Date) return date.toISOString().split('T')[0]
    return new Date().toISOString().split('T')[0]
}

export default function Learning() {
    const [learningEntries, setLearningEntries] = useState([])
    const [loading, setLoading] = useState(true)
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

    // Form state
    const [formData, setFormData] = useState(defaultFormData)

    useEffect(() => {
        fetchLogs()
        fetchStats()
    }, [])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            const response = await logsApi.getAll({ limit: 50 })
            setLearningEntries(response.data.data.logs || [])
        } catch (err) {
            setError(err.message)
            console.error('Error fetching logs:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await logsApi.getStats()
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
            const payload = {
                ...formData,
                tags: tagsArray
            }

            if (editingEntry) {
                // Update existing entry
                await logsApi.update(editingEntry.id, payload)
            } else {
                // Create new entry
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
                <div className="text-slate-400">Loading...</div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-gradient mb-2">Learning Tracker</h1>
                    <p className="text-slate-400">Track your courses, tutorials, and skills</p>
                </div>
                <Button onClick={openAddModal}>+ Add Learning Entry</Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <div className="text-slate-400 text-sm">Total Entries</div>
                    <div className="text-3xl font-bold mt-2">{stats.totalLogs || 0}</div>
                </Card>
                <Card>
                    <div className="text-slate-400 text-sm">Current Streak</div>
                    <div className="text-3xl font-bold mt-2">{stats.currentStreak || 0} days</div>
                </Card>
                <Card>
                    <div className="text-slate-400 text-sm">Unique Days</div>
                    <div className="text-3xl font-bold mt-2">{stats.uniqueDays || 0}</div>
                </Card>
            </div>

            {/* Error State */}
            {error && (
                <Card className="border-red-500/50 bg-red-500/10">
                    <p className="text-red-400">Error: {error}</p>
                    <Button variant="ghost" onClick={fetchLogs} className="mt-2">Retry</Button>
                </Card>
            )}

            {/* Empty State */}
            {!loading && learningEntries.length === 0 && !error && (
                <Card className="text-center py-12">
                    <div className="text-4xl mb-4">📚</div>
                    <h3 className="text-xl font-semibold mb-2">No Learning Entries Yet</h3>
                    <p className="text-slate-400 mb-4">Start tracking your learning journey!</p>
                    <Button onClick={openAddModal}>Add Your First Entry</Button>
                </Card>
            )}

            {/* Learning Entries */}
            <div className="space-y-4">
                {learningEntries.map((entry) => (
                    <Card key={entry.id} hover>
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-semibold">{formatDate(entry.date)}</h3>
                                    <Badge variant={entry.mood === 'good' ? 'success' : entry.mood === 'great' ? 'primary' : 'warning'}>
                                        {entry.mood}
                                    </Badge>
                                </div>
                                <p className="text-slate-400 text-sm mb-3">
                                    {entry.startTime} - {entry.endTime}
                                </p>
                                <p className="text-slate-200 mb-3">{entry.learnedToday}</p>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2">
                                    {(entry.tags || []).map((tag, i) => (
                                        <Badge key={i} variant="default">{tag}</Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 md:flex-col">
                                <Button
                                    variant="ghost"
                                    onClick={() => openEditModal(entry)}
                                    className="text-sm px-3 py-1"
                                >
                                    ✏️ Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setDeleteConfirm(entry.id)}
                                    className="text-sm px-3 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                    🗑️ Delete
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <div className="text-center">
                            <div className="text-4xl mb-4">⚠️</div>
                            <h2 className="text-xl font-bold mb-2">Delete Entry?</h2>
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
                    </Card>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <Card className="w-full max-w-lg mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">
                                {editingEntry ? 'Edit Learning Entry' : 'Add Learning Entry'}
                            </h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Start Time</label>
                                    <input
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">End Time</label>
                                    <input
                                        type="time"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">What did you learn today?</label>
                                <textarea
                                    value={formData.learnedToday}
                                    onChange={(e) => setFormData({ ...formData, learnedToday: e.target.value })}
                                    className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2 min-h-[100px]"
                                    placeholder="Describe what you learned..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Tags (comma separated)</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2"
                                    placeholder="React, JavaScript, CSS"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Mood</label>
                                <select
                                    value={formData.mood}
                                    onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                                    className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2"
                                >
                                    <option value="great">Great 🚀</option>
                                    <option value="good">Good 👍</option>
                                    <option value="okay">Okay 😐</option>
                                    <option value="tired">Tired 😓</option>
                                </select>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="ghost" onClick={closeModal} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1">
                                    {editingEntry ? 'Update Entry' : 'Save Entry'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    )
}
