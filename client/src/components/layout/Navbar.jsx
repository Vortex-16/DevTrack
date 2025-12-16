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

// Sidebar icon button
function SidebarIcon({ item, isActive }) {
    return (
        <Link to={item.path} className="relative group">
            <motion.div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200
                    ${isActive
                        ? 'bg-white/10 shadow-lg'
                        : 'hover:bg-white/5'
                    }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <span className="text-xl">{item.icon}</span>
            </motion.div>
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-white text-sm rounded-lg 
                opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {item.name}
            </div>
            {/* Active indicator */}
            {isActive && (
                <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"
                    layoutId="activeIndicator"
                />
            )}
        </Link>
    )
}

// Desktop Sidebar
function Sidebar() {
    const location = useLocation()

    return (
        <motion.aside
            className="hidden lg:flex flex-col items-center py-6 px-3 h-screen fixed left-0 top-0 z-40"
            style={{
                width: '80px',
                background: 'linear-gradient(180deg, #1a1b2e 0%, #0f1021 100%)',
                borderRight: '1px solid rgba(255, 255, 255, 0.06)',
            }}
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Logo */}
            <Link to="/" className="mb-8">
                <motion.div
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 
                        flex items-center justify-center shadow-lg shadow-purple-500/20"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <span className="text-white font-bold text-xl">D</span>
                </motion.div>
            </Link>

            {/* Divider */}
            <div className="w-8 h-px bg-white/10 mb-6" />

            {/* Navigation */}
            <nav className="flex flex-col items-center gap-2 flex-1">
                {navItems.map((item) => (
                    <SidebarIcon
                        key={item.path}
                        item={item}
                        isActive={location.pathname === item.path}
                    />
                ))}
            </nav>

            {/* User at bottom */}
            <div className="mt-auto pt-4">
                <motion.div
                    className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                >
                    <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                            elements: {
                                avatarBox: 'w-10 h-10',
                                userButtonTrigger: 'focus:shadow-none',
                            }
                        }}
                    />
                </motion.div>
            </div>
        </motion.aside>
    )
}

// Mobile top navbar (pill-shaped)
function MobileNavbar() {
    const location = useLocation()

    return (
        <motion.nav
            className="lg:hidden sticky top-4 z-50 mx-auto max-w-4xl px-4"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
            <div
                className="rounded-full px-4 py-2 flex items-center justify-between backdrop-blur-xl"
                style={{
                    background: 'linear-gradient(145deg, rgba(30, 30, 40, 0.9), rgba(20, 20, 30, 0.95))',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >
                {/* Nav items */}
                <div className="flex items-center gap-1 flex-1 justify-center">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="relative flex flex-col items-center"
                        >
                            <motion.div
                                className={`w-10 h-10 rounded-full flex items-center justify-center
                                    ${location.pathname === item.path
                                        ? 'bg-gradient-to-br from-purple-500 to-purple-700'
                                        : 'hover:bg-white/10'
                                    }`}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="text-lg">{item.icon}</span>
                            </motion.div>
                            <span className={`text-[10px] mt-0.5 ${location.pathname === item.path ? 'text-purple-400' : 'text-slate-500'}`}>
                                {item.name}
                            </span>
                        </Link>
                    ))}
                </div>

                {/* User */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 flex items-center justify-center ml-2">
                    <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                            elements: {
                                avatarBox: 'w-8 h-8',
                                userButtonTrigger: 'focus:shadow-none',
                            }
                        }}
                    />
                </div>
            </div>
        </motion.nav>
    )
}

export default function Navbar() {
    return (
        <>
            <Sidebar />
            <MobileNavbar />
        </>
    )
}
