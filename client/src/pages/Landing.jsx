import { SignInButton } from '@clerk/clerk-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function Landing() {
    return (
        <div className="min-h-screen bg-dark-950">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center space-y-8">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center shadow-xl shadow-primary-500/50">
                            <span className="text-white font-bold text-4xl">D</span>
                        </div>
                    </div>

                    {/* Hero Text */}
                    <div className="space-y-4">
                        <h1 className="text-6xl md:text-7xl font-bold">
                            Track Your <span className="text-gradient">Developer Journey</span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                            Prove your consistency. Connect learning to real work. Build a portfolio that shows your growth.
                        </p>
                    </div>

                    {/* CTA */}
                    <div className="flex justify-center gap-4 pt-8">
                        <SignInButton mode="modal">
                            <Button size="lg">
                                Get Started with GitHub
                            </Button>
                        </SignInButton>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
                    <Card hover className="text-center">
                        <div className="text-4xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold mb-2">Learning Tracker</h3>
                        <p className="text-slate-400">Track courses, tutorials, and skills you're learning</p>
                    </Card>

                    <Card hover className="text-center">
                        <div className="text-4xl mb-4">🛠️</div>
                        <h3 className="text-xl font-semibold mb-2">Project Tracking</h3>
                        <p className="text-slate-400">Document projects and link them to skills applied</p>
                    </Card>

                    <Card hover className="text-center">
                        <div className="text-4xl mb-4">📊</div>
                        <h3 className="text-xl font-semibold mb-2">Consistency Dashboard</h3>
                        <p className="text-slate-400">Visualize your progress with heatmaps and analytics</p>
                    </Card>
                </div>

                {/* GitHub Integration Highlight */}
                <div className="mt-20">
                    <Card className="text-center py-12">
                        <div className="text-5xl mb-6">🐙</div>
                        <h2 className="text-3xl font-bold mb-4">
                            Seamless <span className="text-gradient">GitHub Integration</span>
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Auto-sync your commits, PRs, and contributions. Visualize your coding activity alongside your learning journey.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    )
}
