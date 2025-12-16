import { Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import NotificationSettings from '../settings/NotificationSettings'

// SVG Icon Components
const DashboardIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
)

const LearningIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
)

const ProjectsIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
)

const ChatIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
)

const InfoIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
    { name: 'Learning', path: '/learning', icon: LearningIcon },
    { name: 'Projects', path: '/projects', icon: ProjectsIcon },
    { name: 'AI Chat', path: '/chat', icon: ChatIcon },
    { name: 'Info', path: '/system-info', icon: InfoIcon },
]

// Sidebar icon button
function SidebarIcon({ item, isActive }) {
    const IconComponent = item.icon
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
                <IconComponent className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
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

// Settings Icon Button
function SettingsButton({ onClick }) {
    return (
        <motion.button
            onClick={onClick}
            className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/5 relative group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-white text-sm rounded-lg 
                opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Settings
            </div>
        </motion.button>
    )
}

// Desktop Sidebar
function Sidebar({ onOpenSettings }) {
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
                        flex items-center justify-center shadow-lg shadow-purple-500/20 overflow-hidden"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <img src="devtrack-BG.png" alt="DevTrack" className="w-10 h-10 object-contain" />
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

            {/* Settings & User at bottom */}
            <div className="mt-auto pt-4 flex flex-col items-center gap-2">
                <SettingsButton onClick={onOpenSettings} />
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
function MobileNavbar({ onOpenSettings }) {
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
                                <item.icon className={`w-4 h-4 ${location.pathname === item.path ? 'text-white' : 'text-slate-400'}`} />
                            </motion.div>
                            <span className={`text-[10px] mt-0.5 ${location.pathname === item.path ? 'text-purple-400' : 'text-slate-500'}`}>
                                {item.name}
                            </span>
                        </Link>
                    ))}
                </div>

                {/* Settings button */}
                <motion.button
                    onClick={onOpenSettings}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10"
                    whileTap={{ scale: 0.95 }}
                >
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </motion.button>

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
    const [settingsOpen, setSettingsOpen] = useState(false)

    return (
        <>
            <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
            <MobileNavbar onOpenSettings={() => setSettingsOpen(true)} />
            <NotificationSettings
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />
        </>
    )
}
