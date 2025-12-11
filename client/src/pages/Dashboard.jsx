import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { logsApi, projectsApi, healthApi } from '../services/api'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

// Helper to format dates - handles both strings and Firestore Timestamps
const formatDate = (date) => {
    if (!date) return 'Unknown date'
    // If it's a Firestore Timestamp object
    if (date._seconds !== undefined) {
        return new Date(date._seconds * 1000).toLocaleDateString()
    }
    // If it's already a string or Date
    if (typeof date === 'string') return date
    if (date instanceof Date) return date.toLocaleDateString()
    return String(date)
}

export default function Dashboard() {
    const [logStats, setLogStats] = useState(null)
    const [projectStats, setProjectStats] = useState(null)
    const [recentLogs, setRecentLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [backendStatus, setBackendStatus] = useState(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [logStatsRes, projectStatsRes, logsRes] = await Promise.all([
                logsApi.getStats().catch(() => ({ data: { data: {} } })),
                projectsApi.getStats().catch(() => ({ data: { data: {} } })),
                logsApi.getAll({ limit: 5 }).catch(() => ({ data: { data: { logs: [] } } }))
            ])
            setLogStats(logStatsRes.data.data || {})
            setProjectStats(projectStatsRes.data.data || {})
            setRecentLogs(logsRes.data.data.logs || [])
        } catch (err) {
            console.error('Error fetching data:', err)
        } finally {
            setLoading(false)
        }
    }

    const testConnection = async () => {
        try {
            const response = await healthApi.check()
            setBackendStatus(response.data)
        } catch (error) {
            setBackendStatus({ error: error.message })
        }
    }

    const hasNoData = !logStats?.totalLogs && !projectStats?.totalProjects

    const stats = [
        {
            label: 'Active Projects',
            value: projectStats?.activeProjects || 0,
            change: `${projectStats?.totalProjects || 0} total`,
            variant: 'success'
        },
        {
            label: 'Learning Entries',
            value: logStats?.totalLogs || 0,
            change: `${logStats?.uniqueDays || 0} unique days`,
            variant: 'primary'
        },
        {
            label: 'Total Commits',
            value: projectStats?.totalCommits || 0,
            change: 'Across all projects',
            variant: 'success'
        },
        {
            label: 'Current Streak',
            value: `${logStats?.currentStreak || 0} days`,
            change: logStats?.currentStreak > 0 ? 'Keep it up!' : 'Start today!',
            variant: 'warning'
        },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-slate-400">Loading dashboard...</div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold text-gradient mb-2">Dashboard</h1>
                <p className="text-slate-400">Track your developer journey in one place</p>
            </div>

            {/* Empty State - No Data Yet */}
            {hasNoData && (
                <Card className="text-center py-16 border-2 border-dashed border-primary-500/30 bg-gradient-to-br from-primary-900/10 to-transparent">
                    <div className="text-7xl mb-6">🎯</div>
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
                    <p className="text-sm text-slate-500 mt-6">
                        💡 Tip: Link your GitHub repos to auto-analyze progress with AI!
                    </p>
                </Card>
            )}

            {/* Stats Grid - Only show if has data */}
            {!hasNoData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                        <Card key={idx} className="hover:scale-105 transition-transform">
                            <div className="flex flex-col space-y-2">
                                <span className="text-slate-400 text-sm font-medium">{stat.label}</span>
                                <div className="text-3xl font-bold text-white">{stat.value}</div>
                                <Badge variant={stat.variant} className="w-fit">{stat.change}</Badge>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Recent Activity */}
            {!hasNoData && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Recent Learning</h2>
                    <Card>
                        {recentLogs.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-4">📚</div>
                                <p className="text-slate-400 mb-4">No learning entries yet.</p>
                                <Link to="/learning">
                                    <Button variant="ghost">Start Learning</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentLogs.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
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
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* Top Technologies */}
            {projectStats?.topTechnologies?.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Top Technologies</h2>
                    <div className="flex flex-wrap gap-3">
                        {projectStats.topTechnologies.map((item, idx) => (
                            <Badge key={idx} variant="primary" className="text-base px-4 py-2">
                                {item.tech} ({item.count})
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Backend Test */}
            <Card>
                <h3 className="text-xl font-semibold mb-4">Backend Connection Test</h3>
                <Button onClick={testConnection}>Test API Connection</Button>
                {backendStatus && (
                    <pre className="mt-4 p-4 bg-black/50 rounded-lg text-xs overflow-auto">
                        {JSON.stringify(backendStatus, null, 2)}
                    </pre>
                )}
            </Card>
        </div>
    )
}
