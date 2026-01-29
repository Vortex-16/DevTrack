import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
    Save,
    Download,
    Plus,
    Trash2,
    GripVertical,
    ChevronDown,
    ChevronUp,
    FileText,
    Briefcase,
    GraduationCap,
    Code2,
    Terminal,
    MapPin,
    Mail,
    Globe,
    Linkedin,
    Phone,
    Github,
    CheckCircle2,
    Trophy,
    Link as LinkIcon,
    Sparkles,
    Loader2
} from 'lucide-react'
import ProfessionalLoader from '../components/ui/ProfessionalLoader'
import { resumeApi, projectsApi, authApi } from '../services/api'
import confetti from 'canvas-confetti'

// ==========================================
// PREVIEW COMPONENT (The "God Level" Resume)
// A4 Scaled CSS
// ==========================================
const ResumePaper = ({ data, projects, verifiedSkills = [] }) => {
    return (
        <div id="resume-preview" className="relative bg-white text-slate-800 w-[210mm] min-h-[297mm] p-0 shadow-2xl mx-auto origin-top transform scale-[0.6] lg:scale-[0.75] xl:scale-[0.85] transition-transform duration-300 print:transform-none print:scale-100 print:shadow-none print:m-0 print:w-full print:h-auto font-sans overflow-hidden">

            {/* Visual Page Break Guide (Screen Only) */}
            <div className="absolute top-[297mm] left-0 w-full border-b-2 border-red-400 border-dashed opacity-50 pointer-events-none print:hidden z-50 flex items-end justify-end pr-2 pb-1">
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-white/80 px-1 rounded">End of Page 1</span>
            </div>

            {/* Header Block (Full Width) */}
            <header className="px-10 py-10 border-b-4 border-slate-900 mb-8 bg-slate-50 print:break-inside-avoid">
                <h1 className="text-5xl font-extrabold uppercase tracking-tight mb-2 text-slate-900">
                    {data.basics.name}
                </h1>
                <p className="text-xl text-slate-600 font-medium tracking-wide mb-6">
                    {data.basics.headline || "Full Stack Developer"}
                </p>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
                    {data.basics.email && (
                        <a href={`mailto:${data.basics.email}`} className="flex items-center gap-2 hover:text-cyan-600 transition-colors">
                            <Mail size={16} className="text-slate-900" /> {data.basics.email}
                        </a>
                    )}
                    {data.basics.phone && (
                        <a href={`tel:${data.basics.phone}`} className="flex items-center gap-2 hover:text-cyan-600 transition-colors">
                            <Phone size={16} className="text-slate-900" /> {data.basics.phone}
                        </a>
                    )}
                    {data.basics.location && (
                        <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-slate-900" /> {data.basics.location}
                        </div>
                    )}
                    {data.basics.linkedin && (
                        <a
                            href={data.basics.linkedin.startsWith('http') ? data.basics.linkedin : `https://${data.basics.linkedin}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 hover:text-cyan-600 transition-colors"
                        >
                            <Linkedin size={16} className="text-slate-900" /> {data.basics.linkedin.replace(/^https?:\/\//, '')}
                        </a>
                    )}
                    {data.basics.github && (
                        <a
                            href={data.basics.github.startsWith('http') ? data.basics.github : `https://${data.basics.github}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 hover:text-cyan-600 transition-colors"
                        >
                            <Github size={16} className="text-slate-900" /> {data.basics.github.replace(/^https?:\/\//, '')}
                        </a>
                    )}
                    {data.basics.website && (
                        <a
                            href={data.basics.website.startsWith('http') ? data.basics.website : `https://${data.basics.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 hover:text-cyan-600 transition-colors"
                        >
                            <Globe size={16} className="text-slate-900" /> {data.basics.website.replace(/^https?:\/\//, '')}
                        </a>
                    )}
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-8 px-10 pb-10 min-h-[800px] print:block print:px-8">

                {/* LEFT COLUMN (Span 4) - Float for Print */}
                <div className="col-span-4 space-y-8 pr-6 border-r border-slate-200 relative print:w-[32%] print:float-left print:pr-4 print:border-r-2 print:border-slate-200">

                    {/* Education */}
                    {data.education.length > 0 && (
                        <section className="print:break-inside-avoid">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-2">
                                Education
                            </h3>
                            <div className="space-y-4">
                                {data.education.map((edu, i) => (
                                    <div key={i}>
                                        <h4 className="font-bold text-slate-900">{edu.school}</h4>
                                        <div className="text-sm text-slate-700">{edu.degree}</div>
                                        <div className="text-xs font-medium text-slate-500 mt-1">{edu.year}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Verified Skills */}
                    {(data.selectedSkillNames.length > 0 || data.skills.length > 0) && (
                        <section className="print:break-inside-avoid">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-2">
                                Verified Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {data.selectedSkillNames.map(name => (
                                    <span key={name} className="font-semibold text-slate-800 text-sm border-b border-slate-200 pb-0.5">
                                        {name}
                                    </span>
                                ))}
                            </div>

                            {/* Manual Skills */}
                            {data.skills.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Additional</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {data.skills.map((skill, i) => (
                                            <span key={i} className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Achievements */}
                    {data.achievements && data.achievements.length > 0 && (
                        <section className="print:break-inside-avoid">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-2">
                                Achievements
                            </h3>
                            <ul className="space-y-3">
                                {(data.achievements || []).map((achievement, i) => (
                                    <li key={i} className="text-sm text-slate-700 leading-relaxed font-medium">
                                        • {typeof achievement === 'string' ? achievement : achievement.text}
                                        {typeof achievement === 'object' && achievement.url && (
                                            <a
                                                href={achievement.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-cyan-600 hover:text-cyan-500 inline-block align-middle ml-1 relative -top-[1px] print:inline-block"
                                                title="View Credential"
                                            >
                                                <LinkIcon size={12} />
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>

                {/* RIGHT COLUMN (Span 8) - Float for Print */}
                <div className="col-span-8 space-y-8 print:w-[65%] print:float-right print:pl-4">

                    {/* Summary */}
                    {data.basics.summary && (
                        <section className="print:break-inside-avoid">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-2">
                                Professional Profile
                            </h3>
                            <p className="text-sm leading-relaxed text-slate-700 text-justify">
                                {data.basics.summary}
                            </p>
                        </section>
                    )}

                    {/* Experience */}
                    {data.experience.length > 0 && (
                        <section>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 border-b border-slate-200 pb-2">
                                Experience
                            </h3>
                            <div className="space-y-6">
                                {data.experience.map((exp, i) => (
                                    <div key={i} className="group print:break-inside-avoid">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="text-lg font-bold text-slate-900">{exp.role}</h4>
                                            <span className="text-sm font-medium text-slate-500 ml-4">{exp.startDate} – {exp.endDate}</span>
                                        </div>
                                        <div className="text-sm font-semibold text-slate-600 mb-2">{exp.company}</div>
                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line pl-1 border-l-2 border-slate-100">
                                            {exp.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Verified Projects */}
                    {projects.length > 0 && (
                        <section>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 border-b border-slate-200 pb-2 flex items-center justify-between">
                                <span>Proof of Work</span>
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-medium flex items-center gap-1">
                                    <CheckCircle2 size={10} /> Verified by DevTrack
                                </span>
                            </h3>

                            <div className="space-y-8">
                                {projects.map((proj) => (
                                    <div key={proj.id} className="relative pl-4 border-l-2 border-slate-200 print:break-inside-avoid">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <h4 className="text-lg font-bold text-slate-900">{proj.name}</h4>
                                            <div className="flex gap-2">
                                                {proj.technologies && (
                                                    <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                                        {proj.technologies.slice(0, 3).join(' • ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-justify text-sm text-slate-700 leading-relaxed mb-3">
                                            {proj.description}
                                        </p>

                                        <div className="flex gap-4 text-xs font-medium text-slate-500">
                                            {proj.repositoryUrl && (
                                                <a href={proj.repositoryUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-cyan-600 transition-colors">
                                                    <Github size={12} /> Source Available
                                                </a>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Code2 size={12} /> {proj.userCommits || proj.commits || 0} Commits
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    )
}

// ==========================================
// MAIN BUILDER PAGE
// ==========================================
export default function ResumeBuilder() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [generatingSummary, setGeneratingSummary] = useState(false)
    const [activeTab, setActiveTab] = useState('basics') // basics, experience, education, projects, skills

    // Core Data State
    const [resumeData, setResumeData] = useState({
        basics: { name: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '', summary: '' },
        experience: [],
        education: [],
        skills: [],
        achievements: [], // New Achievements array
        selectedProjectIds: [],
        selectedSkillNames: [],
    })



    // Context Data (Available Projects/Skills)
    const [availableProjects, setAvailableProjects] = useState([])
    const [availableVerifiedSkills, setAvailableVerifiedSkills] = useState([])

    // Hydrated Projects for Preview
    const [previewProjects, setPreviewProjects] = useState([])

    useEffect(() => {
        loadData()
    }, [])

    // Hydrate preview projects when selected IDs change - RESPECT ORDER
    useEffect(() => {
        if (availableProjects.length > 0) {
            // Map selected IDs to project objects to preserve order
            const hydration = resumeData.selectedProjectIds
                .map(id => availableProjects.find(p => p.id === id))
                .filter(Boolean); // Remove any undefined (deleted projects)
            setPreviewProjects(hydration)
        }
    }, [resumeData.selectedProjectIds, availableProjects])

    const loadData = async () => {
        try {
            setLoading(true)

            // Parallel fetches
            const [resumeRes, projectsRes, userRes] = await Promise.all([
                resumeApi.get(),
                projectsApi.getAll({ limit: 100 }), // Fetch all (or at least 100)
                authApi.getMe()
            ])

            // 1. Setup Resume Data
            // 1. Setup Resume Data
            const backendData = resumeRes.data.data

            // Initialize Achievements with migration (String -> Object)
            if (!backendData.achievements) {
                backendData.achievements = [];
            } else {
                // Determine if migration is needed (if any element is a string)
                backendData.achievements = backendData.achievements.map(a =>
                    typeof a === 'string' ? { text: a, url: '' } : a
                );
            }

            // Ensure basics are populated if empty (First time load or missing fields)
            if (!backendData.basics.name) backendData.basics.name = userRes.data.user.name || ''
            if (!backendData.basics.email) backendData.basics.email = userRes.data.user.email || ''
            if (!backendData.basics.location) backendData.basics.location = userRes.data.user.location || ''

            // Auto-generate Headline if missing
            if (!backendData.basics.headline) {
                // Try to guess from top Verified Skill or default
                const topSkill = userRes.data.user.verifiedSkills?.[0]?.name;
                backendData.basics.headline = topSkill ? `${topSkill} Developer` : "Full Stack Developer";
            }

            // Auto-generate Headline if missing
            if (!backendData.basics.headline) {
                // Try to guess from top Verified Skill or default
                const topSkill = userRes.data.user.verifiedSkills?.[0]?.name;
                backendData.basics.headline = topSkill ? `${topSkill} Developer` : "Full Stack Developer";
            }

            // Auto-fill Socials if missing in Resume but present in User Profile
            if (!backendData.basics.linkedin && userRes.data.user.socials?.linkedin) {
                backendData.basics.linkedin = userRes.data.user.socials.linkedin
            }
            if (!backendData.basics.github) {
                if (userRes.data.user.githubUsername) {
                    backendData.basics.github = `github.com/${userRes.data.user.githubUsername}`;
                } else if (userRes.data.user.socials?.github) {
                    backendData.basics.github = userRes.data.user.socials.github;
                }
            }

            // 2. Setup Available Projects (Verified sources)
            const projects = projectsRes.data.data.projects || []

            // SORTING: Rank by Impact (Stars > Forks > User Commits)
            const sortedProjects = [...projects].sort((a, b) => {
                const commitsA = a.userCommits || a.commits || 0;
                const commitsB = b.userCommits || b.commits || 0;

                const scoreA = ((a.githubData?.stars || 0) * 2) + ((a.githubData?.forks || 0) * 3) + (commitsA * 0.1);
                const scoreB = ((b.githubData?.stars || 0) * 2) + ((b.githubData?.forks || 0) * 3) + (commitsB * 0.1);
                return scoreB - scoreA;
            });

            setAvailableProjects(sortedProjects)

            // Auto-select top projects if none selected
            if ((!backendData.selectedProjectIds || backendData.selectedProjectIds.length === 0) && sortedProjects.length > 0) {
                // Auto-select top 3 projects from the sorted list
                const topProjects = sortedProjects.slice(0, 3).map(p => p.id);
                backendData.selectedProjectIds = topProjects;
            }

            // 3. Setup Available Skills (Calculated from available projects for accuracy)
            let validVerifiedSkills = [];
            const userVerifiedSkills = userRes.data.user.verifiedSkills || [];

            // Always calculate counts from current project list to ensure proficiency dots are accurate
            if (projects.length > 0) {
                const skillCounts = {};
                projects.forEach(p => {
                    if (p.technologies && Array.isArray(p.technologies)) {
                        p.technologies.forEach(tech => {
                            skillCounts[tech] = (skillCounts[tech] || 0) + 1;
                        });
                    }
                });

                validVerifiedSkills = Object.entries(skillCounts)
                    .map(([name, count]) => ({
                        name,
                        count,
                        verified: true // Derived from verified projects
                    }))
                    .sort((a, b) => b.count - a.count);
            } else if (userVerifiedSkills.length > 0) {
                // Fallback to DB skills if no projects (unlikely in this flow but safe)
                validVerifiedSkills = userVerifiedSkills.filter(s => s.verified);
            }

            setAvailableVerifiedSkills(validVerifiedSkills)

            // Auto-select verified skills if none selected
            if ((!backendData.selectedSkillNames || backendData.selectedSkillNames.length === 0) && validVerifiedSkills.length > 0) {
                const verifiedNames = validVerifiedSkills.map(s => s.name);
                backendData.selectedSkillNames = verifiedNames;
            }

            setResumeData(backendData)

        } catch (error) {
            console.error('Failed to load builder:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            // 1. Save to Database (Primary)
            await resumeApi.save(resumeData)

            // 2. Save to Local Storage (Backup/Offline)
            localStorage.setItem('devtrack_resume_backup', JSON.stringify({
                ...resumeData,
                savedAt: new Date().toISOString()
            }));

            confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.9 },
                colors: ['#22d3ee', '#ffffff'] // cyan & white
            })
        } catch (error) {
            console.error('Save failed:', error)

            // Fallback: Save to Local Storage on network error
            try {
                localStorage.setItem('devtrack_resume_backup', JSON.stringify({
                    ...resumeData,
                    savedAt: new Date().toISOString(),
                    offline: true
                }));
                alert("Network error. Saved locally to browser storage.");
            } catch (storageErr) {
                console.error("Local storage failed:", storageErr);
            }

        } finally {
            setSaving(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const handleGenerateSummary = async () => {
        try {
            setGeneratingSummary(true)
            const response = await resumeApi.generateSummary({
                experience: resumeData.experience
            })

            if (response.data.success) {
                updateBasics('summary', response.data.data.summary)
                confetti({
                    particleCount: 50,
                    spread: 40,
                    origin: { x: 0.2, y: 0.5 },
                    colors: ['#A855F7', '#ffffff'] // purple & white
                })
            }
        } catch (error) {
            console.error('Failed to generate summary:', error)
        } finally {
            setGeneratingSummary(false)
        }
    }

    // --- Form Handlers ---

    const updateBasics = (field, value) => {
        setResumeData(prev => ({
            ...prev,
            basics: { ...prev.basics, [field]: value }
        }))
    }

    const addExperience = () => {
        setResumeData(prev => ({
            ...prev,
            experience: [...prev.experience, { company: '', role: '', startDate: '', endDate: '', description: '' }]
        }))
    }

    const updateExperience = (index, field, value) => {
        const newExp = [...resumeData.experience]
        newExp[index][field] = value
        setResumeData(prev => ({ ...prev, experience: newExp }))
    }

    const removeExperience = (index) => {
        setResumeData(prev => ({
            ...prev,
            experience: prev.experience.filter((_, i) => i !== index)
        }))
    }

    const addEducation = () => {
        setResumeData(prev => ({
            ...prev,
            education: [...prev.education, { school: '', degree: '', year: '' }]
        }))
    }

    const updateEducation = (index, field, value) => {
        const newEdu = [...resumeData.education]
        newEdu[index][field] = value
        setResumeData(prev => ({ ...prev, education: newEdu }))
    }

    const removeEducation = (index) => {
        setResumeData(prev => ({
            ...prev,
            education: prev.education.filter((_, i) => i !== index)
        }))
    }

    const toggleProject = (projectId) => {
        setResumeData(prev => {
            const current = prev.selectedProjectIds
            if (current.includes(projectId)) {
                return { ...prev, selectedProjectIds: current.filter(id => id !== projectId) }
            } else {
                if (current.length >= 5) return prev; // Limit to 5
                return { ...prev, selectedProjectIds: [...current, projectId] }
            }
        })
    }

    const toggleSkill = (skillName) => {
        setResumeData(prev => {
            const current = prev.selectedSkillNames
            if (current.includes(skillName)) {
                return { ...prev, selectedSkillNames: current.filter(s => s !== skillName) }
            } else {
                return { ...prev, selectedSkillNames: [...current, skillName] }
            }
        })
    }

    const updateCustomSkills = (value) => {
        const skillsArray = value.split(',').map(s => s.trim()).filter(Boolean)
        setResumeData(prev => ({ ...prev, skills: skillsArray }))
    }


    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><ProfessionalLoader /></div>

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex font-inter overflow-hidden">

            {/* LEFT SIDEBAR (Controls) */}
            <div className="w-full md:w-[500px] flex flex-col border-r border-slate-800 bg-slate-950 h-screen z-10 print:hidden shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <FileText className="text-cyan-400" size={20} />
                        <h1 className="font-bold">Resume Builder</h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                        >
                            <Save size={18} />
                        </button>
                        <button
                            onClick={handlePrint}
                            className="p-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white transition-colors"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                {/* Content Editor */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                    {/* Basics */}
                    <div className="space-y-4">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Briefcase size={12} /> Basics
                        </h2>
                        <div className="space-y-3">
                            <input
                                placeholder="Full Name"
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none transition-colors"
                                value={resumeData.basics.name}
                                onChange={(e) => updateBasics('name', e.target.value)}
                            />
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Professional Title</label>
                                <input
                                    placeholder="e.g. Senior React Developer"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none transition-colors"
                                    value={resumeData.basics.headline || ''}
                                    onChange={(e) => updateBasics('headline', e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <textarea
                                    placeholder="Professional Summary (2-3 sentences)"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm h-24 focus:border-cyan-500 outline-none transition-colors resize-none pr-10"
                                    value={resumeData.basics.summary}
                                    onChange={(e) => updateBasics('summary', e.target.value)}
                                />
                                <button
                                    onClick={handleGenerateSummary}
                                    disabled={generatingSummary}
                                    className="absolute bottom-2 right-2 p-1.5 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-md text-white shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                    title="Generate with AI"
                                >
                                    {generatingSummary ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Sparkles size={14} className="group-hover:text-yellow-200 transition-colors" />
                                    )}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    placeholder="Email"
                                    className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none"
                                    value={resumeData.basics.email}
                                    onChange={(e) => updateBasics('email', e.target.value)}
                                />
                                <input
                                    placeholder="Phone"
                                    className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none"
                                    value={resumeData.basics.phone}
                                    onChange={(e) => updateBasics('phone', e.target.value)}
                                />
                                <input
                                    placeholder="Location"
                                    className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none"
                                    value={resumeData.basics.location}
                                    onChange={(e) => updateBasics('location', e.target.value)}
                                />
                                <input
                                    placeholder="LinkedIn URL"
                                    className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none"
                                    value={resumeData.basics.linkedin}
                                    onChange={(e) => updateBasics('linkedin', e.target.value)}
                                />
                                <input
                                    placeholder="GitHub URL"
                                    className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none"
                                    value={resumeData.basics.github}
                                    onChange={(e) => updateBasics('github', e.target.value)}
                                />
                                <input
                                    placeholder="Portfolio / Website"
                                    className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none"
                                    value={resumeData.basics.website || ''}
                                    onChange={(e) => updateBasics('website', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Experience */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Briefcase size={12} /> Work Experience
                            </h2>
                            <button onClick={addExperience} className="text-cyan-400 hover:text-cyan-300 p-1">
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="space-y-6">
                            {resumeData.experience.map((exp, i) => (
                                <div key={i} className="bg-slate-900/50 rounded-lg p-4 space-y-3 relative group border border-slate-800">
                                    <button
                                        onClick={() => removeExperience(i)}
                                        className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            placeholder="Company"
                                            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-cyan-500 outline-none"
                                            value={exp.company}
                                            onChange={(e) => updateExperience(i, 'company', e.target.value)}
                                        />
                                        <input
                                            placeholder="Role"
                                            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-cyan-500 outline-none"
                                            value={exp.role}
                                            onChange={(e) => updateExperience(i, 'role', e.target.value)}
                                        />
                                        <input
                                            placeholder="Start Date"
                                            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-cyan-500 outline-none"
                                            value={exp.startDate}
                                            onChange={(e) => updateExperience(i, 'startDate', e.target.value)}
                                        />
                                        <input
                                            placeholder="End Date"
                                            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-cyan-500 outline-none"
                                            value={exp.endDate}
                                            onChange={(e) => updateExperience(i, 'endDate', e.target.value)}
                                        />
                                    </div>
                                    <textarea
                                        placeholder="Description (Bullet points recommended)"
                                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm h-20 focus:border-cyan-500 outline-none resize-none"
                                        value={exp.description}
                                        onChange={(e) => updateExperience(i, 'description', e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Proof of Work (Projects) */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Terminal size={12} /> Select Top Projects
                        </h2>

                        {/* Selected Projects (Drag to Reorder) */}
                        {resumeData.selectedProjectIds.length > 0 && (
                            <div className="mb-4 space-y-2">
                                <label className="text-xs text-cyan-400 font-medium uppercase">Selected (Drag to Reorder)</label>
                                <Reorder.Group
                                    axis="y"
                                    values={resumeData.selectedProjectIds}
                                    onReorder={(newOrder) => setResumeData({ ...resumeData, selectedProjectIds: newOrder })}
                                    className="space-y-2"
                                >
                                    {resumeData.selectedProjectIds.map(id => {
                                        const proj = availableProjects.find(p => p.id === id);
                                        if (!proj) return null;
                                        return (
                                            <Reorder.Item key={id} value={id} className="cursor-grab active:cursor-grabbing">
                                                <div className="p-3 rounded-lg border bg-cyan-900/20 border-cyan-500/50 flex justify-between items-center group">
                                                    <div className="flex items-center gap-3">
                                                        <GripVertical size={14} className="text-cyan-600/50 group-hover:text-cyan-400" />
                                                        <div>
                                                            <div className="font-bold text-sm text-slate-200">{proj.name}</div>
                                                            <div className="text-xs text-slate-500">{proj.technologies?.slice(0, 3).join(', ')}</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent drag start
                                                            setResumeData({
                                                                ...resumeData,
                                                                selectedProjectIds: resumeData.selectedProjectIds.filter(pid => pid !== id)
                                                            })
                                                        }}
                                                        className="text-cyan-400 hover:text-red-400 p-1"
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                </div>
                                            </Reorder.Item>
                                        )
                                    })}
                                </Reorder.Group>
                            </div>
                        )}

                        {/* Available Projects */}
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-medium uppercase">Available Projects</label>
                            <div className="grid grid-cols-1 gap-2">
                                {availableProjects
                                    .filter(p => !resumeData.selectedProjectIds.includes(p.id))
                                    .map(proj => (
                                        <div
                                            key={proj.id}
                                            onClick={() => {
                                                if (resumeData.selectedProjectIds.length >= 5) return; // Max 5
                                                setResumeData({
                                                    ...resumeData,
                                                    selectedProjectIds: [...resumeData.selectedProjectIds, proj.id]
                                                })
                                            }}
                                            className="p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center bg-[#1a1a1a] border-white/5 hover:border-white/20 hover:bg-white/5"
                                        >
                                            <div>
                                                <div className="font-bold text-sm text-slate-200">{proj.name}</div>
                                                <div className="text-xs text-slate-500">
                                                    {((proj.githubData?.stars || 0) * 2) + ((proj.githubData?.forks || 0) * 3) + ((proj.commits || 0) * 0.1) > 0 &&
                                                        <span className="text-amber-500/80 mr-2">
                                                            ★ {proj.githubData?.stars || 0}
                                                        </span>
                                                    }
                                                    {proj.technologies?.slice(0, 3).join(', ')}
                                                </div>
                                            </div>
                                            <div className="opacity-0 hover:opacity-100 text-slate-400">
                                                <Plus size={16} />
                                            </div>
                                        </div>
                                    ))}
                                {availableProjects.length === 0 && (
                                    <div className="text-sm text-slate-500 italic p-4 text-center bg-slate-900 rounded-lg">
                                        No projects found. Add verified projects in DevTrack first.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Verified Skills */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Code2 size={12} /> Verified Skills
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {availableVerifiedSkills.filter(s => s.verified).map((skill, i) => (
                                <button
                                    key={i}
                                    onClick={() => toggleSkill(skill.name)}
                                    className={`
                                        px-3 py-1 rounded-full text-xs border transition-all
                                        ${resumeData.selectedSkillNames.includes(skill.name)
                                            ? 'bg-cyan-500 text-black border-cyan-500 font-bold'
                                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'}
                                    `}
                                >
                                    {skill.name}
                                </button>
                            ))}
                        </div>

                        <div className="pt-2">
                            <label className="text-xs text-slate-500 block mb-1">Additional Skills (Comma separated)</label>
                            <input
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none"
                                value={resumeData.skills.join(', ')}
                                onChange={(e) => updateCustomSkills(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Education */}
                    <div className="space-y-4 pt-4 border-t border-slate-800 pb-12">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <GraduationCap size={12} /> Education
                            </h2>
                            <button onClick={addEducation} className="text-cyan-400 hover:text-cyan-300 p-1">
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {resumeData.education.map((edu, i) => (
                                <div key={i} className="bg-slate-900/50 rounded-lg p-4 space-y-3 relative group border border-slate-800">
                                    <button
                                        onClick={() => removeEducation(i)}
                                        className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <input
                                        placeholder="School / University"
                                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-cyan-500 outline-none"
                                        value={edu.school}
                                        onChange={(e) => updateEducation(i, 'school', e.target.value)}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            placeholder="Degree"
                                            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-cyan-500 outline-none"
                                            value={edu.degree}
                                            onChange={(e) => updateEducation(i, 'degree', e.target.value)}
                                        />
                                        <input
                                            placeholder="Year"
                                            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-cyan-500 outline-none"
                                            value={edu.year}
                                            onChange={(e) => updateEducation(i, 'year', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Achievements Form */}
                    <div className="space-y-4 pt-4 border-t border-slate-800 pb-12">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Trophy size={12} /> Achievements
                        </h2>
                        <div className="space-y-3">
                            {(resumeData.achievements || []).map((item, index) => {
                                const text = typeof item === 'string' ? item : item.text || '';
                                const url = typeof item === 'string' ? '' : item.url || '';

                                return (
                                    <div key={index} className="flex flex-col gap-2 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={text}
                                                onChange={(e) => {
                                                    const newAchievements = [...resumeData.achievements]
                                                    const current = typeof newAchievements[index] === 'string'
                                                        ? { text: newAchievements[index], url: '' }
                                                        : { ...newAchievements[index] };
                                                    current.text = e.target.value;
                                                    newAchievements[index] = current;
                                                    setResumeData(prev => ({ ...prev, achievements: newAchievements }))
                                                }}
                                                placeholder="Achievement (e.g. Winner of Smart India Hackathon)"
                                                className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm focus:border-cyan-500 outline-none"
                                            />
                                            <button
                                                onClick={() => {
                                                    setResumeData(prev => ({
                                                        ...prev,
                                                        achievements: prev.achievements.filter((_, i) => i !== index)
                                                    }))
                                                }}
                                                className="p-2 text-slate-600 hover:text-red-400 rounded transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 px-1">
                                            <LinkIcon size={14} className="text-slate-600" />
                                            <input
                                                type="text"
                                                value={url}
                                                onChange={(e) => {
                                                    const newAchievements = [...resumeData.achievements]
                                                    const current = typeof newAchievements[index] === 'string'
                                                        ? { text: newAchievements[index], url: '' }
                                                        : { ...newAchievements[index] };
                                                    current.url = e.target.value;
                                                    newAchievements[index] = current;
                                                    setResumeData(prev => ({ ...prev, achievements: newAchievements }))
                                                }}
                                                placeholder="Credential URL (Optional)"
                                                className="flex-1 bg-transparent border-b border-slate-800 focus:border-cyan-500/50 outline-none text-xs py-1 text-slate-400 focus:text-cyan-400 placeholder:text-slate-700 transition-colors"
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                            <button
                                onClick={() => setResumeData(prev => ({ ...prev, achievements: [...prev.achievements, { text: '', url: '' }] }))}
                                className="text-sm font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1"
                            >
                                <Plus size={14} /> Add Achievement
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* RIGHT PREVIEW (Real-time) */}
            <div className="flex-1 bg-slate-900 h-screen overflow-y-auto flex items-start justify-center pt-8 pb-8 print:p-0 print:h-auto print:w-auto print:bg-white print:overflow-visible">
                <div className="print:hidden mb-4 absolute top-4 right-8 flex gap-2">
                    <div className="bg-slate-800/80 backdrop-blur rounded-lg px-4 py-2 text-xs text-slate-400 border border-slate-700">
                        A4 Preview Mode
                    </div>
                </div>

                <ResumePaper data={resumeData} projects={previewProjects} verifiedSkills={availableVerifiedSkills} />
            </div>
        </div>
    )
}
