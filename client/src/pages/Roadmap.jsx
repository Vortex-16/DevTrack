import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@clerk/clerk-react'
import { goalsApi } from '../services/api'
import PixelTransition from '../components/ui/PixelTransition'
import Button from '../components/ui/Button'
import { Plus, Target, Calendar, CheckCircle, Clock, Trash2, Edit2, AlertTriangle, ChevronRight, Check } from 'lucide-react'
import { createPortal } from 'react-dom'
import DatePicker from '../components/ui/DatePicker'

// Format date helper
const formatDate = (dateString, includeYear = false) => {
    if (!dateString) return 'No Date'
    const date = new Date(dateString)
    // Check if valid date
    if (isNaN(date.getTime())) return 'Invalid Date'

    // Check if it's a Firestore timestamp (seconds)
    if (typeof dateString === 'object' && dateString._seconds) {
        return new Date(dateString._seconds * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: includeYear ? 'numeric' : undefined
        })
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: includeYear ? 'numeric' : undefined
    })
}

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10001] p-4"
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
                    <div className="p-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar" data-lenis-prevent>
                        {children}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    )
}

function GoalCard({ goal, onEdit, onDelete, onUpdate }) {
    const progress = goal.progress || 0
    // Safely verify milestones exists and is an array
    const milestones = Array.isArray(goal.milestones) ? goal.milestones : []
    const nextMilestone = milestones.find(m => !m.isCompleted)

    // Calculate days remaining
    const getDaysRemaining = () => {
        if (!goal.targetDate) return null
        const target = new Date(goal.targetDate._seconds ? goal.targetDate._seconds * 1000 : goal.targetDate)
        const now = new Date()
        const diffTime = target - now
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    const daysRemaining = getDaysRemaining()
    const isOverdue = daysRemaining !== null && daysRemaining < 0 && goal.status !== 'Completed'

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative rounded-2xl p-5 border border-white/10 hover:border-purple-500/30 transition-all duration-300 bg-white/5 hover:bg-white/[0.07]"
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider
                            ${goal.category === 'Career' ? 'bg-blue-500/20 text-blue-400' :
                                goal.category === 'Learning' ? 'bg-purple-500/20 text-purple-400' :
                                    goal.category === 'Project' ? 'bg-emerald-500/20 text-emerald-400' :
                                        'bg-slate-500/20 text-slate-400'}`}>
                            {goal.category}
                        </span>
                        {isOverdue && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                                <AlertTriangle size={10} /> Overdue
                            </span>
                        )}
                    </div>
                    <h3 className="text-lg font-bold text-white leading-tight">{goal.title}</h3>
                </div>

                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(goal)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <Edit2 size={14} />
                    </button>
                    <button onClick={() => onDelete(goal.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <p className="text-slate-400 text-sm mb-4 line-clamp-2">{goal.description}</p>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">Progress</span>
                    <span className="text-white font-bold">{progress}%</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' :
                            progress > 50 ? 'bg-purple-500' : 'bg-blue-500'
                            }`}
                    />
                </div>
            </div>

            {/* Next Milestone or Completed Status */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs text-slate-400 truncate max-w-[65%]">
                    {progress === 100 ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                            <CheckCircle size={14} /> Goal Completed!
                        </span>
                    ) : nextMilestone ? (
                        <span className="flex items-center gap-1.5 truncate">
                            <Target size={14} className="text-purple-400 flex-shrink-0" />
                            <span className="truncate">Next: {nextMilestone.title}</span>
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-slate-500">
                            <Target size={14} /> No active milestones
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium whitespace-nowrap">
                    <Clock size={12} />
                    {daysRemaining !== null ? (
                        daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining} days left`
                    ) : 'No deadline'}
                </div>
            </div>
        </motion.div>
    )
}

export default function Roadmap() {
    const { isLoaded, isSignedIn } = useAuth()
    const [loading, setLoading] = useState(true)
    const [goals, setGoals] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [editingGoal, setEditingGoal] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [error, setError] = useState(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    // Form State
    const defaultForm = {
        title: '',
        description: '',
        category: 'Personal',
        startDate: new Date().toISOString().split('T')[0],
        targetDate: '',
        milestones: []
    }
    const [formData, setFormData] = useState(defaultForm)
    const [newMilestone, setNewMilestone] = useState('')

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchGoals()
        }
    }, [isLoaded, isSignedIn, refreshTrigger])

    const fetchGoals = async () => {
        try {
            // Keep loading true on initial load
            if (goals.length === 0) setLoading(true)
            const res = await goalsApi.getAll()
            setGoals(res.data?.data?.goals || [])
        } catch (err) {
            console.error('Failed to fetch goals:', err)
            setError('Could not load your roadmap.')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (goal = null) => {
        if (goal) {
            setEditingGoal(goal)
            setFormData({
                title: goal.title,
                description: goal.description,
                category: goal.category,
                startDate: goal.startDate ? (goal.startDate._seconds ? new Date(goal.startDate._seconds * 1000).toISOString().split('T')[0] : goal.startDate.split('T')[0]) : '',
                targetDate: goal.targetDate ? (goal.targetDate._seconds ? new Date(goal.targetDate._seconds * 1000).toISOString().split('T')[0] : goal.targetDate.split('T')[0]) : '',
                milestones: Array.isArray(goal.milestones) ? goal.milestones : []
            })
        } else {
            setEditingGoal(null)
            setFormData(defaultForm)
        }
        setShowModal(true)
    }

    const handleAddMilestone = () => {
        if (!newMilestone.trim()) return
        setFormData(prev => ({
            ...prev,
            milestones: [
                ...prev.milestones,
                { id: crypto.randomUUID(), title: newMilestone.trim(), isCompleted: false }
            ]
        }))
        setNewMilestone('')
    }

    const removeMilestone = (id) => {
        setFormData(prev => ({
            ...prev,
            milestones: prev.milestones.filter(m => m.id !== id)
        }))
    }

    const toggleMilestoneInForm = (id) => {
        setFormData(prev => ({
            ...prev,
            milestones: prev.milestones.map(m =>
                m.id === id ? { ...m, isCompleted: !m.isCompleted } : m
            )
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingGoal) {
                await goalsApi.update(editingGoal.id, formData)
            } else {
                await goalsApi.create(formData)
            }
            setShowModal(false)
            setRefreshTrigger(prev => prev + 1)
        } catch (err) {
            console.error('Error saving goal:', err)
            alert('Failed to save goal')
        }
    }

    const handleDelete = async (id) => {
        try {
            await goalsApi.delete(id)
            setDeleteConfirm(null)
            setRefreshTrigger(prev => prev + 1)
        } catch (err) {
            console.error('Error deleting goal:', err)
            alert('Failed to delete goal')
        }
    }

    return (
        <PixelTransition loading={loading}>
            <div className="px-4 md:px-0">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Roadmap</h1>
                        <p className="text-slate-400">Set goals, track milestones, and visualize your developer journey.</p>
                    </div>
                    <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                        <Plus className="w-5 h-5" /> New Goal
                    </Button>
                </div>

                {/* Goals Grid */}
                {!loading && goals.length === 0 ? (
                    <div className="text-center py-20 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02]">
                        <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
                            <Target size={40} className="text-purple-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No Goals Set Yet</h3>
                        <p className="text-slate-400 mb-8 max-w-sm mx-auto">Define what you want to achieve next. A clear roadmap is the key to success!</p>
                        <Button onClick={() => handleOpenModal()}>Set Your First Goal</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {goals.map(goal => (
                            <GoalCard
                                key={goal.id}
                                goal={goal}
                                onEdit={handleOpenModal}
                                onDelete={(id) => setDeleteConfirm(id)}
                            />
                        ))}
                    </div>
                )}

                {/* Modals */}
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title={editingGoal ? "Edit Goal" : "Create New Goal"}
                >
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm text-slate-400 mb-2">Goal Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                                    placeholder="e.g. Master React Performance"
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm text-slate-400 mb-2">Category</label>
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                    {['Personal', 'Career', 'Learning', 'Project'].map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, category: cat })}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                                                ${formData.category === cat
                                                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm text-slate-400 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white min-h-[100px] focus:border-purple-500 focus:outline-none transition-colors resize-none"
                                    placeholder="Briefly describe what you want to achieve..."
                                />
                            </div>
                            <div>
                                <DatePicker
                                    label="Start Date"
                                    value={formData.startDate}
                                    onChange={val => setFormData({ ...formData, startDate: val })}
                                />
                            </div>
                            <div>
                                <DatePicker
                                    label="Target Date"
                                    value={formData.targetDate}
                                    onChange={val => setFormData({ ...formData, targetDate: val })}
                                    minDate={formData.startDate || new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>

                        {/* Milestones Section */}
                        <div className="border-t border-white/10 pt-4">
                            <label className="block text-sm text-slate-400 mb-3">Key Milestones</label>

                            <div className="space-y-2 mb-3">
                                {formData.milestones.length === 0 && (
                                    <p className="text-xs text-slate-500 italic">No milestones added yet.</p>
                                )}
                                {formData.milestones.map((m, idx) => (
                                    <div key={m.id} className="flex items-center gap-3 group bg-white/5 p-2 rounded-lg border border-white/5 hover:border-white/10">
                                        <button
                                            type="button"
                                            onClick={() => toggleMilestoneInForm(m.id)}
                                            className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors
                                                ${m.isCompleted ? 'bg-purple-500 border-purple-500 text-white' : 'border-slate-500 text-transparent hover:border-purple-400'}`}
                                        >
                                            <Check size={12} strokeWidth={3} />
                                        </button>
                                        <span className={`flex-1 text-sm ${m.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                            {m.title}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeMilestone(m.id)}
                                            className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMilestone}
                                    onChange={e => setNewMilestone(e.target.value)}
                                    // Submit milestone on Enter (prevent form submit)
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddMilestone();
                                        }
                                    }}
                                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                                    placeholder="Add a milestone step..."
                                />
                                <button
                                    type="button"
                                    onClick={handleAddMilestone}
                                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1">
                                {editingGoal ? 'Update Goal' : 'Create Goal'}
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Delete Confirmation */}
                <Modal
                    isOpen={!!deleteConfirm}
                    onClose={() => setDeleteConfirm(null)}
                    title="Delete Goal?"
                >
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} className="text-red-500" />
                        </div>
                        <p className="text-white text-lg font-semibold mb-2">Are you sure?</p>
                        <p className="text-slate-400 mb-6">This will permanently remove this goal and all its progress.</p>
                        <div className="flex gap-4">
                            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700">
                                Delete It
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </PixelTransition>
    )
}
