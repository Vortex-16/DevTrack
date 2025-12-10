import { Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'

export default function Navbar() {
    return (
        <nav className="glass border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                            <span className="text-white font-bold text-xl">D</span>
                        </div>
                        <span className="text-xl font-bold text-gradient">DevTrack</span>
                    </Link>

                    {/* Right side */}
                    <div className="flex items-center space-x-6">
                        <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors">
                            Dashboard
                        </Link>
                        <Link to="/learning" className="text-slate-300 hover:text-white transition-colors">
                            Learning
                        </Link>
                        <Link to="/projects" className="text-slate-300 hover:text-white transition-colors">
                            Projects
                        </Link>
                        <Link to="/chat" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                            🤖 AI Chat
                        </Link>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </div>
        </nav>
    )
}
