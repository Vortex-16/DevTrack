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
        <div id="resume-preview" className="bg-white text-slate-800 w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl mx-auto origin-top transform scale-[0.6] lg:scale-[0.75] xl:scale-[0.85] transition-transform duration-300 print:transform-none print:scale-100 print:shadow-none print:m-0 print:w-full print:h-auto font-serif">
            {/* Header */}
            <header className="border-b-2 border-slate-900 pb-4 mb-6">
                <h1 className="text-4xl font-bold uppercase tracking-tight mb-2 text-slate-900">
                    {data.basics.name}
                </h1>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700 font-sans">
                    {data.basics.email && (
                        <div className="flex items-center gap-1.5">
                            <Mail size={14} className="text-slate-900" /> {data.basics.email}
                        </div>
                    )}
                    {data.basics.phone && (
                        <div className="flex items-center gap-1.5">
                            <Phone size={14} className="text-slate-900" /> {data.basics.phone}
                        </div>
                    )}
                    {data.basics.location && (
                        <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-slate-900" /> {data.basics.location}
                        </div>
                    )}
                    {data.basics.linkedin && (
                        <div className="flex items-center gap-1.5">
                            <Linkedin size={14} className="text-slate-900" /> {data.basics.linkedin.replace(/^https?:\/\//, '')}
                        </div>
                    )}
                    {data.basics.github && (
                        <div className="flex items-center gap-1.5">
                            <Github size={14} className="text-slate-900" /> {data.basics.github.replace(/^https?:\/\//, '')}
                        </div>
                    )}
                    {data.basics.website && (
                        <div className="flex items-center gap-1.5">
                            <Globe size={14} className="text-slate-900" /> {data.basics.website.replace(/^https?:\/\//, '')}
                        </div>
                    )}
                </div>
            </header>

            {/* Content Container - Sans Serif for readability */}
            <div className="font-sans space-y-6">

                {/* Summary */}
                {data.basics.summary && (
                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2">
                            Professional Summary
                        </h2>
                        <p className="text-sm leading-relaxed text-justify text-slate-800">
                            {data.basics.summary}
                        </p>
                    </section>
                )}

                {/* Experience */}
                {data.experience.length > 0 && (
                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-3">
                            Experience
                        </h2>
                        <div className="space-y-4">
                            {data.experience.map((exp, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h3 className="font-bold text-base text-slate-900">{exp.role}</h3>
                                        <span className="text-sm font-medium text-slate-600 whitespace-nowrap ml-4">{exp.startDate} – {exp.endDate}</span>
                                    </div>
                                    <div className="text-sm font-semibold text-slate-700 italic mb-1.5">{exp.company}</div>
                                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line pl-1">
                                        {exp.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Verified Projects (The "Proof of Work" Core) */}
                {projects.length > 0 && (
                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-3 flex items-center justify-between">
                            <span>Proof of Work</span>
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300 font-normal normal-case flex items-center gap-1 text-slate-600">
                                <CheckCircle2 size={10} className="text-cyan-600" /> Verified by DevTrack
                            </span>
                        </h2>
                        <div className="space-y-4">
                            {projects.map((proj) => (
                                <div key={proj.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-base text-slate-900">{proj.name}</h3>
                                            <div className="flex gap-2">
                                                {proj.repositoryUrl && (
                                                    <a href={proj.repositoryUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-900 print:text-slate-500">
                                                        <Github size={12} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                                {proj.userCommits || proj.commits || 0} commits
                                            </span>
                                            <span className="text-xs font-mono text-slate-500 font-medium text-right">
                                                {proj.technologies && proj.technologies.slice(0, 4).join(', ')}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-800 leading-relaxed mb-1.5 pl-1">
                                        {proj.description}
                                    </p>
                                    <div className="flex gap-4 text-xs text-slate-500 pl-1 print:hidden">
                                        {proj.repositoryUrl && (
                                            <span className="flex items-center gap-1">
                                                Source: {proj.repositoryUrl.replace('https://github.com/', '')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Skills */}
                {(data.selectedSkillNames.length > 0 || data.skills.length > 0) && (
                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-3">
                            Technical Skills
                        </h2>
                        <div className="text-sm leading-relaxed">
                            {/* Verified Skills Grid */}
                            {data.selectedSkillNames.length > 0 && (
                                <div className="mb-3 grid grid-cols-2 gap-x-8 gap-y-2">
                                    {data.selectedSkillNames.map(name => {
                                        // Find skill data for proficiency
                                        const skillData = verifiedSkills.find(s => s.name === name);
                                        // Calculate level 1-5 based on usage count (e.g. 1 project = 1, 5 projects = 5)
                                        const level = skillData ? Math.min(Math.max(skillData.count, 1), 5) : 3;

                                        return (
                                            <div key={name} className="flex items-center justify-between">
                                                <span className="font-semibold text-slate-800">{name}</span>
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <div
                                                            key={star}
                                                            className={`w-2 h-2 rounded-full ${star <= level ? 'bg-slate-800' : 'bg-slate-200'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Additional Manual Skills */}
                            {data.skills.length > 0 && (
                                <div className="pt-2 border-t border-slate-100">
                                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wide mr-2">Additional:</span>
                                    <span className="text-slate-700">{data.skills.join(', ')}</span>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Education */}
                {data.education.length > 0 && (
                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-3">
                            Education
                        </h2>
                        <div className="space-y-2">
                            {data.education.map((edu, i) => (
                                <div key={i} className="flex justify-between items-baseline">
                                    <div>
                                        <h3 className="font-bold text-base text-slate-900">{edu.school}</h3>
                                        <div className="text-sm text-slate-800 italic">{edu.degree}</div>
                                    </div>
                                    <span className="text-sm font-medium text-slate-600">{edu.year}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
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

            // Ensure basics are populated if empty (First time load or missing fields)
            if (!backendData.basics.name) backendData.basics.name = userRes.data.user.name || ''
            if (!backendData.basics.email) backendData.basics.email = userRes.data.user.email || ''
            if (!backendData.basics.location) backendData.basics.location = userRes.data.user.location || ''

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
            await resumeApi.save(resumeData)
            confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.9 },
                colors: ['#22d3ee', '#ffffff'] // cyan & white
            })
        } catch (error) {
            console.error('Save failed:', error)
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
