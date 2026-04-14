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
    Loader2,
    ShieldCheck,
    Heart
} from 'lucide-react'
import ProfessionalLoader from '../components/ui/ProfessionalLoader'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { publicApi, preferencesApi, projectsApi, socialApi } from '../services/api'
import ResumePaper from '../components/ResumePaper'
import confetti from 'canvas-confetti'
import { useUser } from '@clerk/clerk-react'

// ------------------------------------------
// THE SYNCED RESUME VIEW (For Print/PDF)
// ------------------------------------------
const ResumePrintView = ({ profile }) => {
    // If user has a saved resume from the builder, use it
    // Otherwise, generate a robust default from public profile data
    const resumeData = profile.resume || {
        basics: {
            name: profile.name,
            headline: profile.headline,
            summary: profile.bio,
            github: `github.com/${profile.username}`,
            location: profile.location || '',
            email: '',
            phone: '',
            website: `devtrack.app/u/${profile.username}`
        },
        experience: [],
        education: [],
        skills: [],
        achievements: [],
        selectedProjectIds: profile.projects.map(p => p.id),
        selectedSkillNames: profile.verifiedSkills.map(s => s.name),
        theme: { color: profile.accentColor || '#A855F7', font: 'font-sans' },
        template: 'modern',
        layoutOrder: ['summary', 'experience', 'projects', 'education', 'skills', 'achievements']
    };

    const resumeProjects = profile.resume?.projects || profile.projects;

    return (
        <div className="hidden print:block">
            <ResumePaper
                data={resumeData}
                projects={resumeProjects}
                verifiedSkills={profile.verifiedSkills}
                user={profile}
            />
        </div>
    );
};

// ==========================================
// EDIT PROFILE MODAL
// ==========================================
const EditProfileModal = ({ profile, projects, isOpen, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('info')
    const [bio, setBio] = useState(profile.bio || '')
    const [headline, setHeadline] = useState(profile.headline || '')
    const [theme, setTheme] = useState(profile.theme || 'default')
    const [accentColor, setAccentColor] = useState(profile.accentColor || '#A855F7')
    const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl || '')
    const [socials, setSocials] = useState(profile.socials || { twitter: '', linkedin: '', github: profile.username, website: '' })
    const [showSkills, setShowSkills] = useState(profile.verifiedSkills?.length > 0)
    const [selectedProjects, setSelectedProjects] = useState(
        profile.projects.map(p => p.id)
    )
    const [saving, setSaving] = useState(false)

    const [collaboration, setCollaboration] = useState(profile.social?.collaboration || { status: 'inactive', seekingStack: [], goal: '' })

    useEffect(() => {
        if (isOpen) {
            setBio(profile.bio || '')
            setHeadline(profile.headline || '')
            setTheme(profile.theme || 'default')
            setAccentColor(profile.accentColor || '#A855F7')
            setBannerUrl(profile.bannerUrl || '')
            setSocials(profile.socials || { twitter: '', linkedin: '', github: profile.username, website: '' })
            setShowSkills(profile.verifiedSkills?.length > 0)
            setSelectedProjects(profile.projects.map(p => p.id))
            setCollaboration(profile.social?.collaboration || { status: 'inactive', seekingStack: [], goal: '' })
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
                preferences: {
                    publicProfile: {
                        bio,
                        headline,
                        showcasedProjectIds: selectedProjects,
                        showSkills,
                        theme,
                        accentColor,
                        bannerUrl,
                        socials: {
                            ...socials,
                            github: profile.username // Ensure github handle is preserved
                        }
                    }
                }
            });

            // Update Social Zone Data
            await socialApi.updateCollaboration(collaboration);

            onUpdate()
            onClose()
        } catch (error) {
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    const themes = [
        { id: 'default', name: 'Classic', desc: 'Clean two-column layout' },
        { id: 'bento', name: 'Bento Grid', desc: 'Modern, balanced layout' },
        { id: 'minimal', name: 'Minimalist', desc: 'Focus on typography' }
    ]

    const colors = ['#A855F7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899']

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
                        Customise Profile
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-6 pt-2 gap-4 border-b border-white/5">
                    {['info', 'design', 'socials', 'networking'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-sm font-medium transition-all relative ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {activeTab === tab && (
                                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1" data-lenis-prevent="true">
                    {activeTab === 'info' && (
                        <div className="space-y-6">
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

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-300">Featured Projects (Max 6)</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2" data-lenis-prevent="true">
                                    {projects.map((project) => {
                                        const isSelected = selectedProjects.includes(project.id);
                                        return (
                                            <div
                                                key={project.id}
                                                onClick={() => toggleProject(project.id)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${isSelected ? 'bg-purple-500/20 border-purple-500/50' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                                                    {isSelected ? <Check size={16} /> : <div className="text-xs font-bold">{project.name.charAt(0)}</div>}
                                                </div>
                                                <h4 className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>{project.name}</h4>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'design' && (
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-sm font-medium text-gray-300">Layout Theme</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {themes.map((t) => (
                                        <div
                                            key={t.id}
                                            onClick={() => setTheme(t.id)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${theme === t.id ? 'bg-purple-500/20 border-purple-500/50' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                        >
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{t.name}</h4>
                                                <p className="text-xs text-gray-500">{t.desc}</p>
                                            </div>
                                            {theme === t.id && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-medium text-gray-300">Accent Color</label>
                                <div className="flex flex-wrap gap-3">
                                    {colors.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setAccentColor(c)}
                                            style={{ backgroundColor: c }}
                                            className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${accentColor === c ? 'scale-110 ring-4 ring-white/20' : 'hover:scale-105 opacity-80'}`}
                                        >
                                            {accentColor === c && <Check size={20} className="text-white" />}
                                        </button>
                                    ))}
                                    <input
                                        type="color"
                                        value={accentColor}
                                        onChange={(e) => setAccentColor(e.target.value)}
                                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 cursor-pointer overflow-hidden p-0"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-medium text-gray-300">Profile Banner</label>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={bannerUrl}
                                            onChange={(e) => setBannerUrl(e.target.value)}
                                            placeholder="https://image-url.com/banner.jpg"
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 transition-colors text-sm"
                                        />
                                        {bannerUrl && (
                                            <button
                                                onClick={() => setBannerUrl('')}
                                                className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {[
                                            { name: 'Abstract', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop' },
                                            { name: 'Dark', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop' },
                                            { name: 'Gradient', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop' },
                                            { name: 'Mesh', url: 'https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=1000&auto=format&fit=crop' },
                                        ].map((preset) => (
                                            <button
                                                key={preset.url}
                                                onClick={() => setBannerUrl(preset.url)}
                                                className={`h-12 rounded-lg border overflow-hidden relative group transition-all ${bannerUrl === preset.url ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-white/10 hover:border-white/20'}`}
                                            >
                                                <img src={preset.url} alt={preset.name} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white bg-black/40">{preset.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'socials' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Github size={14} className="text-gray-400" /> GitHub Username
                                </label>
                                <input
                                    type="text"
                                    value={socials.github}
                                    readOnly
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed opacity-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Globe size={14} className="text-gray-400" /> Website / Portfolio
                                </label>
                                <input
                                    type="text"
                                    value={socials.website || ''}
                                    onChange={(e) => setSocials({ ...socials, website: e.target.value })}
                                    placeholder="https://"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-gray-400">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    X (Twitter) Handle
                                </label>
                                <input
                                    type="text"
                                    value={socials.twitter || ''}
                                    onChange={(e) => setSocials({ ...socials, twitter: e.target.value })}
                                    placeholder="@username"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Briefcase size={14} className="text-gray-400" /> LinkedIn Profile
                                </label>
                                <input
                                    type="text"
                                    value={socials.linkedin || ''}
                                    onChange={(e) => setSocials({ ...socials, linkedin: e.target.value })}
                                    placeholder="linkedin.com/in/username"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'networking' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-white/10">
                                <div className="flex items-center gap-3">
                                    <Globe className="text-emerald-400" size={20} />
                                    <div>
                                        <h3 className="font-medium text-white">Open to Collaboration</h3>
                                        <p className="text-xs text-gray-400">Let other builders know you're looking for partners.</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={collaboration.status === 'active'}
                                        onChange={(e) => setCollaboration({ ...collaboration, status: e.target.checked ? 'active' : 'inactive' })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                            </div>

                            {collaboration.status === 'active' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">What are you looking to build?</label>
                                        <input
                                            type="text"
                                            value={collaboration.goal}
                                            onChange={(e) => setCollaboration({ ...collaboration, goal: e.target.value })}
                                            placeholder="e.g. Building an AI-powered SaaS"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-emerald-500 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Ideal Partner Stack (comma separated)</label>
                                        <input
                                            type="text"
                                            value={Array.isArray(collaboration.seekingStack) ? collaboration.seekingStack.join(', ') : (collaboration.seekingStack || '')}
                                            onChange={(e) => setCollaboration({ ...collaboration, seekingStack: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                            placeholder="e.g. React, Node.js, Python"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-emerald-500 transition-colors"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
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
// BENTO COMPONENTS
// ==========================================
const BentoCard = ({ children, className = '', title, icon: Icon, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={`bg-[#0B0C15]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 group hover:border-[var(--accent)]/30 transition-all duration-500 overflow-hidden relative ${className}`}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        {title && (
            <div className="flex items-center gap-2 mb-4 relative z-10">
                {Icon && <Icon size={16} className="text-[var(--accent)]" />}
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</h3>
            </div>
        )}
        <div className="relative z-10 h-full">{children}</div>
    </motion.div>
)

const SocialLink = ({ href, icon: Icon, label, platform }) => {
    if (!href) return null;

    // Normalize URL
    let url = href;
    if (!href.startsWith('http')) {
        const cleanHref = href.replace('@', '').trim();
        if (platform === 'twitter' && !href.includes('twitter.com') && !href.includes('x.com')) {
            url = `https://x.com/${cleanHref}`;
        } else if (platform === 'linkedin' && !href.includes('linkedin.com')) {
            url = `https://linkedin.com/in/${cleanHref}`;
        } else if (platform === 'github' && !href.includes('github.com')) {
            url = `https://github.com/${cleanHref}`;
        } else {
            url = `https://${href}`;
        }
    }

    return (
        <motion.a
            href={url}
            target="_blank"
            rel="noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-[var(--accent)]/30 text-gray-400 hover:text-white transition-all group"
        >
            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-[var(--accent)]/10 text-gray-400 group-hover:text-[var(--accent)] transition-colors">
                <Icon size={18} />
            </div>
            <span className="text-sm font-medium">{label}</span>
        </motion.a>
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
        } catch (err) {
            console.error('Error fetching profile:', err)
            setError(err.response?.data?.message || 'Profile not found')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (username) fetchProfile()
    }, [username])

    useEffect(() => {
        if (currentUser && profile) {
            const isSameUser =
                currentUser.username === username ||
                currentUser.externalAccounts.some(acc => acc.username === username);
            setIsOwner(isSameUser);
        }
    }, [currentUser, profile, username])

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

    useEffect(() => {
        if (profile?.accentColor) {
            document.documentElement.style.setProperty('--accent', profile.accentColor);
        } else {
            document.documentElement.style.setProperty('--accent', '#A855F7');
        }
    }, [profile])

    const handlePrint = () => {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => window.print(), 800)
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const handleVouch = async (projectId) => {
        if (!user) {
            alert("Please sign in to vouch for this project!");
            return;
        }
        if (isOwner) {
            alert("You cannot vouch for your own projects.");
            return;
        }

        try {
            const res = await socialApi.vouch({
                toUid: profile.id,
                projectId,
                category: 'Proof of Work'
            });

            if (res.data.action === 'added') {
                confetti({
                    particleCount: 50,
                    spread: 40,
                    origin: { y: 0.8 },
                    colors: [profile.accentColor || '#A855F7', '#ffffff']
                });
            }

            fetchProfile(); // Refresh to get updated endorsements
        } catch (e) {
            console.error("Vouch failed", e);
            alert(e.response?.data?.error || "Failed to vouch");
        }
    }

    if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><ProfessionalLoader /></div>
    if (error || !profile) return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 text-slate-400 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4"><X className="text-red-500" /></div>
            <h1 className="text-xl font-bold text-white mb-2">Profile Not Found</h1>
            <p className="max-w-md mb-6">{error || "The user you're looking for doesn't exist."}</p>
            <Button variant="ghost" onClick={() => window.location.href = '/'}>Go Home</Button>
        </div>
    )

    const renderBentoLayout = () => (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-max">
            {/* 1. IDENTITY CARD */}
            <BentoCard className="md:col-span-8 lg:col-span-8 p-0" delay={0.1}>
                <div className="h-32 relative overflow-hidden">
                    {profile.bannerUrl ? (
                        <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-r from-[var(--accent)]/20 via-blue-900/10 to-[var(--accent)]/20"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent opacity-60"></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                </div>
                <div className="px-8 pb-8 relative">
                    <div className="relative -mt-10 flex flex-col md:flex-row gap-6 items-end group">
                        <motion.img
                            src={profile.avatarUrl}
                            alt={profile.name}
                            className="w-24 h-24 rounded-3xl object-cover border-4 border-[#050505] shadow-2xl relative z-10"
                        />
                        <div className="pb-2">
                            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{profile.name}</h1>
                            <p className="text-[var(--accent)] font-medium text-lg">{profile.headline}</p>
                        </div>
                    </div>
                    <p className="mt-6 text-gray-400 leading-relaxed max-w-3xl text-sm md:text-base italic">"{profile.bio}"</p>
                    <div className="flex flex-wrap gap-4 mt-6 text-xs text-gray-500">
                        {profile.location && <div className="flex items-center gap-1.5"><MapPin size={12} /> {profile.location}</div>}
                        <div className="flex items-center gap-1.5"><Calendar size={12} /> Shipped since {new Date(profile.joinDate).getFullYear()}</div>
                    </div>
                </div>
            </BentoCard>

            {/* 2. STATS CARD */}
            <BentoCard className="md:col-span-4 lg:col-span-4" title="Impact" icon={Trophy} delay={0.2}>
                <div className="grid grid-cols-1 gap-6 h-full justify-center py-4">
                    <div className="text-center group/stat">
                        <div className="text-4xl font-black text-white group-hover:text-[var(--accent)] transition-colors">{profile.stats.totalProjects}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Live Projects</div>
                    </div>
                    <div className="h-px bg-white/5 w-full"></div>
                    <div className="text-center group/stat">
                        <div className="text-4xl font-black text-white group-hover:text-[var(--accent)] transition-colors">{profile.stats.totalCommits.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Total Commits</div>
                    </div>
                </div>
            </BentoCard>

            {/* 3. SKILLS CARD */}
            <BentoCard className="md:col-span-4 lg:col-span-3" title="Tech Stack" icon={Cpu} delay={0.3}>
                <div className="flex flex-wrap gap-2">
                    {profile.verifiedSkills.slice(0, 12).map((skill, i) => (
                        <span key={i} className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-all ${skill.verified ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20' : 'bg-white/5 text-gray-400 border border-white/5'}`}>
                            {skill.name}
                        </span>
                    ))}
                </div>
            </BentoCard>

            {/* 4. SOCIALS CARD */}
            <BentoCard className="md:col-span-8 lg:col-span-4" title="Connect" icon={Share2} delay={0.4}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SocialLink href={profile.socials.github ? `github.com/${profile.socials.github}` : null} icon={Github} label="GitHub" platform="github" />
                    <SocialLink href={profile.socials.twitter} icon={props => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>)} label="X / Twitter" platform="twitter" />
                    <SocialLink href={profile.socials.linkedin} icon={Briefcase} label="LinkedIn" platform="linkedin" />
                    <SocialLink href={profile.socials.website} icon={Globe} label="Website" platform="website" />
                </div>
            </BentoCard>

            {/* 5. RESUME MINI */}
            <BentoCard className="md:col-span-12 lg:col-span-5 p-0 bg-white group/resume overflow-hidden" delay={0.5}>
                <div onClick={handlePrint} className="h-full min-h-[160px] cursor-pointer relative flex flex-col items-center justify-center p-8 text-slate-900 overflow-hidden">
                    <div className="absolute inset-0 bg-slate-900 group-hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center z-20 backdrop-blur-sm">
                        <span className="flex items-center gap-2 text-white font-bold bg-white/10 px-6 py-3 rounded-full border border-white/20">
                            <Download size={18} /> Download Verified Resume
                        </span>
                    </div>
                    <div className="text-center relative z-10">
                        <div className="text-2xl font-black uppercase tracking-tighter mb-1">Interactive Resume</div>
                        <div className="text-xs text-slate-500 font-medium">Click to generate PDF • {profile.name}</div>
                    </div>
                    {/* Simulated resume lines */}
                    <div className="absolute inset-x-0 bottom-4 px-8 space-y-2 opacity-5 scale-150">
                        <div className="h-2 bg-slate-900 rounded w-full"></div>
                        <div className="h-2 bg-slate-900 rounded w-5/6"></div>
                        <div className="h-2 bg-slate-900 rounded w-full"></div>
                    </div>
                </div>
            </BentoCard>

            {/* 7. COLLABORATION CARD */}
            {profile.social?.collaboration?.status === 'active' && (
                <BentoCard className="md:col-span-12 lg:col-span-7 bg-emerald-500/5 border-emerald-500/20" title="Collaboration" icon={Globe} delay={0.6}>
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                            <Plus className="text-emerald-400 rotate-45" size={32} />
                        </div>
                        <div className="text-center md:text-left">
                            <h4 className="text-lg font-bold text-white mb-1">Open to Build</h4>
                            <p className="text-emerald-400 text-sm font-medium mb-4 leading-relaxed line-clamp-2">{profile.social.collaboration.goal || "Looking for partners for the next big thing."}</p>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                {profile.social.collaboration.seekingStack?.map((skill, i) => (
                                    <span key={i} className="text-[10px] uppercase tracking-wider font-bold px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </BentoCard>
            )}

            {/* 6. PROJECTS - FULL WIDTH GRID */}
            <div className="md:col-span-12 mt-8">
                <div className="flex items-center gap-4 mb-8 px-2">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Trophy className="text-yellow-500" /> Featured Work
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profile.projects.map((project, i) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + (i * 0.1) }}
                            className="bg-[#0B0C15]/50 border border-white/5 rounded-3xl p-6 hover:border-[var(--accent)]/30 transition-all duration-300 group shadow-2xl relative"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-white/5">
                                    {project.name.charAt(0)}
                                </div>
                                <div className="flex gap-2">
                                    {project.repositoryUrl && <a href={project.repositoryUrl} target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"><Github size={16} /></a>}
                                    {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noreferrer" className="p-2 bg-[var(--accent)]/20 rounded-xl text-[var(--accent)] hover:bg-[var(--accent)]/30 transition-all"><ExternalLink size={16} /></a>}
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[var(--accent)] transition-colors">{project.name}</h3>
                            <p className="text-sm text-gray-400 line-clamp-3 mb-6 leading-relaxed flex-1">{project.description}</p>

                            {/* Social / Vouch Section */}
                            <div className="flex items-center justify-between mb-6 pt-4 border-t border-white/5">
                                <div className="flex -space-x-2">
                                    {(profile.endorsements || [])
                                        .filter(e => e.projectId === project.id)
                                        .slice(0, 3)
                                        .map((endorsement, idx) => (
                                            <div
                                                key={idx}
                                                className="w-7 h-7 rounded-full border-2 border-[#0B0C15] overflow-hidden bg-gray-800"
                                                title={`${endorsement.endorser?.name} vouched for this`}
                                            >
                                                <img
                                                    src={endorsement.endorser?.avatarUrl || `https://ui-avatars.com/api/?name=${endorsement.endorser?.name}`}
                                                    alt="Endorser"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))
                                    }
                                    {(profile.endorsements || []).filter(e => e.projectId === project.id).length > 3 && (
                                        <div className="w-7 h-7 rounded-full border-2 border-[#0B0C15] bg-gray-800 flex items-center justify-center text-[10px] text-gray-400 font-bold">
                                            +{(profile.endorsements || []).filter(e => e.projectId === project.id).length - 3}
                                        </div>
                                    )}
                                    {(profile.endorsements || []).filter(e => e.projectId === project.id).length === 0 && (
                                        <span className="text-[10px] text-gray-600 italic pl-2">No vouches yet</span>
                                    )}
                                </div>

                                {!isOwner && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleVouch(project.id);
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${(profile.endorsements || []).some(e => e.projectId === project.id && e.fromUid === (user?.id))
                                            ? 'bg-[var(--accent)] text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                                            }`}
                                    >
                                        <ShieldCheck size={14} />
                                        {(profile.endorsements || []).some(e => e.projectId === project.id && e.fromUid === (user?.id)) ? 'Vouched' : 'Vouch'}
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 mt-auto">
                                {project.technologies?.slice(0, 3).map((tech, i) => (
                                    <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-gray-400 border border-white/5">{tech}</span>
                                ))}
                                {project.technologies?.length > 3 && <span className="text-[10px] text-gray-600">+{project.technologies.length - 3}</span>}
                            </div>
                        </motion.div>
                    ))}
                    {profile.projects.length === 0 && (
                        <div className="md:col-span-3 text-center py-20 rounded-3xl border border-dashed border-white/10 bg-white/5">
                            <Code2 size={40} className="text-gray-600 mx-auto mb-4" />
                            <h3 className="text-white font-bold">No Projects Showcased</h3>
                            <p className="text-gray-500 text-sm">Update profile to select projects to display.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[var(--accent)]/30 overflow-x-hidden flex flex-col relative w-full">
            <style>{`
                :root { --accent: #A855F7; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--accent); }
            `}</style>

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
                        className="flex items-center gap-2 shadow-xl shadow-[var(--accent)]/10"
                        style={{ backgroundColor: isOwner ? 'var(--accent)' : undefined }}
                        onClick={() => setShowShareModal(true)}
                    >
                        <Share2 size={16} />
                        <span className="hidden md:inline">Share Profile</span>
                    </Button>
                    <button onClick={handlePrint} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors print:hidden">
                        <Download size={18} />
                    </button>
                </div>
            </nav>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {profile.theme === 'minimal' ? (
                    <div className="max-w-4xl mx-auto py-20 px-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h1 className="text-6xl font-black mb-4 tracking-tighter">{profile.name}</h1>
                            <p className="text-2xl text-[var(--accent)] mb-8 font-light tracking-tight">{profile.headline}</p>
                            <p className="text-xl text-gray-500 mb-20 leading-relaxed font-light italic">"{profile.bio}"</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-20">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">Works</h3>
                                    <div className="space-y-12">
                                        {profile.projects.map(p => (
                                            <div key={p.id} className="group cursor-pointer">
                                                <h4 className="text-xl font-bold group-hover:text-[var(--accent)] transition-colors">{p.name}</h4>
                                                <p className="text-gray-500 text-sm mt-2">{p.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">Capabilities</h3>
                                    <div className="flex flex-wrap gap-4">
                                        {profile.verifiedSkills.map(s => (
                                            <span key={s.name} className="text-lg font-light text-gray-400">{s.name} •</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : renderBentoLayout()}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showShareModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-[#0B0C15] w-full max-w-md rounded-2xl border border-white/10 p-6" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold">Share Profile</h3>
                                <button onClick={() => setShowShareModal(false)}><X size={20} /></button>
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-2 rounded-xl mb-6">
                                <code className="text-xs text-[var(--accent)] truncate flex-1 ml-2 font-mono">{window.location.href}</code>
                                <button onClick={handleCopyLink} className="p-2 hover:bg-white/10 rounded-lg text-white">
                                    {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium">Twitter</a>
                                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium">LinkedIn</a>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                {showEditModal && (
                    <EditProfileModal
                        isOpen={showEditModal}
                        onClose={() => setShowEditModal(false)}
                        profile={profile}
                        projects={allProjects}
                        onUpdate={fetchProfile}
                    />
                )}
            </AnimatePresence>

            {/* Print View */}
            <ResumePrintView profile={profile} />
        </div>
    )
}
