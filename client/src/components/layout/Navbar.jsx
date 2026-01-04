import { Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import NotificationSettings from '../settings/NotificationSettings'
import { BookOpen, Info } from 'lucide-react'

// SVG Icon Components
const DashboardIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
)

const GeminiIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 2C10.5 8.5 8 10.5 2 12C8 13.5 10.5 16 12 22C13.5 16 16 13.5 22 12C16 10.5 13.5 8 12 2Z"
            fill="currentColor"
        />
    </svg>
)

const WindowsTerminalIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="3" />
        <path d="M7 10l3 3-3 3" />
        <path d="M13 16h4" />
    </svg>
)




const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
    { name: 'Learning', path: '/learning', icon: BookOpen },
    { name: 'Projects', path: '/projects', icon: WindowsTerminalIcon },
    { name: 'AI Chat', path: '/chat', icon: GeminiIcon },
    { name: 'Info', path: '/system-info', icon: Info },
]

// Sidebar icon button
function SidebarIcon({ item, isActive }) {
    const IconComponent = item.icon
    return (
        <Link to={item.path} className="relative group flex items-center justify-center w-12 h-12">
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
                    className="absolute -left-3 top-3 w-1 h-6 bg-white rounded-r-full"
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
            className="hidden md:flex flex-col items-center py-6 px-3 h-screen fixed left-0 top-0 z-[10000]"
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
                    className="w-12 h-12 rounded-2xl bg-[#3a3a3a] 
                        flex items-center justify-center shadow-lg overflow-hidden"
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
                        isActive={location.pathname.startsWith(item.path)}
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
    const [isHidden, setIsHidden] = useState(false)

    const lastScrollY = useRef(0)

    // Listen for scroll events (window + dashboard container)
    useEffect(() => {
        const handleScroll = (e) => {
            // Only apply on mobile dashboard
            if (!location.pathname.startsWith('/dashboard') || window.innerWidth >= 768) {
                setIsHidden(false)
                return
            }

            // Get scroll position from target (element or window)
            const currentY = e.target === document ? window.scrollY : (e.target.scrollTop || 0)
            const diff = currentY - lastScrollY.current

            // Logic: Hide on scroll down (> 60px), Show on scroll up or at top
            if (currentY < 10) {
                setIsHidden(false)
            } else if (diff > 0 && currentY > 60) {
                setIsHidden(true)
            } else if (diff < 0) { // Show immediately on scroll up
                setIsHidden(false)
            }

            lastScrollY.current = currentY
        }

        // Attach to window and specific container
        window.addEventListener('scroll', handleScroll, { passive: true })
        
        // Try to find dashboard container and attach (poll briefly if needed, but simple query works if mounted)
        const container = document.getElementById('dashboard-scroll-container')
        if (container) container.addEventListener('scroll', handleScroll, { passive: true })

        return () => {
            window.removeEventListener('scroll', handleScroll)
            if (container) container.removeEventListener('scroll', handleScroll)
        }
    }, [location.pathname])

    return (
        <motion.nav
            className="md:hidden sticky top-4 z-[10000] mx-auto max-w-4xl px-4"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: isHidden ? -100 : 0, opacity: isHidden ? 0 : 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
        >
            <div
                className="rounded-full px-4 py-2 flex items-center justify-between backdrop-blur-xl"
                style={{
                    background: 'rgba(30, 30, 40, 0.6)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >
                {/* Logo - only on tablets/wide mobile */}
                <Link to="/" className="hidden sm:block mr-2">
                    <motion.div
                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center overflow-hidden"
                        whileHover={{ scale: 1.05 }}
                    >
                        <img src="devtrack-BG.png" alt="Logo" className="w-6 h-6 object-contain" />
                    </motion.div>
                </Link>
                {/* Nav items */}
                <div className="flex items-center gap-1 flex-1 justify-start sm:justify-center">
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
