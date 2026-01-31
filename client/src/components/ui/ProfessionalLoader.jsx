import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

export default function ProfessionalLoader({ className = "", size = "md", showText = true }) {
    const scaleMap = {
        sm: 0.5,
        md: 1,
        lg: 1.5
    }
    const scale = scaleMap[size] || 1

    return (
        <div className={`flex flex-col items-center justify-center ${className} relative overflow-hidden p-8`}>
            {/* Deep Space Background Glow */}
            <div className="absolute inset-0 bg-radial-gradient from-purple-900/20 to-transparent opacity-50 blur-xl" />

            <div className="relative" style={{ width: 120 * scale, height: 120 * scale }}>

                {/* Twinkling Stars */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-white/40"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            opacity: [0.2, 0.8, 0.2],
                            scale: [0.8, 1.2, 0.8]
                        }}
                        transition={{
                            duration: 2 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random()
                        }}
                    >
                        <Star size={8 * scale} fill="currentColor" />
                    </motion.div>
                ))}

                {/* Planet in Background */}
                <motion.div
                    className="absolute -right-4 -top-4 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 opacity-80 blur-[1px]"
                    animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent to-white/30" />
                </motion.div>

                {/* Floating Astronaut SVG */}
                <motion.svg
                    viewBox="0 0 100 100"
                    className="w-full h-full drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                    animate={{
                        y: [-5, 5, -5],
                        rotate: [-2, 2, -2]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    {/* Backpack (PLSS) */}
                    <path d="M30 40 H70 V75 A10 10 0 0 1 60 85 H40 A10 10 0 0 1 30 75 Z" fill="#94a3b8" />

                    {/* Body/Suit */}
                    <path d="M35 35 H65 V70 A15 15 0 0 1 50 85 A15 15 0 0 1 35 70 Z" fill="white" />

                    {/* Helmet */}
                    <circle cx="50" cy="35" r="22" fill="white" stroke="#e2e8f0" strokeWidth="2" />

                    {/* Visor - animated reflection */}
                    <defs>
                        <linearGradient id="visorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                    </defs>
                    <motion.path
                        d="M35 35 A15 15 0 0 1 65 35 A15 15 0 0 1 35 35 Z"
                        fill="url(#visorGradient)"
                        stroke="#1e293b"
                        strokeWidth="1"
                    />

                    {/* Glare on Visor */}
                    <motion.ellipse
                        cx="58" cy="28" rx="4" ry="2" fill="white" opacity="0.6"
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />

                    {/* Suit Details */}
                    <rect x="42" y="60" width="16" height="12" rx="2" fill="#e2e8f0" />
                    <circle cx="46" cy="66" r="2" fill="#ef4444" /> {/* Red Button */}
                    <circle cx="54" cy="66" r="2" fill="#22c55e" /> {/* Green Button */}

                    {/* Arms (simplified) */}
                    <path d="M25 50 Q30 60 35 55" stroke="white" strokeWidth="8" strokeLinecap="round" />
                    <path d="M75 50 Q70 60 65 55" stroke="white" strokeWidth="8" strokeLinecap="round" />
                </motion.svg>

            </div>

            {showText && size !== 'sm' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-2 flex flex-col items-center"
                >
                    <p className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 tracking-widest uppercase">
                        Exploring Universe
                    </p>
                    <motion.div
                        className="w-12 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full mt-2"
                        animate={{ width: ["0%", "100%", "0%"], opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                </motion.div>
            )}
        </div>
    )
}
