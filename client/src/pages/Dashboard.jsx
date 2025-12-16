import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { logsApi, projectsApi, githubApi } from '../services/api'
import LoadingText from '../components/ui/LoadingText'
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/clerk-react'

// Helper to format dates for display
const formatDate = (date) => {
    if (!date) return 'Unknown'
    if (date._seconds !== undefined) {
        return new Date(date._seconds * 1000).toLocaleDateString()
    }
    if (typeof date === 'string') {
        const parts = date.split('-')
        if (parts.length === 3 && parts[0].length === 4) {
            const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
            return d.toLocaleDateString()
        }
        return date
    }
    if (date instanceof Date) return date.toLocaleDateString()
    return String(date)
}

// Helper to get YYYY-MM-DD string from any date format
const getDateString = (date) => {
    if (!date) return null
    let d
    if (date._seconds !== undefined) {
        d = new Date(date._seconds * 1000)
    } else if (typeof date === 'string') {
        if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
            return date.split('T')[0]
        }
        d = new Date(date)
    } else if (date instanceof Date) {
        d = date
    } else {
        return null
    }
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

// Animated counter
function AnimatedCounter({ value, duration = 1.5 }) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        const numValue = parseInt(value) || 0
        if (numValue === 0) { setCount(0); return }

        const step = numValue / (duration * 60)
        let current = 0
        const timer = setInterval(() => {
            current += step
            if (current >= numValue) {
                setCount(numValue)
                clearInterval(timer)
            } else {
                setCount(Math.floor(current))
            }
        }, 1000 / 60)

        return () => clearInterval(timer)
    }, [value, duration])

    return <span>{count}</span>
}

// Portfolio Card - DARK themed with functional time buttons
function PortfolioCard({ totalLogs, currentStreak, logs }) {
    const [selectedPeriod, setSelectedPeriod] = useState('1W')

    // Get days based on selected period
    const getDaysForPeriod = (period) => {
        switch (period) {
            case '1D': return 1
            case '1W': return 7
            case '1M': return 30
            case '3M': return 90
            case '1Y': return 365
            case 'All': return 365
            default: return 7
        }
    }

    const days = getDaysForPeriod(selectedPeriod)

    // Generate chart data based on selected period
    const chartData = Array.from({ length: Math.min(days, 30) }, (_, i) => {
        const date = new Date()
        const daysBack = Math.min(days, 30) - 1 - i
        date.setDate(date.getDate() - daysBack)
        const dateStr = getDateString(date)

        // Filter logs within the period
        const periodStart = new Date()
        periodStart.setDate(periodStart.getDate() - days)

        return logs.filter(log => {
            const logDate = getDateString(log.date)
            return logDate === dateStr
        }).length
    })

    const maxVal = Math.max(...chartData, 1)
    const points = chartData.map((val, i) => {
        const x = 10 + (i / (chartData.length - 1 || 1)) * 180
        const y = 60 - (val / maxVal) * 45
        return `${x},${y}`
    }).join(' ')

    const areaPoints = `10,60 ${points} 190,60`

    // Calculate period stats
    const periodStart = new Date()
    periodStart.setDate(periodStart.getDate() - days)
    const periodLogs = logs.filter(log => {
        const logDateStr = getDateString(log.date)
        if (!logDateStr) return false
        const logDate = new Date(logDateStr)
        return logDate >= periodStart
    })

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="h-full"
        >
            <div
                className="rounded-3xl p-6 h-full relative overflow-hidden border border-white/10"
                style={{
                    background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.95), rgba(20, 25, 40, 0.98))',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
                }}
            >
                {/* Background glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-purple-500/10 blur-3xl" />

                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="text-3xl font-bold text-white">
                            <AnimatedCounter value={totalLogs} />
                        </h3>
                        <p className="text-slate-400 text-sm">Total Learning Logs</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-semibold text-purple-400">{periodLogs.length}</p>
                        <p className="text-xs text-slate-500">This {selectedPeriod}</p>
                    </div>
                </div>

                {/* Streak badge */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                        🔥 {currentStreak} day streak
                    </span>
                </div>

                {/* Chart */}
                <div className="mt-auto">
                    <svg viewBox="0 0 200 70" className="w-full h-20">
                        <defs>
                            <linearGradient id="portfolioGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <polygon points={areaPoints} fill="url(#portfolioGradient)" />
                        <polyline
                            points={points}
                            fill="none"
                            stroke="#a855f7"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        {/* Dots on data points */}
                        {chartData.map((val, i) => {
                            if (val > 0) {
                                const x = 10 + (i / (chartData.length - 1 || 1)) * 180
                                const y = 60 - (val / maxVal) * 45
                                return <circle key={i} cx={x} cy={y} r="3" fill="#a855f7" />
                            }
                            return null
                        })}
                    </svg>

                    {/* Time range tabs - FUNCTIONAL */}
                    <div className="flex items-center gap-1 mt-2 p-1 rounded-xl bg-white/5">
                        {['1D', '1W', '1M', '3M', '1Y', 'All'].map((period) => (
                            <button
                                key={period}
                                onClick={() => setSelectedPeriod(period)}
                                className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-all duration-200
                                    ${selectedPeriod === period
                                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                                        : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                            >
                                {period}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// Asset Card - DARK themed
function AssetCard({ icon, title, subtitle, value, change, color, delay = 0 }) {
    const colors = {
        cyan: { border: 'border-cyan-500/30', iconBg: 'from-cyan-500 to-cyan-600', glow: 'shadow-cyan-500/20' },
        purple: { border: 'border-purple-500/30', iconBg: 'from-purple-500 to-purple-600', glow: 'shadow-purple-500/20' },
        green: { border: 'border-emerald-500/30', iconBg: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/20' },
        orange: { border: 'border-orange-500/30', iconBg: 'from-orange-500 to-orange-600', glow: 'shadow-orange-500/20' },
    }
    const c = colors[color] || colors.cyan

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="flex-1 min-w-[140px]"
        >
            <div
                className={`rounded-2xl p-4 h-full border ${c.border} backdrop-blur-sm`}
                style={{
                    background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.9), rgba(20, 25, 40, 0.95))',
                }}
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center text-lg shadow-lg ${c.glow}`}>
                        {icon}
                    </div>
                    <div>
                        <p className="font-bold text-white text-lg">
                            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
                        </p>
                        <p className="text-slate-400 text-xs">{title}</p>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs">{subtitle}</span>
                    {change !== undefined && change !== 0 && (
                        <span className={`text-xs font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {change >= 0 ? '+' : ''}{change}%
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

// Activity Table - DARK themed
function ActivityTable({ logs, logStats }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <div
                className="rounded-3xl p-6 h-full border border-white/10"
                style={{
                    background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.95), rgba(20, 25, 40, 0.98))',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                        <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                            🔥 {logStats?.currentStreak || 0} days
                        </span>
                    </div>
                    <Link to="/learning" className="text-purple-400 text-sm hover:text-purple-300 transition-colors">
                        View All →
                    </Link>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide border-b border-white/5">
                    <div className="col-span-6">Topic</div>
                    <div className="col-span-2 text-center">Tags</div>
                    <div className="col-span-2 text-center">Date</div>
                    <div className="col-span-2 text-right">Status</div>
                </div>

                {/* Table Body */}
                <div className="space-y-1 mt-2">
                    {logs.slice(0, 4).map((log, idx) => (
                        <motion.div
                            key={log.id}
                            className="grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + idx * 0.1 }}
                        >
                            <div className="col-span-6 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-purple-500/20">
                                    {(log.learnedToday || 'L')[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-white text-sm">
                                        {log.learnedToday?.slice(0, 35)}{log.learnedToday?.length > 35 ? '...' : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="col-span-2 text-center">
                                <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs">
                                    {(log.tags || []).length} tags
                                </span>
                            </div>
                            <div className="col-span-2 text-center">
                                <span className="text-sm text-slate-400">
                                    {formatDate(log.date)}
                                </span>
                            </div>
                            <div className="col-span-2 text-right">
                                <span className="text-emerald-400">✓</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

// Promo Card - DARK themed
function PromoCard() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="h-full"
        >
            <div
                className="rounded-3xl p-6 h-full relative overflow-hidden border border-white/10"
                style={{
                    background: 'linear-gradient(135deg, #1a1b2e 0%, #0d0e1a 100%)',
                }}
            >
                {/* Decorative shapes */}
                <div className="absolute top-4 right-4 w-16 h-16 rounded-2xl bg-white/5 rotate-12" />
                <div className="absolute bottom-8 right-8 w-12 h-12 rounded-xl bg-white/5 -rotate-6" />
                <div className="absolute top-1/2 right-12 w-8 h-8 rounded-lg bg-purple-500/20 rotate-45" />

                <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white mb-2">
                        Track Your <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">Growth</span>
                    </h3>
                    <h3 className="text-xl font-bold text-white mb-4">
                        with DevTrack!
                    </h3>
                    <p className="text-slate-400 text-sm mb-6 max-w-[200px]">
                        Log your learning daily and watch your consistency grow!
                    </p>
                    <Link to="/learning">
                        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium">
                            Start Now
                        </Button>
                    </Link>
                </div>
            </div>
        </motion.div>
    )
}

// GitHub Icon component
function GitHubIcon() {
    return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
        </svg>
    )
}

export default function Dashboard() {
    const { user } = useUser()
    const [logStats, setLogStats] = useState(null)
    const [projectStats, setProjectStats] = useState(null)
    const [recentLogs, setRecentLogs] = useState([])
    const [githubCommits, setGithubCommits] = useState([])
    const [githubStreak, setGithubStreak] = useState(0)
    const [githubUsername, setGithubUsername] = useState('')
    const [loading, setLoading] = useState(true)
    const retriedGithub = useRef(false)

    useEffect(() => {
        fetchData()
        // Get GitHub username from Clerk user metadata
        if (user?.externalAccounts) {
            const githubAccount = user.externalAccounts.find(acc => acc.provider === 'github')
            if (githubAccount?.username) {
                setGithubUsername(githubAccount.username)
            }
        }
    }, [user])

    useEffect(() => {
        if (!loading && githubCommits.length === 0 && !retriedGithub.current) {
            retriedGithub.current = true
            const timer = setTimeout(async () => {
                try {
                    const githubRes = await githubApi.getCommits(30)
                    const commits = githubRes.data?.data?.commits || []
                    const streak = githubRes.data?.data?.streak || 0
                    if (commits.length > 0 || streak > 0) {
                        setGithubCommits(commits)
                        setGithubStreak(streak)
                    }
                } catch (err) {
                    console.log('GitHub retry failed:', err.message)
                }
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [loading, githubCommits.length])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [logStatsRes, projectStatsRes, logsRes, githubRes] = await Promise.all([
                logsApi.getStats().catch(() => ({ data: { data: {} } })),
                projectsApi.getStats().catch(() => ({ data: { data: {} } })),
                logsApi.getAll({ limit: 50 }).catch(() => ({ data: { data: { logs: [] } } })),
                githubApi.getCommits(30).catch(() => ({ data: { data: { commits: [] } } }))
            ])

            setLogStats(logStatsRes.data.data || {})
            setProjectStats(projectStatsRes.data.data || {})
            setRecentLogs(logsRes.data.data.logs || [])
            setGithubCommits(githubRes.data?.data?.commits || [])
            setGithubStreak(githubRes.data?.data?.streak || 0)
        } catch (err) {
            console.error('Error fetching data:', err)
        } finally {
            setLoading(false)
        }
    }

    const hasNoData = !logStats?.totalLogs && !projectStats?.totalProjects
    const allTags = recentLogs.flatMap(log => log.tags || [])
    const uniqueTags = [...new Set(allTags)]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingText />
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Main Container with rounded border */}
            <div
                className="rounded-[2rem] p-6 lg:p-8 border border-white/10"
                style={{
                    background: 'linear-gradient(145deg, rgba(15, 20, 35, 0.8), rgba(10, 15, 25, 0.9))',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                }}
            >
                {/* Header Row */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Overview</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* GitHub Link */}
                        {githubUsername ? (
                            <a
                                href={`https://github.com/${githubUsername}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                            >
                                <GitHubIcon />
                                <span className="text-sm text-white font-medium hidden sm:block">{githubUsername}</span>
                            </a>
                        ) : (
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                            >
                                <GitHubIcon />
                                <span className="text-sm font-medium hidden sm:block">Connect GitHub</span>
                            </a>
                        )}
                    </div>
                </div>

                {/* Empty State */}
                <AnimatePresence>
                    {hasNoData && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <Card className="text-center py-16 border-2 border-dashed border-purple-500/30">
                                <motion.div
                                    className="text-7xl mb-6"
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    🎯
                                </motion.div>
                                <h2 className="text-3xl font-bold mb-4">Welcome to DevTrack!</h2>
                                <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                                    Start your developer journey by adding a project or logging your first learning session.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link to="/projects">
                                        <Button size="lg">🚀 Add a Project</Button>
                                    </Link>
                                    <Link to="/learning">
                                        <Button variant="secondary" size="lg">📚 Log Learning</Button>
                                    </Link>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Dashboard Grid */}
                {!hasNoData && (
                    <div className="space-y-6">
                        {/* Row 1: Portfolio + Assets */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Portfolio Card - spans 4 cols */}
                            <div className="lg:col-span-4">
                                <PortfolioCard
                                    totalLogs={logStats?.totalLogs || 0}
                                    currentStreak={logStats?.currentStreak || 0}
                                    logs={recentLogs}
                                />
                            </div>

                            {/* Your Stats Section - spans 8 cols */}
                            <div className="lg:col-span-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-white">Your Stats</h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <AssetCard
                                        icon="📚"
                                        title="Learning"
                                        subtitle="Streak days"
                                        value={logStats?.currentStreak || 0}
                                        change={logStats?.currentStreak > 0 ? 14 : 0}
                                        color="cyan"
                                        delay={0.15}
                                    />
                                    <AssetCard
                                        icon="🐙"
                                        title="GitHub"
                                        subtitle="Commit streak"
                                        value={githubStreak}
                                        change={githubStreak > 0 ? 8 : 0}
                                        color="purple"
                                        delay={0.2}
                                    />
                                    <AssetCard
                                        icon="📊"
                                        title="Commits"
                                        subtitle={`${projectStats?.totalProjects || 0} projects`}
                                        value={projectStats?.totalCommits || 0}
                                        change={27}
                                        color="green"
                                        delay={0.25}
                                    />
                                    <AssetCard
                                        icon="🏷️"
                                        title="Skills"
                                        subtitle={uniqueTags.slice(0, 2).join(', ') || 'Add tags'}
                                        value={uniqueTags.length}
                                        color="orange"
                                        delay={0.3}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Activity Table + Promo Card */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Activity Table - spans 8 cols */}
                            <div className="lg:col-span-8">
                                <ActivityTable logs={recentLogs} logStats={logStats} />
                            </div>

                            {/* Promo Card - spans 4 cols */}
                            <div className="lg:col-span-4">
                                <PromoCard />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
