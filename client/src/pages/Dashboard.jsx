import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { logsApi, projectsApi, githubApi } from '../services/api'
import LoadingText from '../components/ui/LoadingText'
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

// Helper to format dates for display
const formatDate = (date) => {
    if (!date) return 'Unknown date'
    if (date._seconds !== undefined) {
        return new Date(date._seconds * 1000).toLocaleDateString()
    }
    if (typeof date === 'string') {
        // If it's YYYY-MM-DD format, parse it properly
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

// Helper to get YYYY-MM-DD string from any date format (Firestore timestamp, string, or Date)
const getDateString = (date) => {
    if (!date) return null

    let d
    if (date._seconds !== undefined) {
        // Firestore timestamp
        d = new Date(date._seconds * 1000)
    } else if (typeof date === 'string') {
        // Already a string - check if it's YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
            return date.split('T')[0] // Handle ISO strings too
        }
        d = new Date(date)
    } else if (date instanceof Date) {
        d = date
    } else {
        return null
    }

    // Format as YYYY-MM-DD
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

// Animated counter component
function AnimatedCounter({ value, duration = 1.5, suffix = '' }) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        const numValue = parseInt(value) || 0
        if (numValue === 0) {
            setCount(0)
            return
        }

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

    return <span>{count}{suffix}</span>
}

// Stat card with cyan/purple gradient design
function StatCard({ title, value, subtitle, delay = 0, color = 'cyan', icon = '' }) {
    const colors = {
        cyan: {
            text: 'text-cyan-400',
            glow: 'rgba(34, 211, 238, 0.2)',
            border: 'border-cyan-500/30',
        },
        purple: {
            text: 'text-purple-400',
            glow: 'rgba(168, 85, 247, 0.2)',
            border: 'border-purple-500/30',
        },
        green: {
            text: 'text-emerald-400',
            glow: 'rgba(52, 211, 153, 0.2)',
            border: 'border-emerald-500/30',
        },
        orange: {
            text: 'text-orange-400',
            glow: 'rgba(251, 146, 60, 0.2)',
            border: 'border-orange-500/30',
        }
    }

    const c = colors[color]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
        >
            <div
                className={`rounded-xl p-6 ${c.border} border backdrop-blur-sm`}
                style={{
                    background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(10, 15, 30, 0.95))',
                    boxShadow: `0 0 30px ${c.glow}`,
                }}
            >
                <h3 className={`text-sm font-medium ${c.text} mb-2 flex items-center gap-2`}>
                    {icon && <span>{icon}</span>}
                    {title}
                </h3>
                <div className="text-4xl font-bold text-white mb-1">
                    {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
                </div>
                <p className={`text-sm ${c.text}`}>{subtitle}</p>
            </div>
        </motion.div>
    )
}

// Weekly Activity Bar Chart
function WeeklyActivityChart({ logs }) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const today = new Date()
    const dayOfWeek = today.getDay()

    // Calculate activity for each day of the current week
    const weekActivity = days.map((day, index) => {
        const targetDay = new Date(today)
        const diff = index - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
        targetDay.setDate(today.getDate() + diff)

        // Format as YYYY-MM-DD for comparison
        const dateStr = getDateString(targetDay)

        // Use getDateString to convert log dates (which may be Firestore timestamps) for comparison
        const count = logs.filter(log => getDateString(log.date) === dateStr).length
        return { day, count, isToday: diff === 0, date: dateStr }
    })

    console.log('📅 Weekly Activity Debug:', JSON.stringify({
        today: today.toISOString().split('T')[0],
        dayOfWeek,
        weekDates: weekActivity.map(w => ({ day: w.day, date: w.date, count: w.count })),
        logDatesConverted: logs.map(l => getDateString(l.date)),
    }, null, 2))

    const maxCount = Math.max(...weekActivity.map(d => d.count), 1)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <div
                className="rounded-xl p-6 border border-white/10"
                style={{
                    background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(10, 15, 30, 0.95))',
                }}
            >
                <h3 className="text-lg font-semibold text-white mb-6">Weekly Activity</h3>
                <div className="flex items-end justify-between gap-3 h-40">
                    {weekActivity.map((item, index) => {
                        // Make bars much more visible - minimum 25% height if there's activity
                        const height = item.count > 0 ? Math.max((item.count / maxCount) * 100, 40) : 10
                        return (
                            <div key={item.day} className="flex flex-col items-center flex-1">
                                <motion.div
                                    className="w-full rounded-lg relative overflow-hidden"
                                    style={{
                                        height: `${height}%`,
                                        minHeight: item.count > 0 ? '40px' : '10px',
                                        background: item.isToday
                                            ? 'linear-gradient(180deg, #22d3ee, #06b6d4)'
                                            : item.count > 0
                                                ? 'linear-gradient(180deg, #a855f7, #7c3aed)'
                                                : 'rgba(71, 85, 105, 0.3)',
                                    }}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ delay: 0.4 + index * 0.1, duration: 0.6, ease: "easeOut" }}
                                    title={`${item.day}: ${item.count} entries on ${item.date}`}
                                >
                                    {item.count > 0 && (
                                        <>
                                            <div
                                                className="absolute inset-0"
                                                style={{
                                                    background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)',
                                                }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-white font-bold text-xs">{item.count}</span>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                                <span className={`mt-3 text-sm ${item.isToday ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}>
                                    {item.day}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </motion.div>
    )
}

// 30-Day Activity Heatmap (like GitHub contributions)
function StreakGrid({ logs = [], logStats }) {
    const days = 30
    const today = new Date()

    // Get all log dates as a Set for quick lookup - convert Firestore timestamps to YYYY-MM-DD
    const logDatesSet = new Set(
        Array.isArray(logs)
            ? logs.map(log => getDateString(log.date)).filter(Boolean)
            : []
    )

    console.log('🗓️ StreakGrid Data:', {
        logsCount: logs?.length || 0,
        logDatesConverted: Array.from(logDatesSet),
    })

    // Generate last 30 days
    const last30Days = Array.from({ length: days }, (_, i) => {
        const date = new Date(today)
        date.setDate(date.getDate() - (days - 1 - i))
        const dateStr = getDateString(date)
        const hasActivity = logDatesSet.has(dateStr)
        return {
            date: dateStr,
            hasActivity,
            isToday: i === days - 1
        }
    })

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
        >
            <div
                className="rounded-xl p-6 border border-white/10"
                style={{
                    background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(10, 15, 30, 0.95))',
                }}
            >
                <h3 className="text-lg font-semibold text-white mb-4">30-Day Activity</h3>
                <div className="grid grid-cols-10 gap-2 mb-4">
                    {last30Days.map((day, i) => (
                        <motion.div
                            key={i}
                            className="aspect-square rounded relative group"
                            style={{
                                background: day.hasActivity
                                    ? day.isToday
                                        ? 'linear-gradient(135deg, #22d3ee, #06b6d4)'
                                        : 'linear-gradient(135deg, #a855f7, #7c3aed)'
                                    : 'rgba(51, 65, 85, 0.3)',
                                boxShadow: day.hasActivity ? '0 0 8px rgba(168, 85, 247, 0.4)' : 'none',
                            }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.015 }}
                            title={`${day.date}: ${day.hasActivity ? 'Active' : 'No activity'}`}
                        >
                            {day.isToday && day.hasActivity && (
                                <div className="absolute inset-0 rounded animate-pulse bg-cyan-400/20"></div>
                            )}
                        </motion.div>
                    ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-gradient-to-br from-purple-400 to-purple-600"></div>
                            <span className="text-slate-400">Learning day</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-gradient-to-br from-cyan-400 to-cyan-600"></div>
                            <span className="text-slate-400">Today</span>
                        </div>
                    </div>
                    <div className="text-slate-400">
                        Streak: <span className="text-white font-semibold">{logStats?.currentStreak || 0} days</span>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default function Dashboard() {
    const [logStats, setLogStats] = useState(null)
    const [projectStats, setProjectStats] = useState(null)
    const [recentLogs, setRecentLogs] = useState([])
    const [githubCommits, setGithubCommits] = useState([])
    const [githubStreak, setGithubStreak] = useState(0)
    const [loading, setLoading] = useState(true)
    const retriedGithub = useRef(false)

    useEffect(() => {
        fetchData()
    }, [])

    // Retry GitHub fetch once if empty (handles race condition with user sync)
    useEffect(() => {
        if (!loading && githubCommits.length === 0 && !retriedGithub.current) {
            retriedGithub.current = true
            const timer = setTimeout(async () => {
                try {
                    const githubRes = await githubApi.getCommits(30)
                    const commits = githubRes.data?.data?.commits || []
                    const streak = githubRes.data?.data?.streak || 0
                    if (commits.length > 0 || streak > 0) {
                        console.log('🔄 GitHub retry successful:', commits.length, 'commits, streak:', streak)
                        setGithubCommits(commits)
                        setGithubStreak(streak)
                    }
                } catch (err) {
                    console.log('GitHub retry failed:', err.message)
                }
            }, 1500) // Wait for user sync to complete
            return () => clearTimeout(timer)
        }
    }, [loading, githubCommits.length])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [logStatsRes, projectStatsRes, logsRes, githubRes] = await Promise.all([
                logsApi.getStats().catch((err) => {
                    console.error('❌ Stats API error:', err)
                    return { data: { data: {} } }
                }),
                projectsApi.getStats().catch((err) => {
                    console.error('❌ Project stats error:', err)
                    return { data: { data: {} } }
                }),
                logsApi.getAll({ limit: 50 }).catch((err) => {
                    console.error('❌ Logs API error:', err)
                    return { data: { data: { logs: [] } } }
                }),
                githubApi.getCommits(30).catch((err) => {
                    console.error('❌ GitHub API error:', err)
                    return { data: { data: { commits: [] } } }
                })
            ])

            const logs = logsRes.data.data.logs || []
            const commits = githubRes.data?.data?.commits || []
            const streak = githubRes.data?.data?.streak || 0

            console.log('📊 Dashboard Data Received:', {
                logStats: logStatsRes.data.data,
                projectStats: projectStatsRes.data.data,
                logsCount: logs.length,
                logDates: logs.map(l => l.date),
                githubCommitsCount: commits.length,
                githubStreak: streak,
                commitDates: commits.map(c => c.date?.split('T')[0])
            })

            setLogStats(logStatsRes.data.data || {})
            setProjectStats(projectStatsRes.data.data || {})
            setRecentLogs(logs)
            setGithubCommits(commits)
            setGithubStreak(streak)
        } catch (err) {
            console.error('Error fetching data:', err)
        } finally {
            setLoading(false)
        }
    }

    const hasNoData = !logStats?.totalLogs && !projectStats?.totalProjects

    // Get unique skills from recent logs tags
    const allTags = recentLogs.flatMap(log => log.tags || [])
    const uniqueTags = [...new Set(allTags)]
    const skillsCount = uniqueTags.length

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingText />
            </div>
        )
    }

    return (
        <motion.div
            className="space-y-8 relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-4xl font-bold text-gradient mb-2">Dashboard</h1>
                <p className="text-slate-400">Track your developer journey in one place</p>
            </motion.div>

            {/* Empty State */}
            <AnimatePresence>
                {hasNoData && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <Card className="text-center py-16 border-2 border-dashed border-cyan-500/30 bg-gradient-to-br from-cyan-900/10 to-transparent">
                            <motion.div
                                className="text-7xl mb-6"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                🎯
                            </motion.div>
                            <h2 className="text-3xl font-bold mb-4">Welcome to DevTrack!</h2>
                            <p className="text-slate-400 mb-8 max-w-lg mx-auto text-lg">
                                Start your developer journey by adding a project or logging your first learning session.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link to="/projects">
                                    <Button size="lg" className="w-full sm:w-auto">
                                        🚀 Add a Project
                                    </Button>
                                </Link>
                                <Link to="/learning">
                                    <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                                        📚 Log Learning
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Row */}
            {!hasNoData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon="📚"
                        title="Learning Streak"
                        value={logStats?.currentStreak || 0}
                        subtitle={logStats?.currentStreak > 0 ? `${logStats.currentStreak} days in a row!` : 'Start logging today!'}
                        delay={0.1}
                        color="cyan"
                    />
                    <StatCard
                        icon="🐙"
                        title="GitHub Streak"
                        value={githubStreak}
                        subtitle={githubStreak > 0 ? `${githubStreak} days of commits!` : 'Push some code!'}
                        delay={0.15}
                        color="purple"
                    />
                    <StatCard
                        icon="📊"
                        title="Total Commits"
                        value={projectStats?.totalCommits || 0}
                        subtitle={`Across ${projectStats?.totalProjects || 0} projects`}
                        delay={0.2}
                        color="green"
                    />
                    <StatCard
                        icon="🏷️"
                        title="Skills Tracked"
                        value={skillsCount}
                        subtitle={
                            uniqueTags.length > 0
                                ? uniqueTags.slice(0, 3).join(', ') + (uniqueTags.length > 3 ? '...' : '')
                                : 'Add tags to learning logs'
                        }
                        delay={0.25}
                        color="orange"
                    />
                </div>
            )}

            {/* Charts Row */}
            {!hasNoData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <WeeklyActivityChart logs={recentLogs} />
                    <StreakGrid logs={recentLogs} logStats={logStats} />
                </div>
            )}

            {/* Recent Activity */}
            {!hasNoData && recentLogs.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <h2 className="text-2xl font-bold mb-4 text-white">Recent Learning</h2>
                    <div
                        className="rounded-xl p-6 border border-white/10"
                        style={{
                            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(10, 15, 30, 0.95))',
                        }}
                    >
                        <div className="space-y-4">
                            {recentLogs.slice(0, 5).map((log, idx) => (
                                <motion.div
                                    key={log.id}
                                    className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + idx * 0.1 }}
                                >
                                    <div className="flex items-center space-x-3">
                                        <motion.div
                                            className="w-2 h-2 rounded-full bg-cyan-500"
                                            animate={{ scale: [1, 1.3, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                                        />
                                        <div>
                                            <span className="text-slate-200">{log.learnedToday?.slice(0, 60)}{log.learnedToday?.length > 60 ? '...' : ''}</span>
                                            <div className="flex gap-2 mt-1">
                                                {(log.tags || []).slice(0, 3).map((tag, i) => (
                                                    <Badge key={i} variant="default" className="text-xs">{tag}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-slate-500 text-sm">{formatDate(log.date)}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Quick Actions */}
            {!hasNoData && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div
                        className="rounded-xl p-6 border border-cyan-500/20"
                        style={{
                            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(168, 85, 247, 0.1))',
                        }}
                    >
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <span>ℹ️</span> Want to know how tracking works?
                                </h3>
                                <p className="text-slate-400 text-sm">Learn how streaks, progress, and stats are calculated</p>
                            </div>
                            <Link to="/system-info">
                                <Button variant="secondary">View System Info</Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    )
}
