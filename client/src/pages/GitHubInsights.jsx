import { ReactLenis } from 'lenis/react'
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Github,
    Zap,
    Star,
    GitFork,
    Target,
    Trophy,
    Code2,
    GitPullRequest,
    AlertCircle,
    TrendingUp,
    ShieldCheck,
    Award,
    Eye,
    Lock,
    Globe,
    Calendar,
    UserPlus,
    History,
    MessageSquare
} from 'lucide-react'
import { githubApi } from '../services/api'
import ProfessionalLoader from '../components/ui/ProfessionalLoader'
import { useCache } from '../context/CacheContext'

const BentoCard = ({ children, className = "", delay = 0 }) => (
    <motion.div
// ... (keep BentoCard and StatMini as is, referencing them by skipping)
// Actually, sticking to smaller chunks is safer.
// Let's just do imports first, then the logic.
// I'll do imports and top of component.

        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className={`bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-3 hover:border-purple-500/50 transition-colors shadow-xl overflow-hidden relative ${className}`}
    >
        {children}
    </motion.div>
)

const StatMini = ({ icon: Icon, label, value, color }) => (
    <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
        <div className={`p-1.5 rounded-lg bg-${color}-500/10 text-${color}-400`}>
            <Icon size={14} />
        </div>
        <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">{label}</p>
            <p className="text-xs font-black text-white">{value}</p>
        </div>
    </div>
)

export default function GitHubInsights() {
    const { getCachedData, setCachedData } = useCache()
    const [loading, setLoading] = useState(!getCachedData('github_insights'))
    const [error, setError] = useState(null)
    const [data, setData] = useState(getCachedData('github_insights') || null)

    useEffect(() => {
        const fetchInsights = async () => {
            if (data) return // Already have data (from cache)

            try {
                setLoading(true)
                const response = await githubApi.getInsights()
                const insightsData = response.data.data
                setData(insightsData)
                setCachedData('github_insights', insightsData)
            } catch (err) {
                console.error('Error fetching insights:', err)
                setError(err.response?.data?.error || 'Failed to fetch GitHub insights')
            } finally {
                setLoading(false)
            }
        }

        fetchInsights()
    }, [data, setCachedData])

    const accountAge = useMemo(() => {
        if (!data?.profile?.createdAt) return null
        const created = new Date(data.profile.createdAt)
        const now = new Date()
        const diffTime = Math.abs(now - created)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        const years = Math.floor(diffDays / 365)
        const months = Math.floor((diffDays % 365) / 30)

        if (years > 0) return `${years}y ${months}m`
        return `${months}m`
    }, [data])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
                <ProfessionalLoader size="lg" showText={false} />
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-slate-400 font-medium animate-pulse"
                >
                    Extracting GitHub DNA...
                </motion.p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
                <div className="p-4 rounded-full bg-red-500/10 text-red-500 mb-6">
                    <AlertCircle size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Analysis Failed</h2>
                <p className="text-slate-400 max-w-md">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-8 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors"
                >
                    Try Again
                </button>
            </div>
        )
    }

    const { profile, stats, rank, languages, badges } = data

    return (
        <div className="relative h-auto lg:h-[calc(100vh-4rem)] bg-slate-950 lg:overflow-hidden">
            <ReactLenis 
                root={false}
                id="github-insights-scroll-container"
                className="relative z-10 w-full h-full lg:overflow-y-auto px-4 md:px-6 py-6 lg:py-0 lg:overflow-visible flex flex-col"
            >
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center gap-6 mb-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <img
                            src={profile.avatarUrl}
                            alt={profile.name}
                            className="relative w-16 h-16 rounded-full border-2 border-white/20"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-slate-950 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                        </div>
                    </motion.div>
                    <div className="text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                            <h1 className="text-xl font-black text-white tracking-tight">{profile.name}</h1>
                            <span className="hidden md:block text-slate-700">|</span>
                            <p className="text-purple-400 font-bold text-sm tracking-wide">@{profile.username}</p>
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-3 mt-2 text-slate-400 text-xs">
                            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-purple-500" /> Member for {accountAge}</span>
                            <span className="flex items-center gap-1.5">•</span>
                            <span className="flex items-center gap-1.5"><UserPlus size={14} className="text-blue-500" /> {profile.followers} Followers</span>
                        </div>
                    </div>
                </div>

                {/* Main Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 lg:grid-rows-4 gap-4 auto-rows-[minmax(130px,auto)]">

                    {/* Rank Card - Slightly Smaller Focus */}
                    <BentoCard className="md:col-span-2 lg:col-span-2 lg:row-span-2 flex flex-col justify-between overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap className="w-48 h-48 rotate-12 text-purple-600" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                                    GitHub Rank & Authority
                                </span>
                                <Trophy className="text-yellow-500" size={20} />
                            </div>

                            <div className="flex items-baseline gap-3">
                                <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white to-white/20 select-none">
                                    {rank.grade}
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-lg font-black text-white">{rank.grade.includes('S') ? 'Elite Legend' : 'Advanced'}</span>
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">Level {rank.level}</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 mt-6 space-y-3">
                            <div className="w-full bg-white/5 rounded-full h-2.5 border border-white/5 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((rank.score / 2000) * 100, 100)}%` }}
                                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                <span>Authority Score: {rank.score}</span>
                                <span>{Math.round(Math.min((rank.score / 2000) * 100, 100))}% to Mastery</span>
                            </div>
                        </div>
                    </BentoCard>

                    {/* Contribution Breakdown DNA */}
                    <BentoCard className="md:col-span-2 lg:col-span-4 lg:row-span-1 border-purple-500/20">
                        <div className="flex items-center gap-2 mb-3">
                            <History className="text-purple-400" size={14} />
                            <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Activity DNA</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <StatMini icon={History} label="Commits" value={stats.totalCommits} color="blue" />
                            <StatMini icon={GitPullRequest} label="PRs" value={stats.totalPRs} color="purple" />
                            <StatMini icon={Target} label="Issues" value={stats.totalIssuesSolved} color="green" />
                            <StatMini icon={MessageSquare} label="Reviews" value={stats.totalReviews} color="yellow" />
                        </div>
                    </BentoCard>

                    {/* Repository Architecture */}
                    <BentoCard className="md:col-span-2 lg:col-span-4 lg:row-span-1 border-blue-500/20">
                        <div className="flex items-center gap-2 mb-3">
                            <Lock className="text-blue-400" size={14} />
                            <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Source Inventory</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <StatMini icon={Code2} label="Total" value={stats.totalRepos} color="slate" />
                            <StatMini icon={Globe} label="Public" value={stats.publicRepos} color="blue" />
                            <StatMini icon={Lock} label="Private" value={stats.privateRepos} color="red" />
                            <StatMini icon={GitFork} label="Sources" value={stats.sourceRepos} color="cyan" />
                        </div>
                    </BentoCard>

                    {/* Tech Stack Cards - Dynamic & Floating */}
                    <BentoCard className="md:col-span-1 lg:col-span-2 lg:row-span-1">
                        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Primary Stack</h3>
                        <div className="flex flex-wrap gap-1.5">
                            {languages.map((lang, i) => (
                                <span key={lang.name} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-slate-300">
                                    {lang.name}
                                </span>
                            ))}
                        </div>
                    </BentoCard>

                    {/* Coin/Contributions Counter */}
                    <BentoCard className="md:col-span-1 lg:col-span-2 lg:row-span-1 flex flex-col items-center justify-center text-center group">
                        <div className="p-3 rounded-full bg-yellow-500/10 text-yellow-500 mb-2 group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-3xl font-black text-white">{stats.totalContributions}</span>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Contributions</p>
                    </BentoCard>

                    {/* Social Stats */}
                    <BentoCard className="md:col-span-1 lg:col-span-2 lg:row-span-1 flex flex-col justify-around">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-yellow-400">
                                <Star size={16} />
                                <span className="text-lg font-black text-white">{stats.totalStars}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase">Gained Stars</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-white/5 pt-2">
                            <div className="flex items-center gap-2 text-cyan-400">
                                <Eye size={16} />
                                <span className="text-lg font-black text-white">{stats.totalWatching}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase">Watching</span>
                        </div>
                    </BentoCard>

                    {/* GitHub Bio / DNA Signature */}
                    <BentoCard className="md:col-span-1 lg:col-span-2 lg:row-span-1 flex flex-col justify-center relative italic text-slate-500 overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12">
                            <ShieldCheck size={80} />
                        </div>
                        <p className="text-xs leading-relaxed relative z-10 pl-3 border-l-2 border-purple-500/30">
                            "{profile.bio || "Full-stack developer architecting scalable solutions."}"
                        </p>
                        <div className="mt-2 text-[8px] font-black uppercase text-purple-500/50">Verified GitHub Identity</div>
                    </BentoCard>

                    {/* Achievements Unlocked */}
                    <BentoCard className="md:col-span-2 lg:col-span-4 lg:row-span-1 bg-gradient-to-br from-indigo-950/30 to-purple-950/30 border-purple-500/20 !overflow-visible z-20">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3">Milestones & Relics</h3>
                                <div className="flex gap-2">
                                    {badges.map((badge) => (
                                        <div key={badge.id} className="p-2 rounded-xl bg-white/5 border border-white/5 group relative cursor-default">
                                            <span className="text-xl">{badge.icon}</span>
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[8px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                {badge.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5">
                                <Award size={32} className="text-purple-400" />
                            </div>
                        </div>
                    </BentoCard>

                </div>
            </ReactLenis>
        </div>
    )
}
