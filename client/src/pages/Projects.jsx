import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { projectsApi, githubApi, geminiApi } from '../services/api'
import LoadingText from '../components/ui/LoadingText'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Animated counter
function AnimatedCounter({ value }) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        const numValue = parseInt(value) || 0
        if (numValue === 0) { setCount(0); return }
        const step = numValue / 60
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
    }, [value])
    return <span>{count}</span>
}

// Stat Card Component
function StatCard({ icon, label, value, color, delay = 0 }) {
    const colors = {
        purple: { border: 'border-purple-500/30', iconBg: 'from-purple-500 to-purple-600', glow: 'shadow-purple-500/20' },
        cyan: { border: 'border-cyan-500/30', iconBg: 'from-cyan-500 to-cyan-600', glow: 'shadow-cyan-500/20' },
        green: { border: 'border-emerald-500/30', iconBg: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/20' },
        orange: { border: 'border-orange-500/30', iconBg: 'from-orange-500 to-orange-600', glow: 'shadow-orange-500/20' },
    }
    const c = colors[color] || colors.purple

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <div
                className={`rounded-2xl p-5 border ${c.border} backdrop-blur-sm h-full`}
                style={{ background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.9), rgba(20, 25, 40, 0.95))' }}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center text-xl shadow-lg ${c.glow}`}>
                        {icon}
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white"><AnimatedCounter value={value} /></p>
                        <p className="text-slate-400 text-sm">{label}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// Project Card Component
function ProjectCard({ project, onEdit, onDelete, onReanalyze, analyzing, delay = 0 }) {
    const statusColors = {
        Active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
        Completed: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
        Planning: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
        'On Hold': { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
    }
    const status = statusColors[project.status] || statusColors.Planning
    const progress = project.aiAnalysis?.progressPercentage ?? project.progress ?? 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="group"
        >
            <div
                className="rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300 h-full flex flex-col"
                style={{ background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.9), rgba(20, 25, 40, 0.95))' }}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-white mb-1 truncate">{project.name}</h3>
                        <p className="text-slate-400 text-sm line-clamp-2">{project.description || 'No description'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text} ${status.border} border ml-3 flex-shrink-0`}>
                        {project.status}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-purple-400 font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ delay: delay + 0.3, duration: 0.8, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {/* AI Analysis */}
                {project.aiAnalysis && (
                    <div className="mb-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">🤖</span>
                            <span className="text-xs font-medium text-purple-400">AI Analysis</span>
                            {project.aiAnalysis.commitFrequencyScore !== undefined && (
                                <span className="ml-auto text-xs text-emerald-400">
                                    Score: {project.aiAnalysis.commitFrequencyScore}%
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2">
                            {project.aiAnalysis.progressSummary || project.aiAnalysis.reasoning || 'Analysis complete'}
                        </p>
                        {project.aiAnalysis.nextRecommendedTasks?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {project.aiAnalysis.nextRecommendedTasks.slice(0, 2).map((task, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-slate-400">
                                        {task}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Technologies */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {(project.technologies || []).slice(0, 4).map((tech, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-medium">
                            {tech}
                        </span>
                    ))}
                    {(project.technologies || []).length > 4 && (
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 text-xs">
                            +{project.technologies.length - 4}
                        </span>
                    )}
                </div>

                {/* GitHub Stats */}
                {project.githubData && (
                    <div className="flex gap-4 text-sm text-slate-400 mb-4">
                        <span className="flex items-center gap-1">⭐ {project.githubData.stars || 0}</span>
                        <span className="flex items-center gap-1">🍴 {project.githubData.forks || 0}</span>
                        <span className="flex items-center gap-1">📝 {project.githubData.openIssues || 0}</span>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-sm text-slate-500">{project.commits || 0} commits</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {project.repositoryUrl && (
                            <button
                                onClick={() => onReanalyze(project)}
                                disabled={analyzing}
                                className="p-2 rounded-lg bg-white/5 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50"
                                title="Re-analyze"
                            >
                                {analyzing ? '⏳' : '🔄'}
                            </button>
                        )}
                        <button
                            onClick={() => onEdit(project)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            title="Edit"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onDelete(project.id)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                            title="Delete"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto"
                    style={{
                        background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.98), rgba(20, 25, 40, 0.99))',
                        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
                    }}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-6">{children}</div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

// Project Form
function ProjectForm({ formData, setFormData, onSubmit, onCancel, isEdit, analyzing }) {
    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div>
                <label className="block text-sm text-slate-400 mb-2">Project Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                    placeholder="My Awesome Project"
                    required
                />
            </div>

            <div>
                <label className="block text-sm text-slate-400 mb-2">Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white min-h-[80px] focus:border-purple-500 focus:outline-none transition-colors resize-none"
                    placeholder="Describe your project..."
                />
            </div>

            <div>
                <label className="block text-sm text-slate-400 mb-2">Status</label>
                <div className="grid grid-cols-4 gap-2">
                    {['Planning', 'Active', 'On Hold', 'Completed'].map((status) => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setFormData({ ...formData, status })}
                            className={`p-2 rounded-xl border text-xs font-medium transition-all ${formData.status === status
                                    ? 'bg-purple-500/20 border-purple-500 text-white'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm text-slate-400 mb-2">
                    GitHub Repository
                    <span className="text-purple-400 ml-2 text-xs">✨ Auto-analyzes with AI!</span>
                </label>
                <input
                    type="url"
                    value={formData.repositoryUrl}
                    onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                    placeholder="https://github.com/username/repo"
                />
            </div>

            <div>
                <label className="block text-sm text-slate-400 mb-2">Technologies (comma separated)</label>
                <input
                    type="text"
                    value={formData.technologies}
                    onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                    placeholder="React, Node.js, Firebase"
                />
            </div>

            <div className="flex gap-4 pt-2">
                <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1" disabled={analyzing}>
                    {analyzing ? '🔍 Analyzing...' : isEdit ? 'Save Changes' : 'Create Project'}
                </Button>
            </div>
        </form>
    )
}

export default function Projects() {
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingProject, setEditingProject] = useState(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [stats, setStats] = useState({ totalProjects: 0, activeProjects: 0, completedProjects: 0, totalCommits: 0 })

    const defaultFormData = { name: '', description: '', status: 'Planning', repositoryUrl: '', technologies: '' }
    const [formData, setFormData] = useState(defaultFormData)

    useEffect(() => {
        fetchProjects()
        fetchStats()
    }, [])

    const fetchProjects = async () => {
        try {
            setLoading(true)
            const response = await projectsApi.getAll({ limit: 50 })
            setProjects(response.data.data.projects || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await projectsApi.getStats()
            setStats(response.data.data || {})
        } catch (err) {
            console.error('Error fetching stats:', err)
        }
    }

    const parseGitHubUrl = (url) => {
        if (!url) return null
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
        if (match) return { owner: match[1], repo: match[2].replace(/\.git$/, '') }
        return null
    }

    const analyzeWithGitHub = async (repositoryUrl) => {
        const githubInfo = parseGitHubUrl(repositoryUrl)
        if (!githubInfo) return null

        try {
            const repoResponse = await githubApi.analyzeRepo(githubInfo.owner, githubInfo.repo)
            const repoInfo = repoResponse.data.data

            let result = {
                commits: repoInfo.totalCommits || repoInfo.commitCount || 0,
                technologies: repoInfo.languages?.map(l => l.name) || [],
                githubData: {
                    stars: repoInfo.stars,
                    forks: repoInfo.forks,
                    openIssues: repoInfo.openIssuesCount || repoInfo.openIssues,
                    languages: repoInfo.languages,
                    totalCommits: repoInfo.totalCommits,
                },
                progress: 0,
                aiAnalysis: null
            }

            try {
                const analysisResponse = await geminiApi.analyzeProject(repoInfo)
                if (analysisResponse.data.data?.success) {
                    const analysis = analysisResponse.data.data
                    result.progress = analysis.progressPercentage ?? analysis.progress ?? 0
                    result.aiAnalysis = {
                        progressSummary: analysis.progressSummary,
                        progressPercentage: analysis.progressPercentage,
                        commitFrequencyScore: analysis.commitFrequencyScore,
                        nextRecommendedTasks: analysis.nextRecommendedTasks,
                        reasoning: analysis.reasoning || analysis.progressSummary,
                    }
                }
            } catch (aiErr) {
                console.error('AI analysis failed:', aiErr)
            }

            return result
        } catch (ghErr) {
            console.error('GitHub fetch failed:', ghErr)
            return null
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const techArray = formData.technologies.split(',').map(t => t.trim()).filter(t => t)
            let projectData = { ...formData, technologies: techArray }

            if (formData.repositoryUrl) {
                setAnalyzing(true)
                const analysisData = await analyzeWithGitHub(formData.repositoryUrl)
                if (analysisData) {
                    projectData = { ...projectData, ...analysisData }
                    if (!projectData.technologies.length) projectData.technologies = analysisData.technologies
                }
                setAnalyzing(false)
            }

            await projectsApi.create(projectData)
            setShowModal(false)
            setFormData(defaultFormData)
            fetchProjects()
            fetchStats()
        } catch (err) {
            console.error('Error creating project:', err)
            alert('Failed to create project')
            setAnalyzing(false)
        }
    }

    const handleEdit = (project) => {
        setEditingProject(project)
        setFormData({
            name: project.name,
            description: project.description || '',
            status: project.status || 'Planning',
            repositoryUrl: project.repositoryUrl || '',
            technologies: (project.technologies || []).join(', ')
        })
        setShowEditModal(true)
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        try {
            const techArray = formData.technologies.split(',').map(t => t.trim()).filter(t => t)
            let updateData = { ...formData, technologies: techArray }

            if (formData.repositoryUrl && formData.repositoryUrl !== editingProject.repositoryUrl) {
                setAnalyzing(true)
                const analysisData = await analyzeWithGitHub(formData.repositoryUrl)
                if (analysisData) updateData = { ...updateData, ...analysisData }
                setAnalyzing(false)
            }

            await projectsApi.update(editingProject.id, updateData)
            setShowEditModal(false)
            setEditingProject(null)
            setFormData(defaultFormData)
            fetchProjects()
            fetchStats()
        } catch (err) {
            console.error('Error updating project:', err)
            alert('Failed to update project')
            setAnalyzing(false)
        }
    }

    const handleDelete = async (projectId) => {
        try {
            await projectsApi.delete(projectId)
            setDeleteConfirm(null)
            fetchProjects()
            fetchStats()
        } catch (err) {
            console.error('Error deleting project:', err)
            alert('Failed to delete project')
        }
    }

    const handleReanalyze = async (project) => {
        if (!project.repositoryUrl) return

        try {
            setAnalyzing(true)
            const analysisData = await analyzeWithGitHub(project.repositoryUrl)

            if (analysisData) {
                await projectsApi.update(project.id, {
                    commits: analysisData.commits,
                    technologies: analysisData.technologies.length > 0 ? analysisData.technologies : project.technologies,
                    githubData: analysisData.githubData,
                    progress: analysisData.progress,
                    aiAnalysis: analysisData.aiAnalysis
                })
                fetchProjects()
                fetchStats()
            }
        } catch (err) {
            console.error('Error re-analyzing project:', err)
        } finally {
            setAnalyzing(false)
        }
    }

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
            {/* Main Container */}
            <div
                className="rounded-[2rem] p-6 lg:p-8 border border-white/10"
                style={{
                    background: 'linear-gradient(145deg, rgba(15, 20, 35, 0.8), rgba(10, 15, 25, 0.9))',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                }}
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">Projects</h1>
                        <p className="text-slate-400 text-sm">Track your development projects and milestones</p>
                    </div>
                    <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Project
                    </Button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard icon="📁" label="Total Projects" value={stats.totalProjects || 0} color="purple" delay={0.1} />
                    <StatCard icon="🚀" label="Active" value={stats.activeProjects || 0} color="green" delay={0.15} />
                    <StatCard icon="✅" label="Completed" value={stats.completedProjects || 0} color="cyan" delay={0.2} />
                    <StatCard icon="📊" label="Total Commits" value={stats.totalCommits || 0} color="orange" delay={0.25} />
                </div>

                {/* Error State */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl p-4 bg-red-500/10 border border-red-500/30 mb-6"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-red-400">⚠️</span>
                            <p className="text-red-400 flex-1">Error: {error}</p>
                            <Button variant="ghost" onClick={fetchProjects} className="text-sm">Retry</Button>
                        </div>
                    </motion.div>
                )}

                {/* Empty State */}
                {!loading && projects.length === 0 && !error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16 rounded-2xl border-2 border-dashed border-purple-500/30"
                    >
                        <div className="text-6xl mb-4">🚀</div>
                        <h3 className="text-xl font-semibold text-white mb-2">No Projects Yet</h3>
                        <p className="text-slate-400 mb-6 max-w-md mx-auto">
                            Track your coding projects, link your GitHub repos, and let AI analyze your progress!
                        </p>
                        <Button onClick={() => setShowModal(true)} size="lg">Create Your First Project</Button>
                    </motion.div>
                )}

                {/* Projects Grid */}
                {projects.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {projects.map((project, idx) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onEdit={handleEdit}
                                onDelete={(id) => setDeleteConfirm(id)}
                                onReanalyze={handleReanalyze}
                                analyzing={analyzing}
                                delay={0.1 + idx * 0.05}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Project?">
                <div className="text-center">
                    <div className="text-5xl mb-4">⚠️</div>
                    <p className="text-slate-400 mb-6">This action cannot be undone.</p>
                    <div className="flex gap-4">
                        <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancel</Button>
                        <Button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700">Delete</Button>
                    </div>
                </div>
            </Modal>

            {/* Create Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Project">
                <ProjectForm
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleSubmit}
                    onCancel={() => setShowModal(false)}
                    isEdit={false}
                    analyzing={analyzing}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingProject(null) }} title="Edit Project">
                <ProjectForm
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleEditSubmit}
                    onCancel={() => { setShowEditModal(false); setEditingProject(null) }}
                    isEdit={true}
                    analyzing={analyzing}
                />
            </Modal>
        </motion.div>
    )
}
