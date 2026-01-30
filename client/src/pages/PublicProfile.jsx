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
    Layers,
    X,
    Copy,
    Check,
    Edit2,
    Trophy,
    Save,
    Plus,
    Minus,
    Loader2
} from 'lucide-react'
import ProfessionalLoader from '../components/ui/ProfessionalLoader'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { publicApi, preferencesApi, projectsApi } from '../services/api'
import confetti from 'canvas-confetti'
import { useUser } from '@clerk/clerk-react'

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
// EDIT PROFILE MODAL
// ==========================================
const EditProfileModal = ({ profile, projects, isOpen, onClose, onUpdate }) => {
    const [bio, setBio] = useState(profile.bio || '')
    const [headline, setHeadline] = useState(profile.headline || '')
    const [showSkills, setShowSkills] = useState(profile.verifiedSkills?.length > 0)
    const [selectedProjects, setSelectedProjects] = useState(
        profile.projects.map(p => p.id)
    )
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setBio(profile.bio || '')
            setHeadline(profile.headline || '')
            setShowSkills(profile.verifiedSkills?.length > 0)
            setSelectedProjects(profile.projects.map(p => p.id))
        }
    }, [isOpen, profile])

    const toggleProject = (projectId) => {
        if (selectedProjects.includes(projectId)) {
            setSelectedProjects(prev => prev.filter(id => id !== projectId))
        } else {
            if (selectedProjects.length >= 6) return
            setSelectedProjects(prev => [...prev, projectId])
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await preferencesApi.update({
                publicProfile: {
                    bio,
                    headline,
                    showcasedProjectIds: selectedProjects,
                    showSkills
                }
            })
            onUpdate()
            onClose()
        } catch (error) {
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0B0C15] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0B0C15]">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Edit2 size={20} className="text-purple-400" />
                        Edit Public Profile
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                    {/* Headline */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Headline</label>
                        <input
                            type="text"
                            value={headline}
                            onChange={(e) => setHeadline(e.target.value)}
                            placeholder="e.g. Full Stack Developer"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                        />
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                        />
                    </div>

                    {/* Show Skills Toggle */}
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-white/10">
                        <div className="flex items-center gap-3">
                            <Cpu className="text-blue-400" size={20} />
                            <div>
                                <h3 className="font-medium text-white">Show Verified Skills</h3>
                                <p className="text-xs text-gray-400">Display your top verified skills on your profile.</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={showSkills} onChange={(e) => setShowSkills(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    {/* Featured Projects Selection */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-gray-300">Featured Projects (Max 6)</label>
                            <span className="text-xs text-gray-400">{selectedProjects.length}/6 selected</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                            {projects.map((project) => {
                                const isSelected = selectedProjects.includes(project.id);
                                return (
                                    <div
                                        key={project.id}
                                        onClick={() => toggleProject(project.id)}
                                        className={`
                                            p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3
                                            ${isSelected
                                                ? 'bg-purple-500/20 border-purple-500/50'
                                                : 'bg-white/5 border-white/5 hover:border-white/10'}
                                        `}
                                    >
                                        <div className={`
                                            w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                                            ${isSelected ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400'}
                                        `}>
                                            {isSelected ? <Check size={16} /> : <div className="text-xs font-bold">{project.name.charAt(0)}</div>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                                {project.name}
                                            </h4>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-[#0B0C15] flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Changes
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}


// ==========================================
// WEB COMPONENT
// ==========================================
export default function PublicProfile() {
    const { username } = useParams()
    const { user: currentUser } = useUser()

    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState(null)
    const [error, setError] = useState(null)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [copied, setCopied] = useState(false)
    const [allProjects, setAllProjects] = useState([])
    const [isOwner, setIsOwner] = useState(false)

    const fetchProfile = async () => {
        try {
            setLoading(true)
            const response = await publicApi.getProfile(username)
            setProfile(response.data.data)

            // Check ownership logic could be here if we returned uid in public profile,
            // but usually we match username or verify against backend check.
            // Assuming simpler username check for now if githubUsername matches.
            // Or use an API that returns "isOwner".
            // For now, let's rely on effect below.
        } catch (err) {
            console.error('Error fetching profile:', err)
            setError(err.response?.data?.message || 'Profile not found')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (username) {
            fetchProfile()
        }
    }, [username])

    // Check ownership
    useEffect(() => {
        if (currentUser && profile) {
            // Check if current user's github username matches profile username
            // Note: This assumes currentUser has 'username' or 'externalAccounts' mapping to github.
            // Clerk 'user' object has 'username' if set, or we verify strictly.
            // Better: Compare IDs if available. Public profile doesn't expose ID usually.
            // Let's assume username match for this feature as it's a "Public Profile" driven by username.
            // Also user might have changed username.
            // A safer check:
            const isSameUser =
                currentUser.username === username ||
                currentUser.externalAccounts.some(acc => acc.username === username);

            setIsOwner(isSameUser);
        }
    }, [currentUser, profile, username])

    // Fetch all projcts for editing if owner
    useEffect(() => {
        if (isOwner && showEditModal && allProjects.length === 0) {
            const fetchProjects = async () => {
                try {
                    const res = await projectsApi.getAll()
                    setAllProjects(res.data.data.projects || [])
                } catch (e) {
                    console.error("Failed to fetch projects for edit", e)
                }
            }
            fetchProjects()
        }
    }, [isOwner, showEditModal])

    const handlePrint = () => {
        // Trigger confetti for fun before printing
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
        setTimeout(() => window.print(), 800)
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <X className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-200 mb-2">Profile Not Found</h1>
                <p className="text-slate-400 text-center max-w-md">{error || "The user you're looking for doesn't exist or is private."}</p>
                <Button variant="ghost" className="mt-6" onClick={() => window.location.href = '/'}>
                    Go Home
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30 overflow-hidden flex flex-col relative w-full">
            {/* Navbar */}
            <nav className="h-16 border-b border-white/10 bg-[#050505]/50 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 z-50 shrink-0 sticky top-0">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
                    <img src="/DevTrack.png" alt="DevTrack" className="h-8 md:h-10 w-auto object-contain" />
                </div>
                <div className="flex items-center gap-3">
                    {isOwner && (
                        <Button
                            variant="ghost"
                            className="hidden md:flex items-center gap-2 text-slate-400 hover:text-white"
                            onClick={() => setShowEditModal(true)}
                        >
                            <Edit2 size={16} />
                            <span>Edit Profile</span>
                        </Button>
                    )}
                    <Button
                        variant="primary"
                        size="sm"
                        className="flex items-center gap-2 shadow-lg shadow-purple-500/20"
                        onClick={() => setShowShareModal(true)}
                    >
                        <Share2 size={16} />
                        <span className="hidden md:inline">Share Profile</span>
                    </Button>
                    <button
                        onClick={handlePrint}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors print:hidden"
                        title="Download Resume"
                    >
                        <Download size={18} />
                    </button>
                </div>
            </nav>

            <div className="flex-1 min-h-0 flex flex-col lg:flex-row w-full max-w-[1920px] mx-auto overflow-hidden print:hidden">

                {/* LEFT: Identity & Info */}
                <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#0B0C15] flex flex-col h-auto lg:h-full z-10 overflow-hidden relative">
                    <div className="h-24 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-purple-900/20 relative shrink-0">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    </div>

                    <div className="px-6 relative -mt-10 flex-1 flex flex-col overflow-y-auto custom-scrollbar pb-6 overscroll-contain">
                        {/* Avatar & Name */}
                        <div className="flex flex-col md:flex-row gap-4 items-end mb-4 shrink-0">
                            <motion.div className="relative group shrink-0">
                                <img src={profile.avatarUrl} alt={profile.name} className="relative w-20 h-20 rounded-xl object-cover border-2 border-[#0a0a0a] shadow-2xl" />
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center animate-pulse">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>
                            </motion.div>
                            <div className="flex-1 pb-0.5 min-w-0">
                                <motion.h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight truncate">{profile.name}</motion.h1>
                                <motion.p className="text-sm font-medium text-purple-400 mb-1">{profile.headline || 'Full Stack Developer'}</motion.p>
                                <motion.p className="text-xs text-gray-400 max-w-2xl leading-relaxed line-clamp-3">{profile.bio}</motion.p>
                            </div>
                        </div>

                        {/* Location & Join Date */}
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-6 shrink-0">
                            {profile.location && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={12} className="text-gray-400" />
                                    {profile.location}
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-gray-400" />
                                Joined {new Date(profile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </div>
                        </div>

                        {/* Highlight Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-6 shrink-0">
                            {[
                                { label: 'Projects', value: profile.stats.totalProjects, icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                                { label: 'Total Commits', value: profile.stats.totalCommits.toLocaleString(), icon: GitCommit, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -2 }}
                                    className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center gap-3"
                                >
                                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                                        <stat.icon size={16} className={stat.color} />
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-white leading-none">{stat.value}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{stat.label}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Skills */}
                        {profile.verifiedSkills?.length > 0 && (
                            <div className="mb-6 shrink-0">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Cpu size={12} /> Top Skills
                                </h3>
                                <div className="flex flex-wrap gap-1.5 overflow-hidden">
                                    {profile.verifiedSkills.slice(0, 15).map((skill, i) => (
                                        <Badge
                                            key={i}
                                            variant={skill.verified ? "default" : "outline"}
                                            className={`text-[10px] py-0.5 px-2 ${skill.verified ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'text-gray-400 border-gray-700 bg-transparent'}`}
                                        >
                                            {skill.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resume Preview Mini */}
                        <div className="mt-auto pt-6 border-t border-white/5 shrink-0">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Resume Preview</h3>
                            <div
                                onClick={() => handlePrint()}
                                className="bg-white p-2 rounded-lg opacity-90 hover:opacity-100 transition-opacity cursor-pointer group relative overflow-hidden h-32 md:h-40"
                            >
                                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-[1px]">
                                    <span className="flex items-center gap-2 text-white font-medium bg-black/50 px-3 py-1.5 rounded-full text-xs">
                                        <ExternalLink size={12} /> View Full Resume
                                    </span>
                                </div>
                                <div className="w-full h-full bg-slate-50 rounded border border-slate-200 p-3 overflow-hidden text-[6px] text-slate-800 leading-tight select-none origin-top-left scale-[0.4] w-[250%] h-[250%] transform">
                                    {/* Mini Content Simulation */}
                                    <div className="font-bold text-2xl mb-2">{profile.name}</div>
                                    <div className="text-slate-500 text-lg mb-4">{profile.headline || 'Developer'}</div>
                                    <div className="space-y-2 opacity-50">
                                        <div className="h-2 bg-slate-300 rounded w-3/4"></div>
                                        <div className="h-2 bg-slate-300 rounded w-full"></div>
                                        <div className="h-2 bg-slate-300 rounded w-5/6"></div>
                                        <div className="h-2 bg-slate-300 rounded w-4/5"></div>
                                        <div className="h-2 bg-slate-300 rounded w-full"></div>
                                        <div className="h-2 bg-slate-300 rounded w-3/4"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Projects Showcase */}
                <div className="flex-1 bg-[#050505] flex flex-col min-h-0 overflow-hidden relative">
                    <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar overscroll-contain relative z-30 pointer-events-auto touch-pan-y">
                        <div className="max-w-5xl mx-auto space-y-8 pb-12">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                                    <Trophy className="text-yellow-500" size={24} />
                                    Featured Work
                                </h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent ml-4"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 md:gap-6">
                                {profile.projects.map((project, index) => (
                                    <motion.div
                                        key={project.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="group bg-[#0B0C15] border border-white/5 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/10 flex flex-col h-full"
                                    >
                                        <div className="h-32 bg-gradient-to-br from-[#13141f] to-[#0B0C15] relative p-6 flex flex-col justify-end">
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                {project.repositoryUrl && (
                                                    <a
                                                        href={project.repositoryUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 bg-black/50 backdrop-blur rounded-lg text-white/70 hover:text-white hover:bg-black/70 transition-all"
                                                    >
                                                        <Github size={16} />
                                                    </a>
                                                )}
                                                {project.demoUrl && (
                                                    <a
                                                        href={project.demoUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 bg-purple-500/20 backdrop-blur rounded-lg text-purple-300 hover:bg-purple-500/30 transition-all"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </a>
                                                )}
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg mb-2">
                                                {project.name.charAt(0)}
                                            </div>
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col">
                                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">{project.name}</h3>
                                            <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-1">{project.description}</p>

                                            <div className="flex flex-wrap gap-2 mt-auto">
                                                {project.technologies?.slice(0, 3).map((tech, i) => (
                                                    <span key={i} className="text-[10px] font-medium px-2 py-1 rounded-md bg-white/5 text-gray-300 border border-white/5">
                                                        {tech}
                                                    </span>
                                                ))}
                                                {(project.technologies?.length || 0) > 3 && (
                                                    <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-white/5 text-gray-500 border border-white/5">
                                                        +{project.technologies.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {profile.projects.length === 0 && (
                                <div className="text-center py-20 rounded-2xl border border-dashed border-white/10 bg-white/5">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                        <Code2 size={32} className="text-gray-500" />
                                    </div>
                                    <h3 className="text-lg font-medium text-white mb-1">No Public Projects Yet</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto text-sm">
                                        This user hasn't showcased any projects yet.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowShareModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0B0C15] w-full max-w-md rounded-2xl border border-white/10 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white">Share Profile</h3>
                                <button onClick={() => setShowShareModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="p-4 bg-white/5 rounded-xl flex items-center justify-between gap-4 border border-white/10">
                                    <code className="text-sm text-purple-300 truncate font-mono">
                                        {window.location.href}
                                    </code>
                                    <button
                                        onClick={handleCopyLink}
                                        className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors relative"
                                    >
                                        {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <a
                                        href={`https://twitter.com/intent/tweet?text=Check out my developer portfolio on DevTrack! 🚀&url=${encodeURIComponent(window.location.href)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 btn btn-secondary flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 font-medium transition-colors"
                                    >
                                        Twitter
                                    </a>
                                    <a
                                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                                        target="_blank"
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className="w-12 h-12 bg-white/5 group-hover:bg-white/10 rounded-full flex items-center justify-center transition-colors border border-white/10">
                                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs text-gray-400 group-hover:text-white">X</span>
                                    </a>

                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(`Check out ${profile?.name}'s developer profile on DevTrack! ${window.location.href}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className="w-12 h-12 bg-[#25D366]/10 group-hover:bg-[#25D366]/20 rounded-full flex items-center justify-center transition-colors border border-[#25D366]/20">
                                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#25D366]">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs text-gray-400 group-hover:text-white">WhatsApp</span>
                                    </a>

                                    <button
                                        onClick={() => window.location.href = `mailto:?subject=Check out this developer profile&body=${window.location.href}`}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className="w-12 h-12 bg-purple-500/10 group-hover:bg-purple-500/20 rounded-full flex items-center justify-center transition-colors border border-purple-500/20">
                                            <Mail size={20} className="text-purple-400" />
                                        </div>
                                        <span className="text-xs text-gray-400 group-hover:text-white">Email</span>
                                    </button>
                                </div>

                                {/* Copy Link */}
                                <div className="relative">
                                    <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Or copy link</h4>
                                    <div className="flex items-center gap-2 bg-black/50 border border-white/10 p-1.5 pl-4 rounded-xl">
                                        <div className="flex-1 text-sm text-gray-300 truncate font-mono">
                                            {window.location.href}
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(window.location.href)
                                                setCopied(true)
                                                setTimeout(() => setCopied(false), 2000)
                                            }}
                                            className={`
                                                p-2 rounded-lg transition-all flex items-center justify-center w-10 h-10
                                                ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/10 hover:bg-white/20 text-white'}
                                            `}
                                        >
                                            {copied ? <Check size={18} /> : <Copy size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <EditProfileModal
                        isOpen={showEditModal}
                        onClose={() => setShowEditModal(false)}
                        profile={profile}
                        projects={allProjects}
                        onUpdate={() => {
                            fetchProfile()
                            // Also refresh owner check or just rely on profile update
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Print View (Resume) */}
            <ResumeView profile={profile} />
        </div>
    )
}
