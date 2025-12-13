import { Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/learning', label: 'Learning' },
    { path: '/projects', label: 'Projects' },
    { path: '/chat', label: '🤖 AI Chat' },
]

const MotionLink = motion(Link)

export default function Navbar() {
    const location = useLocation()

    return (
        <nav className="glass border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <motion.div 
                            className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center"
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="text-white font-bold text-xl">D</span>
                        </motion.div>
                        <span className="text-xl font-bold text-gradient group-hover:opacity-80 transition-opacity">DevTrack</span>
                    </Link>

                    {/* Right side */}
                    <div className="flex items-center space-x-1">
                        {NAV_ITEMS.map((item, i) => {
                            const isActive = location.pathname === item.path
                            
                            return (
                                <MotionLink
                                    key={item.path}
                                    to={item.path}
                                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive ? 'text-white' : 'text-slate-300 hover:text-white'
                                    }`}
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="navbar-active"
                                            className="absolute inset-0 bg-white/10 rounded-lg"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            style={{ borderRadius: 8 }}
                                        />
                                    )}
                                    <motion.span 
                                        className="relative z-10 block"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {item.label}
                                    </motion.span>
                                </MotionLink>
                            )
                        })}
                        <motion.div 
                            className="ml-4 pl-4 border-l border-white/10"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <UserButton afterSignOutUrl="/" />
                        </motion.div>
                    </div>
                </div>
            </div>
        </nav>
    )
}
