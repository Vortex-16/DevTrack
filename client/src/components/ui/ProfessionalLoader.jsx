import { motion } from 'framer-motion'

export default function ProfessionalLoader({ className = "", size = "md" }) {
    const sizeClasses = {
        sm: "w-6 h-6",
        md: "w-10 h-10",
        lg: "w-16 h-16"
    }

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <div className={`relative ${sizeClasses[size]}`}>
                {/* Outer Ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-purple-500/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />
                
                {/* Spinning Gradient Ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border-t-2 border-r-2 border-purple-500"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />

                {/* Inner Pulse */}
                <motion.div
                    className="absolute inset-[25%] rounded-full bg-purple-500"
                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>
            
            {size !== 'sm' && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 text-xs font-medium text-slate-500 uppercase tracking-widest"
                >
                    Loading
                </motion.p>
            )}
        </div>
    )
}
