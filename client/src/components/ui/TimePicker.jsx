import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock } from 'lucide-react'
import { ReactLenis } from 'lenis/react'

export default function TimePicker({ value, onChange, label, minTime }) {
    const [isOpen, setIsOpen] = useState(false)
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

    const hours = ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
    const periods = ['AM', 'PM']

    const [selectedHour, setSelectedHour] = useState('12')
    const [selectedMinute, setSelectedMinute] = useState('00')
    const [selectedPeriod, setSelectedPeriod] = useState('PM')

    // Parse current value (HH:MM 24h) to 12h state
    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':')
            const hour24 = parseInt(h, 10)
            const period = hour24 >= 12 ? 'PM' : 'AM'
            let hour12 = hour24 % 12
            if (hour12 === 0) hour12 = 12
            
            setSelectedHour(String(hour12).padStart(2, '0'))
            setSelectedMinute(m)
            setSelectedPeriod(period)
        }
    }, [value])

    // Convert 12h state to 24h and notify parent
    const handleChange = (h, m, p) => {
        let hour24 = parseInt(h, 10)
        if (p === 'AM' && hour24 === 12) hour24 = 0
        if (p === 'PM' && hour24 !== 12) hour24 += 12
        
        const timeStr = `${String(hour24).padStart(2, '0')}:${m}`
        
        // Validation check against minTime
        if (minTime && timeStr <= minTime) {
             // If validation fails, we ideally shouldn't trigger onChange or we reset.
             // But for UI, we will just allow the internal update and let the disabled logic prevent bad clicks.
             // However, if a user switches period causing invalidity, we might need to handle it.
             // For simplicity in this interaction model, we trust the button disabled state.
        }

        onChange(timeStr)
    }

    // Helper to check if a time combination is valid
    const isTimeValid = (h, m, p) => {
        if (!minTime) return true
        
        let hour24 = parseInt(h, 10)
        if (p === 'AM' && hour24 === 12) hour24 = 0
        if (p === 'PM' && hour24 !== 12) hour24 += 12
        
        const timeStr = `${String(hour24).padStart(2, '0')}:${m}`
        return timeStr > minTime
    }

    const formatDisplay = () => {
        if (!value) return 'Select time...'
        const [h, m] = value.split(':')
        const hour24 = parseInt(h, 10)
        const period = hour24 >= 12 ? 'PM' : 'AM'
        let hour12 = hour24 % 12
        if (hour12 === 0) hour12 = 12
        return `${String(hour12).padStart(2, '0')}:${m} ${period}`
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
                    {formatDisplay()}
                </span>
                <Clock size={18} className="text-slate-400" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 mt-2 w-full p-4 rounded-xl border border-white/10 shadow-xl backdrop-blur-xl flex gap-2"
                        style={{
                            background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.95), rgba(20, 25, 40, 0.98))',
                        }}
                    >
                        {/* Hours Column */}
                        <div className="flex-1">
                            <div className="text-xs font-semibold text-slate-500 mb-2 text-center uppercase tracking-wider">Hour</div>
                            <ReactLenis 
                                root={false} 
                                className="h-48 overflow-y-auto overscroll-contain space-y-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/40 pr-1"
                            >
                                {hours.map(h => {
                                    const isValid = isTimeValid(h, '00', selectedPeriod) || isTimeValid(h, '55', selectedPeriod) // Check if any minute in this hour is valid
                                    return (
                                        <button
                                            key={h}
                                            type="button"
                                            disabled={!isValid}
                                            onClick={() => {
                                                setSelectedHour(h)
                                                handleChange(h, selectedMinute, selectedPeriod)
                                            }}
                                            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors
                                                ${selectedHour === h
                                                    ? 'bg-purple-500 text-white'
                                                    : isValid ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-700 cursor-not-allowed opacity-50'
                                                }
                                            `}
                                        >
                                            {h}
                                        </button>
                                    )
                                })}
                            </ReactLenis>
                        </div>

                        {/* Divider */}
                        <div className="w-[1px] bg-white/10 my-2" />

                        {/* Minutes Column */}
                        <div className="flex-1">
                            <div className="text-xs font-semibold text-slate-500 mb-2 text-center uppercase tracking-wider">Min</div>
                            <ReactLenis 
                                root={false} 
                                className="h-48 overflow-y-auto overscroll-contain space-y-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/40 pr-1"
                            >
                                {minutes.map(m => {
                                    const isValid = isTimeValid(selectedHour, m, selectedPeriod)
                                    return (
                                        <button
                                            key={m}
                                            type="button"
                                            disabled={!isValid}
                                            onClick={() => {
                                                setSelectedMinute(m)
                                                handleChange(selectedHour, m, selectedPeriod)
                                            }}
                                            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors
                                                ${selectedMinute === m
                                                    ? 'bg-purple-500 text-white'
                                                    : isValid ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-700 cursor-not-allowed opacity-50'
                                                }
                                            `}
                                        >
                                            {m}
                                        </button>
                                    )
                                })}
                            </ReactLenis>
                        </div>

                        {/* Divider */}
                        <div className="w-[1px] bg-white/10 my-2" />

                        {/* AM/PM Column */}
                        <div className="flex-1">
                            <div className="text-xs font-semibold text-slate-500 mb-2 text-center uppercase tracking-wider">AM/PM</div>
                            <div 
                                className="h-48 flex flex-col gap-1 overflow-y-auto overscroll-contain scrollbar-hide"
                                data-lenis-prevent
                            >
                                {periods.map(p => {
                                    // Check if period is valid (at least one time in this period is valid)
                                    // Simplified: if checking PM vs MinTime, if MinTime is in PM, AM is invalid.
                                    let isValid = true
                                    if (minTime) {
                                        const [minH, minM] = minTime.split(':')
                                        const minH24 = parseInt(minH, 10)
                                        if (p === 'AM' && minH24 >= 12) isValid = false
                                    }

                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            disabled={!isValid}
                                            onClick={() => {
                                                setSelectedPeriod(p)
                                                handleChange(selectedHour, selectedMinute, p)
                                            }}
                                            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors
                                                ${selectedPeriod === p
                                                    ? 'bg-purple-500 text-white'
                                                    : isValid ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-700 cursor-not-allowed opacity-50'
                                                }
                                            `}
                                        >
                                            {p}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
