import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { tasksApi } from '../../services/api'

// Calendar Component with Task Management
export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(null)
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' })
    const [saving, setSaving] = useState(false)
    const [notificationPermission, setNotificationPermission] = useState('default')

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Get first day of month and total days
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']

    // Get date string in YYYY-MM-DD format
    const getDateString = (y, m, d) => {
        return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission)
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    setNotificationPermission(permission)
                })
            }
        }
    }, [])

    // Check for high priority tasks due today/tomorrow and notify
    const checkHighPriorityReminders = (taskList) => {
        if (notificationPermission !== 'granted') return

        const today = new Date()
        const todayStr = getDateString(today.getFullYear(), today.getMonth(), today.getDate())
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowStr = getDateString(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())

        const urgentTasks = taskList.filter(t =>
            t.priority === 'high' &&
            !t.completed &&
            (t.dueDate === todayStr || t.dueDate === tomorrowStr)
        )

        if (urgentTasks.length > 0) {
            const dueToday = urgentTasks.filter(t => t.dueDate === todayStr)
            const dueTomorrow = urgentTasks.filter(t => t.dueDate === tomorrowStr)

            if (dueToday.length > 0) {
                new Notification('⚠️ High Priority Tasks Due Today!', {
                    body: dueToday.map(t => t.title).join(', '),
                    icon: '/devtrack-BG.png',
                    tag: 'high-priority-today'
                })
            }

            if (dueTomorrow.length > 0) {
                new Notification('📌 High Priority Tasks Due Tomorrow', {
                    body: dueTomorrow.map(t => t.title).join(', '),
                    icon: '/devtrack-BG.png',
                    tag: 'high-priority-tomorrow'
                })
            }
        }
    }

    // Fetch tasks for current month
    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true)
            try {
                const start = getDateString(year, month, 1)
                const end = getDateString(year, month, daysInMonth)
                const response = await tasksApi.getByRange(start, end)
                const fetchedTasks = response.data?.data?.tasks || []
                setTasks(fetchedTasks)

                // Check for high priority reminders
                checkHighPriorityReminders(fetchedTasks)
            } catch (err) {
                console.error('Error fetching tasks:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchTasks()
    }, [year, month, daysInMonth, notificationPermission])

    // Get tasks for a specific date
    const getTasksForDate = (dateStr) => {
        return tasks.filter(t => t.dueDate === dateStr)
    }

    // Navigate months
    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1))
    }
    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1))
    }

    // Handle date click
    const handleDateClick = (day) => {
        const dateStr = getDateString(year, month, day)
        setSelectedDate(dateStr)
    }

    // Add new task
    const handleAddTask = async () => {
        if (!newTask.title || !selectedDate) return

        setSaving(true)
        try {
            const response = await tasksApi.create({
                title: newTask.title,
                description: newTask.description,
                dueDate: selectedDate,
                priority: newTask.priority
            })

            if (response.data?.success) {
                const createdTask = response.data.data
                setTasks([...tasks, createdTask])
                setNewTask({ title: '', description: '', priority: 'medium' })
                setShowModal(false)

                // Notify if high priority task added for today/tomorrow
                if (createdTask.priority === 'high' && notificationPermission === 'granted') {
                    const today = new Date()
                    const todayStr = getDateString(today.getFullYear(), today.getMonth(), today.getDate())
                    const tomorrow = new Date(today)
                    tomorrow.setDate(tomorrow.getDate() + 1)
                    const tomorrowStr = getDateString(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())

                    if (createdTask.dueDate === todayStr || createdTask.dueDate === tomorrowStr) {
                        new Notification('🔥 High Priority Task Added!', {
                            body: `"${createdTask.title}" is due ${createdTask.dueDate === todayStr ? 'today' : 'tomorrow'}`,
                            icon: '/devtrack-BG.png'
                        })
                    }
                }
            }
        } catch (err) {
            console.error('Error creating task:', err)
        } finally {
            setSaving(false)
        }
    }

    // Toggle task completion
    const handleToggleTask = async (taskId) => {
        try {
            const response = await tasksApi.toggle(taskId)
            if (response.data?.success) {
                setTasks(tasks.map(t =>
                    t.id === taskId ? response.data.data : t
                ))
            }
        } catch (err) {
            console.error('Error toggling task:', err)
        }
    }

    // Delete task
    const handleDeleteTask = async (taskId) => {
        try {
            await tasksApi.delete(taskId)
            setTasks(tasks.filter(t => t.id !== taskId))
        } catch (err) {
            console.error('Error deleting task:', err)
        }
    }

    // Render calendar days
    const renderDays = () => {
        const days = []
        const today = new Date()
        const todayStr = getDateString(today.getFullYear(), today.getMonth(), today.getDate())

        // Empty cells for days before first day of month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="h-10" />)
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = getDateString(year, month, day)
            const dateTasks = getTasksForDate(dateStr)
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            const hasIncompleteTasks = dateTasks.some(t => !t.completed)

            days.push(
                <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`h-8 w-full rounded text-xs font-medium transition-all relative
                        ${isToday ? 'ring-1 ring-purple-500' : ''}
                        ${isSelected ? 'bg-purple-500 text-white' : 'hover:bg-white/10 text-slate-300'}
                    `}
                >
                    {day}
                    {dateTasks.length > 0 && (
                        <span className={`absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full
                            ${hasIncompleteTasks ? 'bg-orange-400' : 'bg-emerald-400'}
                        `} />
                    )}
                </button>
            )
        }

        return days
    }

    const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : []

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="h-full"
        >
            <div
                className="rounded-2xl p-4 border border-white/10 h-full"
                style={{
                    background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.95), rgba(20, 25, 40, 0.98))',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        📅 Calendar
                    </h3>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={prevMonth}
                            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors text-sm"
                        >
                            ←
                        </button>
                        <span className="text-xs font-medium text-white min-w-[100px] text-center">
                            {monthNames[month]} {year}
                        </span>
                        <button
                            onClick={nextMonth}
                            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors text-sm"
                        >
                            →
                        </button>
                    </div>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-center text-[10px] font-medium text-slate-500 py-0.5">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-0.5 mb-3">
                    {renderDays()}
                </div>

                {/* Selected date tasks */}
                {selectedDate && (
                    <div className="border-t border-white/10 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-400">
                                Tasks for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <button
                                onClick={() => setShowModal(true)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                            >
                                + Add Task
                            </button>
                        </div>

                        {selectedDateTasks.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-4">No tasks for this date</p>
                        ) : (
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {selectedDateTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className={`flex items-center gap-2 p-2 rounded-lg bg-white/5 ${task.completed ? 'opacity-60' : ''}`}
                                    >
                                        <button
                                            onClick={() => handleToggleTask(task.id)}
                                            className={`w-5 h-5 rounded flex-shrink-0 border transition-colors
                                                ${task.completed
                                                    ? 'bg-emerald-500 border-emerald-500'
                                                    : 'border-slate-600 hover:border-purple-500'
                                                }
                                            `}
                                        >
                                            {task.completed && <span className="text-white text-xs">✓</span>}
                                        </button>
                                        <span className={`text-sm flex-1 ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                                            {task.title}
                                        </span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded
                                            ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                task.priority === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                                                    'bg-slate-500/20 text-slate-400'}
                                        `}>
                                            {task.priority}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="text-slate-500 hover:text-red-400 transition-colors text-sm"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Task Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            className="w-full max-w-md rounded-2xl border border-white/10 overflow-hidden"
                            style={{
                                background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.98), rgba(20, 25, 40, 0.99))',
                                boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
                            }}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white mb-4">Add Task</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">Title *</label>
                                        <input
                                            type="text"
                                            value={newTask.title}
                                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                            placeholder="Task title..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">Description</label>
                                        <textarea
                                            value={newTask.description}
                                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white min-h-[80px] focus:border-purple-500 focus:outline-none resize-none"
                                            placeholder="Optional description..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">Priority</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['low', 'medium', 'high'].map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setNewTask({ ...newTask, priority: p })}
                                                    className={`p-2 rounded-xl border text-sm font-medium transition-all capitalize
                                                        ${newTask.priority === p
                                                            ? 'bg-purple-500/20 border-purple-500 text-white'
                                                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
                                                        }
                                                    `}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAddTask}
                                            disabled={saving || !newTask.title}
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:opacity-50"
                                        >
                                            {saving ? 'Saving...' : 'Add Task'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
