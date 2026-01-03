import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

export default function DatePicker({ value, onChange, label }) {
    const [isOpen, setIsOpen] = useState(false)
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date())
    const containerRef = useRef(null)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Update view date when value changes (if not open)
    useEffect(() => {
        if (value && !isOpen) {
            setViewDate(new Date(value))
        }
    }, [value, isOpen])

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const handleDateClick = (day) => {
        const newDate = new Date(year, month, day)
        // Format as YYYY-MM-DD local time to avoid timezone shifts
        const yearStr = newDate.getFullYear()
        const monthStr = String(newDate.getMonth() + 1).padStart(2, '0')
        const dayStr = String(newDate.getDate()).padStart(2, '0')
        const dateString = `${yearStr}-${monthStr}-${dayStr}`
        
        onChange(dateString)
        setIsOpen(false)
    }

    const nextMonth = () => setViewDate(new Date(year, month + 1, 1))
    const prevMonth = () => setViewDate(new Date(year, month - 1, 1))

    const renderDays = () => {
        const days = []
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="h-8" />)
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

        for (let day = 1; day <= daysInMonth; day++) {
             // Construct current cell date string for comparison
            const cellDate = new Date(year, month, day)
            const cellYear = cellDate.getFullYear()
            const cellMonth = String(cellDate.getMonth() + 1).padStart(2, '0')
            const cellDay = String(cellDate.getDate()).padStart(2, '0')
            const cellDateStr = `${cellYear}-${cellMonth}-${cellDay}`

            const isFuture = cellDate > today

            const isSelected = value === cellDateStr
            const isToday = cellDateStr === todayStr

            days.push(
                <button
                    key={day}
                    onClick={() => !isFuture && handleDateClick(day)}
                    disabled={isFuture}
                    type="button"
                    className={`h-8 w-8 rounded-full text-xs font-medium transition-all relative flex items-center justify-center
                        ${isSelected
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                            : isToday
                                ? 'bg-white/10 text-white border border-purple-500/50'
                                : isFuture 
                                    ? 'text-slate-700 cursor-not-allowed opacity-30'
                                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }
                    `}
                >
                    {day}
                </button>
            )
        }
        return days
    }

    return (
        <div ref={containerRef} className="relative">
            {label && <label className="block text-sm text-slate-400 mb-2">{label}</label>}
            
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white flex items-center justify-between transition-colors
                    ${isOpen ? 'border-purple-500 ring-1 ring-purple-500/20' : 'border-white/10 hover:border-white/20'}`}
            >
                <span className={value ? "text-white" : "text-slate-500"}>
                    {value ? new Date(value).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Select date...'}
                </span>
                <CalendarIcon size={18} className="text-slate-400" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 mt-2 w-full max-w-[320px] p-4 rounded-xl border border-white/10 shadow-xl backdrop-blur-xl"
                        style={{
                            background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.95), rgba(20, 25, 40, 0.98))',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={prevMonth} type="button" className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <span className="font-semibold text-white">
                                {monthNames[month]} {year}
                            </span>
                            <button onClick={nextMonth} type="button" className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Weekday Labels */}
                        <div className="grid grid-cols-7 mb-2 text-center">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                <span key={d} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    {d}
                                </span>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1 justify-items-center">
                            {renderDays()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
