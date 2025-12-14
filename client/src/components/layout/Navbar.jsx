import { Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Learning', path: '/learning', icon: '📚' },
    { name: 'Projects', path: '/projects', icon: '🚀' },
    { name: 'AI Chat', path: '/chat', icon: '🤖' },
    { name: 'Info', path: '/system-info', icon: 'ℹ️' },
]

// Pill-shaped nav button with 3D appearance
function NavPill({ item, isActive, onClick }) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <Link
            to={item.path}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative flex flex-col items-center gap-1 group"
        >
            {/* The pill button */}
            <motion.div
                className="relative w-11 h-11 rounded-full cursor-pointer flex items-center justify-center"
                style={{
                    background: isActive
                        ? 'linear-gradient(145deg, #a855f7, #7e22ce)'
                        : 'linear-gradient(145deg, #3a3a4a, #2a2a38)',
                    boxShadow: isActive
                        ? '0 4px 15px rgba(168, 85, 247, 0.4), inset 0 2px 4px rgba(255,255,255,0.2)'
                        : '4px 4px 10px rgba(0,0,0,0.4), -2px -2px 8px rgba(255,255,255,0.05), inset 0 2px 4px rgba(255,255,255,0.05)',
                }}
                animate={{
                    scale: isHovered ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                }}
                whileTap={{ scale: 0.95 }}
                transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 17
                }}
            >
                {/* Inner circle highlight */}
                <motion.div
                    className="absolute inset-1 rounded-full pointer-events-none"
                    style={{
                        background: isActive
                            ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 60%)'
                            : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), transparent 60%)',
                    }}
                />

                {/* Icon */}
                <span className="text-xl z-10 filter drop-shadow-md">{item.icon}</span>

                {/* Outer ring glow effect */}
                <motion.div
                    className="absolute -inset-0.5 rounded-full opacity-0 pointer-events-none"
                    style={{
                        background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.6), rgba(126, 34, 206, 0.6))',
                        filter: 'blur(4px)',
                    }}
                    animate={{
                        opacity: isActive ? 0.6 : isHovered ? 0.3 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                />
            </motion.div>

            {/* Label */}
            <motion.span
                className="text-xs font-medium"
                animate={{
                    color: isActive ? '#a855f7' : '#94a3b8',
                    y: isHovered ? -2 : 0,
                }}
                transition={{ duration: 0.2 }}
            >
                {item.name}
            </motion.span>
        </Link>
    )
}

export default function Navbar() {
    const location = useLocation()
    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => {
        const index = navItems.findIndex(item => item.path === location.pathname)
        if (index !== -1) setActiveIndex(index)
    }, [location.pathname])

    return (
        <motion.nav
            className="sticky top-4 z-50 mx-auto max-w-4xl px-4"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
            {/* Pill-shaped container */}
            <div
                className="rounded-full px-6 py-3 flex items-center justify-between backdrop-blur-xl"
                style={{
                    background: 'linear-gradient(145deg, rgba(30, 30, 40, 0.9), rgba(20, 20, 30, 0.95))',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-2 group">
                    <motion.div
                        className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="text-white font-bold text-lg">D</span>
                    </motion.div>
                    <motion.span
                        className="text-lg font-bold text-gradient hidden sm:block"
                        whileHover={{ scale: 1.02 }}
                    >
                        DevTrack
                    </motion.span>
                </Link>

                {/* Center Navigation - Pill Buttons */}
                <div className="flex items-center gap-4">
                    {navItems.map((item, index) => (
                        <NavPill
                            key={item.path}
                            item={item}
                            isActive={location.pathname === item.path}
                            onClick={() => setActiveIndex(index)}
                        />
                    ))}
                </div>

                {/* Right side - User */}
                <motion.div
                    className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden"
                    style={{
                        background: 'linear-gradient(145deg, #3a3a4a, #2a2a38)',
                        boxShadow: '4px 4px 10px rgba(0,0,0,0.4), -2px -2px 8px rgba(255,255,255,0.05), inset 0 2px 4px rgba(255,255,255,0.05)',
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                            elements: {
                                avatarBox: 'w-9 h-9',
                                userButtonTrigger: 'focus:shadow-none',
                            }
                        }}
                    />
                </motion.div>
            </div>
        </motion.nav>
    )
}
