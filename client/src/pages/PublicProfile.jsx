import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Github,
    MapPin,
    Calendar,
    Code2,
    Award,
    Terminal,
    ExternalLink,
    GitCommit,
    Download,
    CheckCircle2,
    Briefcase,
    Mail,
    Globe,
    Share2,
    Cpu,
    Layers
} from 'lucide-react'
import ProfessionalLoader from '../components/ui/ProfessionalLoader'
import { publicApi } from '../services/api'
import confetti from 'canvas-confetti'

// ==========================================
// RESUME COMPONENT (Print Only)
// ==========================================
const ResumeView = ({ profile }) => (
    <div className="hidden print:block bg-white text-slate-900 w-full max-w-[210mm] mx-auto p-0">
        {/* Header / Name Block */}
        <div className="border-b-4 border-slate-900 pb-8 mb-8">
            <h1 className="text-5xl font-extrabold tracking-tight uppercase mb-2">{profile.name}</h1>
            <p className="text-xl text-slate-600 font-medium tracking-wide">Submit-Verified Full Stack Developer</p>

            <div className="flex flex-wrap gap-6 mt-6 text-sm font-medium text-slate-600">
                {profile.location && (
                    <span className="flex items-center gap-2">
                        <MapPin size={16} /> {profile.location}
                    </span>
                )}
                <span className="flex items-center gap-2">
                    <Github size={16} /> github.com/{profile.username}
                </span>
                <span className="flex items-center gap-2">
                    <Globe size={16} /> devtrack.app/u/{profile.username}
                </span>
            </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
            {/* Left Column (Skills & Stats) */}
            <div className="col-span-4 space-y-8 pr-6 border-r border-slate-200">
                {/* Verified Skills */}
                <section>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-2">
                        Verified Skills
                    </h3>
                    <div className="flex flex-col gap-2">
                        {profile.verifiedSkills.map((skill, index) => (
                            <div key={index} className="flex justify-between items-center group">
                                <span className="font-semibold text-slate-800">{skill.name}</span>
                                {skill.verified && (
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-300 font-medium">
                                        VERIFIED
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Stats Summary */}
                <section>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-2">
                        Impact Metrics
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <div className="text-2xl font-bold text-slate-900">{profile.stats.totalCommits}</div>
                            <div className="text-xs text-slate-500 uppercase font-medium">Total Commits</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">{profile.stats.totalProjects}</div>
                            <div className="text-xs text-slate-500 uppercase font-medium">Projects Shipped</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">Top 1%</div>
                            <div className="text-xs text-slate-500 uppercase font-medium">Consistency</div>
                        </div>
                    </div>
                </section>

                {/* Profile Bio */}
                <section>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-2">
                        About
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-700 italic">
                        "{profile.bio}"
                    </p>
                </section>
            </div>

            {/* Right Column (Projects) */}
            <div className="col-span-8 space-y-8">
                {/* Projects Section */}
                <section>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 border-b border-slate-200 pb-2">
                        Featured Projects (Proof of Work)
                    </h3>

                    <div className="space-y-8">
                        {profile.projects.slice(0, 5).map((project) => (
                            <div key={project.id} className="relative pl-4 border-l-2 border-slate-200">
                                <div className="flex justify-between items-baseline mb-2">
                                    <h4 className="text-lg font-bold text-slate-900">{project.name}</h4>
                                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                        {project.technologies.slice(0, 3).join(' • ')}
                                    </span>
                                </div>
                                <p className="text-justify text-sm text-slate-700 leading-relaxed mb-3">
                                    {project.description}
                                </p>
                                <div className="flex gap-4 text-xs font-medium text-slate-500">
                                    {project.repositoryUrl && (
                                        <span className="flex items-center gap-1">
                                            <Github size={12} /> Source Available
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <GitCommit size={12} /> {project.commits} Commits
                                    </span>
                                    {project.progress >= 90 && (
                                        <span className="flex items-center gap-1 text-emerald-700">
                                            <CheckCircle2 size={12} /> Completed
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
            <span>Verified by DevTrack Ecosystem</span>
            <span>Ref: {profile.username}-{new Date().getFullYear()}</span>
        </div>
    </div>
)


// ==========================================
// WEB COMPONENT
// ==========================================
export default function PublicProfile() {
    const { username } = useParams()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await publicApi.getProfile(username)
                setProfile(response.data.data)
            } catch (err) {
                console.error('Error fetching profile:', err)
                setError('Profile not found')
            } finally {
                setLoading(false)
            }
        }

        if (username) {
            fetchProfile()
        }
    }, [username])

    const handlePrint = () => {
        // Trigger confetti for fun before printing
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
        setTimeout(() => window.print(), 800)
    }

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        // Could add a toast here
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <ProfessionalLoader />
            </div>
        )
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-slate-400">
                <Terminal size={48} className="mb-4 opacity-50" />
                <h1 className="text-2xl font-bold text-slate-200 mb-2">404: Developer Not Found</h1>
                <p>The profile you are looking for does not exist or is private.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#050505] text-slate-200 selection:bg-cyan-500/20 font-inter">
            {/* Screen View */}
            <div className="print:hidden relative overflow-hidden">

                {/* Dynamic Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />
                </div>

                {/* Navbar */}
                <nav className="fixed top-0 w-full border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl z-50">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                <Code2 className="text-white w-4 h-4" />
                            </div>
                            <span className="font-bold text-sm tracking-wide text-gray-200">
                                DevTrack
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={copyLink}
                                className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                                title="Copy Link"
                            >
                                <Share2 size={18} />
                            </button>
                            <button
                                onClick={handlePrint}
                                className="bg-white text-black hover:bg-gray-200 text-sm font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                            >
                                <Download size={16} />
                                Resume
                            </button>
                        </div>
                    </div>
                </nav>

                <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-20">

                    {/* Hero Section */}
                    <div className="flex flex-col md:flex-row gap-8 items-end mb-16">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative group"
                        >
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                            <img
                                src={profile.avatarUrl}
                                alt={profile.name}
                                className="relative w-40 h-40 rounded-3xl object-cover border-4 border-[#0a0a0a] shadow-2xl"
                            />
                            <div className="absolute -bottom-4 -right-4 bg-[#0a0a0a] p-3 rounded-2xl border border-white/10 shadow-xl">
                                <Github className="w-6 h-6 text-white" />
                            </div>
                        </motion.div>

                        <div className="flex-1 pb-2">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-wrap gap-2 mb-4"
                            >
                                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wider uppercase">
                                    Verifiable Developer
                                </span>
                                {profile.location && (
                                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-gray-400 text-xs font-medium flex items-center gap-1">
                                        <MapPin size={12} /> {profile.location}
                                    </span>
                                )}
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight"
                            >
                                {profile.name}
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-xl text-gray-400 max-w-2xl leading-relaxed"
                            >
                                {profile.bio}
                            </motion.p>
                        </div>
                    </div>

                    {/* Bento Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Stats - Col 4 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="md:col-span-4 space-y-6"
                        >
                            {/* Main Stats Card */}
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <GitCommit className="text-cyan-400 mb-2" size={24} />
                                        <div className="text-2xl font-bold text-white">{profile.stats.totalCommits}</div>
                                        <div className="text-xs text-gray-500">Total Commits</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <Layers className="text-blue-400 mb-2" size={24} />
                                        <div className="text-2xl font-bold text-white">{profile.stats.totalProjects}</div>
                                        <div className="text-xs text-gray-500">Shipped Projects</div>
                                    </div>
                                    <div className="col-span-2 p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="flex justify-between items-start mb-2">
                                            <Award className="text-purple-400" size={24} />
                                            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Elite</span>
                                        </div>
                                        <div className="text-2xl font-bold text-white">
                                            {profile.verifiedSkills.filter(s => s.verified).length} Skills
                                        </div>
                                        <div className="text-xs text-gray-500">Verified by Code Analysis</div>
                                    </div>
                                </div>
                            </div>

                            {/* Skills Cloud */}
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Cpu size={14} /> Technology Stack
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.verifiedSkills.map((skill, i) => (
                                        <div
                                            key={i}
                                            className={`
                                                px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 font-medium transition-all
                                                ${skill.verified
                                                    ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-50 shadow-[0_0_15px_-3px_rgba(6,182,212,0.15)]'
                                                    : 'bg-white/5 border border-white/5 text-gray-500'}
                                            `}
                                        >
                                            {skill.name}
                                            {skill.verified && <CheckCircle2 size={12} className="text-cyan-400" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Projects - Col 8 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="md:col-span-8 space-y-6"
                        >
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 min-h-[500px]">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Terminal className="text-cyan-400" /> Featured Work
                                    </h3>
                                    <div className="text-xs font-mono text-gray-600">
                                        git log --oneline
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {profile.projects.map((project, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + (i * 0.1) }}
                                            key={project.id}
                                            className="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-6 transition-all duration-300 hover:border-cyan-500/30"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                                <div>
                                                    <h4 className="text-xl font-bold text-gray-200 group-hover:text-cyan-400 transition-colors mb-1">
                                                        {project.name}
                                                    </h4>
                                                    <p className="text-gray-500 text-sm leading-relaxed max-w-xl">
                                                        {project.description}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    {project.repositoryUrl && (
                                                        <a
                                                            href={project.repositoryUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                        >
                                                            <Github size={18} />
                                                        </a>
                                                    )}
                                                    {project.demoUrl && (
                                                        <a
                                                            href={project.demoUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                        >
                                                            <ExternalLink size={18} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                <div className="flex flex-wrap gap-2">
                                                    {project.technologies.slice(0, 4).map((tech, ti) => (
                                                        <span key={ti} className="text-xs font-mono text-cyan-200/60 bg-cyan-900/10 px-2 py-1 rounded">
                                                            {tech}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-mono text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <GitCommit size={14} /> {project.commits}
                                                    </span>
                                                    {project.progress > 0 && (
                                                        <span className={project.progress === 100 ? "text-emerald-500/80" : "text-amber-500/80"}>
                                                            {project.progress}% Done
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </main>
            </div>

            {/* Print View (Resume) */}
            <ResumeView profile={profile} />
        </div>
    )
}
