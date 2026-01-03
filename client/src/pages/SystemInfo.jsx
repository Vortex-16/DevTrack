import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useCache } from '../context/CacheContext'
import { Flame, Lightbulb, BarChart3, BookOpen, TrendingUp, Calendar, Zap, ArrowLeft } from 'lucide-react'
import PixelTransition from '../components/ui/PixelTransition'
import Lenis from 'lenis'

const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
}

function InfoSection({ title, icon, children, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
        >
            <Card className="overflow-hidden">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-white">{icon}</span>
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                </div>
                {children}
            </Card>
        </motion.div>
    )
}

function RuleItem({ number, title, description }) {
    return (
        <div className="flex gap-4 py-3 border-b border-white/5 last:border-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600/30 flex items-center justify-center">
                <span className="text-primary-400 font-bold text-sm">{number}</span>
            </div>
            <div>
                <h4 className="font-semibold text-white mb-1">{title}</h4>
                <p className="text-slate-400 text-sm">{description}</p>
            </div>
        </div>
    )
}

export default function SystemInfo() {
    const { hasCachedData, setCachedData } = useCache()
    const [loading, setLoading] = useState(!hasCachedData('system-info'))

    useEffect(() => {
        // Immediate transition, no artificial delay
        setLoading(false);
        setCachedData('system-info', true);
    }, [setCachedData])

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        })

        function raf(time) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }

        requestAnimationFrame(raf)

        return () => {
            lenis.destroy()
        }
    }, [])



    return (
        <PixelTransition loading={loading}>
        <motion.div
            className="space-y-8 max-w-4xl mx-auto"
        >
            {/* Header */}
            <motion.div {...fadeIn}>
                <h1 className="text-4xl font-bold text-gradient mb-2">System Information</h1>
                <p className="text-slate-400">
                    Understand how DevTrack calculates your progress, streaks, and statistics
                </p>
            </motion.div>

            {/* Streak Counter */}
            <InfoSection title="Streak Counter" icon={<Flame className="text-orange-500 fill-orange-500" size={32} />} delay={0.1}>
                <p className="text-slate-300 mb-4">
                    Your streak measures consecutive days of learning activity. Here's how it works:
                </p>

                <RuleItem
                    number="1"
                    title="Daily Check"
                    description="The streak is calculated by checking your learning log entries for consecutive days."
                />
                <RuleItem
                    number="2"
                    title="Starting from Today"
                    description="The system counts backward from today. If you have an entry today, it checks yesterday, then the day before, and so on."
                />
                <RuleItem
                    number="3"
                    title="Break Condition"
                    description="If any day in the sequence has no learning entry, the streak breaks at that point."
                />
                <RuleItem
                    number="4"
                    title="One Entry Per Day"
                    description="Multiple entries on the same day count as one day for streak purposes. Quality over quantity!"
                />

                <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-amber-400 text-sm flex items-start gap-2">
                        <Lightbulb size={18} className="text-amber-400 shrink-0" />
                        <span>
                            <strong>Tip:</strong> To maintain your streak, log at least one learning entry every day.
                            Even a small 15-minute session counts!
                        </span>
                    </p>
                </div>
            </InfoSection>

            {/* Progress Tracking */}
            <InfoSection title="Project Progress" icon={<BarChart3 className="text-blue-400" size={32} />} delay={0.2}>
                <p className="text-slate-300 mb-4">
                    Project progress is calculated using AI analysis of your GitHub repositories:
                </p>

                <RuleItem
                    number="1"
                    title="GitHub Integration"
                    description="When you link a GitHub repository, our system fetches commit history, file changes, and code structure."
                />
                <RuleItem
                    number="2"
                    title="AI Analysis"
                    description="The AI examines your codebase to understand project complexity, feature implementation, and overall progress."
                />
                <RuleItem
                    number="3"
                    title="Qualitative Assessment"
                    description="Progress isn't just commit count—it considers code organization, documentation, and feature completeness."
                />
                <RuleItem
                    number="4"
                    title="Re-analyze Option"
                    description="Click 'Re-analyze' on any project to get updated progress based on recent changes."
                />

                <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="success">Code Structure</Badge>
                    <Badge variant="primary">Commit Patterns</Badge>
                    <Badge variant="warning">Documentation</Badge>
                    <Badge variant="default">Feature Completion</Badge>
                </div>
            </InfoSection>

            {/* Learning Entries */}
            <InfoSection title="Learning Entries" icon={<BookOpen className="text-purple-400" size={32} />} delay={0.3}>
                <p className="text-slate-300 mb-4">
                    Learning logs help you track daily progress and build habits:
                </p>

                <RuleItem
                    number="1"
                    title="Date & Time"
                    description="Record when you start and end each learning session. This helps track total time spent."
                />
                <RuleItem
                    number="2"
                    title="What You Learned"
                    description="Describe what you studied, coded, or practiced. This becomes your learning journal."
                />
                <RuleItem
                    number="3"
                    title="Tags"
                    description="Add tags like 'React', 'Python', 'Backend' to categorize your learning. These build your tech profile."
                />
                <RuleItem
                    number="4"
                    title="Mood Tracking"
                    description="Record how you felt during the session. This helps identify optimal learning conditions."
                />
            </InfoSection>

            {/* Statistics */}
            <InfoSection title="Statistics Calculation" icon={<TrendingUp className="text-emerald-400" size={32} />} delay={0.4}>
                <p className="text-slate-300 mb-4">
                    Your dashboard stats are calculated from your activity data:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="font-semibold text-emerald-400 mb-2">Active Projects</h4>
                        <p className="text-slate-400 text-sm">
                            Projects marked as "active" status. In-progress work you're currently focused on.
                        </p>
                    </div>

                    <div className="p-4 rounded-lg bg-primary-500/10 border border-primary-500/20">
                        <h4 className="font-semibold text-primary-400 mb-2">Learning Entries</h4>
                        <p className="text-slate-400 text-sm">
                            Total number of learning log entries you've created. Quality matters more than quantity.
                        </p>
                    </div>

                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <h4 className="font-semibold text-blue-400 mb-2">Total Commits</h4>
                        <p className="text-slate-400 text-sm">
                            Sum of all commits across your linked GitHub repositories.
                        </p>
                    </div>

                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <h4 className="font-semibold text-amber-400 mb-2">Unique Days</h4>
                        <p className="text-slate-400 text-sm">
                            Number of different days you've logged learning. Shows consistency over time.
                        </p>
                    </div>
                </div>
            </InfoSection>

            {/* Activity Heatmap */}
            <InfoSection title="Activity Heatmap" icon={<Calendar className="text-pink-400" size={32} />} delay={0.5}>
                <p className="text-slate-300 mb-4">
                    The heatmap visualization on your dashboard:
                </p>

                <RuleItem
                    number="1"
                    title="8-Week View"
                    description="Shows the last 8 weeks (56 days) of your learning activity at a glance."
                />
                <RuleItem
                    number="2"
                    title="Color Intensity"
                    description="Darker/brighter colors mean more entries that day. Empty days are darkest."
                />
                <RuleItem
                    number="3"
                    title="Hover Details"
                    description="Hover over any cell to see the exact date and number of entries."
                />

                <div className="mt-4 flex items-center gap-4">
                    <span className="text-slate-400 text-sm">Activity Levels:</span>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-slate-800" title="No activity"></div>
                        <div className="w-4 h-4 rounded bg-primary-900" title="Low"></div>
                        <div className="w-4 h-4 rounded bg-primary-700" title="Medium"></div>
                        <div className="w-4 h-4 rounded bg-primary-500" title="High"></div>
                    </div>
                </div>
            </InfoSection>

            {/* Top Technologies */}
            <InfoSection title="Top Technologies" icon={<Zap className="text-cyan-400 fill-cyan-400" size={32} />} delay={0.6}>
                <p className="text-slate-300 mb-4">
                    Your tech profile is built from:
                </p>

                <RuleItem
                    number="1"
                    title="Project Technologies"
                    description="Technologies listed in your projects are aggregated and ranked by frequency."
                />
                <RuleItem
                    number="2"
                    title="GitHub Languages"
                    description="Programming languages detected in your linked GitHub repositories."
                />
                <RuleItem
                    number="3"
                    title="Learning Tags"
                    description="Tags you add to learning entries also contribute to your technology profile."
                />
            </InfoSection>

            {/* Back to Dashboard */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center pb-8"
            >
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
            </motion.div>
        </motion.div>
        </PixelTransition>
    )
}
