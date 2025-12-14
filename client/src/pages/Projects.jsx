import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { projectsApi, githubApi, geminiApi } from '../services/api'
import LoadingText from '../components/ui/LoadingText'
import { useState, useEffect } from 'react'

// Moved outside to prevent re-creation on every render (fixes input focus issues)
const ProjectModal = ({ isEdit, onSubmit, onClose, formData, setFormData, analyzing }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{isEdit ? 'Edit Project' : 'New Project'}</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm text-slate-400 mb-2">Project Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2"
                        placeholder="My Awesome Project"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm text-slate-400 mb-2">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2 min-h-[80px]"
                        placeholder="Describe your project..."
                    />
                </div>

                <div>
                    <label className="block text-sm text-slate-400 mb-2">Status</label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2"
                    >
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm text-slate-400 mb-2">
                        GitHub Repository URL
                        <span className="text-primary-400 ml-2">✨ Auto-analyzes with AI!</span>
                    </label>
                    <input
                        type="url"
                        value={formData.repositoryUrl}
                        onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
                        className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2"
                        placeholder="https://github.com/username/repo"
                    />
                </div>

                <div>
                    <label className="block text-sm text-slate-400 mb-2">Technologies (comma separated)</label>
                    <input
                        type="text"
                        value={formData.technologies}
                        onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                        className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2"
                        placeholder="React, Node.js, Firebase"
                    />
                </div>

                <div className="flex gap-4 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={analyzing}>
                        {analyzing ? '🔍 Analyzing...' : isEdit ? 'Save Changes' : 'Create Project'}
                    </Button>
                </div>
            </form>
        </Card>
    </div>
)

export default function Projects() {
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingProject, setEditingProject] = useState(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [stats, setStats] = useState({ totalProjects: 0, activeProjects: 0, completedProjects: 0, totalCommits: 0 })

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'Planning',
        repositoryUrl: '',
        technologies: ''
    })

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
            console.error('Error fetching projects:', err)
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
        if (match) {
            return { owner: match[1], repo: match[2].replace(/\.git$/, '') }
        }
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
                    recentCommitsThisWeek: repoInfo.recentCommitsThisWeek,
                },
                progress: 0,
                aiAnalysis: null
            }

            // Analyze with AI (Groq)
            try {
                const analysisResponse = await geminiApi.analyzeProject(repoInfo)
                console.log('AI Analysis response:', analysisResponse.data)
                if (analysisResponse.data.data?.success) {
                    const analysis = analysisResponse.data.data
                    // Use new format progressPercentage, fallback to old format progress
                    result.progress = analysis.progressPercentage ?? analysis.progress ?? 0
                    result.aiAnalysis = {
                        // New enhanced format
                        progressSummary: analysis.progressSummary,
                        progressPercentage: analysis.progressPercentage,
                        commitFrequencyScore: analysis.commitFrequencyScore,
                        productivityStreaks: analysis.productivityStreaks,
                        areasOfImprovement: analysis.areasOfImprovement,
                        nextRecommendedTasks: analysis.nextRecommendedTasks,
                        fileAnalysis: analysis.fileAnalysis,
                        trends: analysis.trends,
                        concerns: analysis.concerns,
                        // Fallback for old format
                        reasoning: analysis.reasoning || analysis.progressSummary,
                        suggestions: analysis.suggestions || analysis.nextRecommendedTasks,
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

            let projectData = {
                ...formData,
                technologies: techArray
            }

            if (formData.repositoryUrl) {
                setAnalyzing(true)
                const analysisData = await analyzeWithGitHub(formData.repositoryUrl)
                if (analysisData) {
                    projectData = { ...projectData, ...analysisData }
                    if (!projectData.technologies.length) {
                        projectData.technologies = analysisData.technologies
                    }
                }
                setAnalyzing(false)
            }

            console.log('Creating project with data:', projectData)
            await projectsApi.create(projectData)
            setShowModal(false)
            setFormData({
                name: '',
                description: '',
                status: 'Planning',
                repositoryUrl: '',
                technologies: ''
            })
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

            let updateData = {
                name: formData.name,
                description: formData.description,
                status: formData.status,
                repositoryUrl: formData.repositoryUrl,
                technologies: techArray
            }

            // Re-analyze if repository URL changed
            if (formData.repositoryUrl && formData.repositoryUrl !== editingProject.repositoryUrl) {
                setAnalyzing(true)
                const analysisData = await analyzeWithGitHub(formData.repositoryUrl)
                if (analysisData) {
                    updateData = { ...updateData, ...analysisData }
                }
                setAnalyzing(false)
            }

            await projectsApi.update(editingProject.id, updateData)
            setShowEditModal(false)
            setEditingProject(null)
            setFormData({
                name: '',
                description: '',
                status: 'Planning',
                repositoryUrl: '',
                technologies: ''
            })
            fetchProjects()
            fetchStats()
        } catch (err) {
            console.error('Error updating project:', err)
            alert('Failed to update project')
            setAnalyzing(false)
        }
    }

    const handleDelete = async (projectId) => {
        if (!confirm('Are you sure you want to delete this project?')) return
        try {
            await projectsApi.delete(projectId)
            fetchProjects()
            fetchStats()
        } catch (err) {
            console.error('Error deleting project:', err)
            alert('Failed to delete project')
        }
    }

    const handleReanalyze = async (project) => {
        if (!project.repositoryUrl) {
            alert('No GitHub repository URL linked to this project')
            return
        }

        try {
            setAnalyzing(true)
            console.log('Re-analyzing project:', project.name)

            const analysisData = await analyzeWithGitHub(project.repositoryUrl)

            if (analysisData) {
                // Update project with new analysis data
                await projectsApi.update(project.id, {
                    commits: analysisData.commits,
                    technologies: analysisData.technologies.length > 0 ? analysisData.technologies : project.technologies,
                    githubData: analysisData.githubData,
                    progress: analysisData.progress,
                    aiAnalysis: analysisData.aiAnalysis
                })

                fetchProjects()
                fetchStats()
                console.log('✅ Re-analysis complete!')
            } else {
                alert('Failed to fetch GitHub data. Check the repository URL.')
            }
        } catch (err) {
            console.error('Error re-analyzing project:', err)
            alert('Failed to re-analyze project')
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
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-gradient mb-2">Projects</h1>
                    <p className="text-slate-400">Track your development projects and milestones</p>
                </div>
                <Button onClick={() => setShowModal(true)}>+ New Project</Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <div className="text-slate-400 text-sm">Total Projects</div>
                    <div className="text-3xl font-bold mt-2">{stats.totalProjects || 0}</div>
                </Card>
                <Card>
                    <div className="text-slate-400 text-sm">Active</div>
                    <div className="text-3xl font-bold mt-2 text-green-500">{stats.activeProjects || 0}</div>
                </Card>
                <Card>
                    <div className="text-slate-400 text-sm">Completed</div>
                    <div className="text-3xl font-bold mt-2 text-blue-500">{stats.completedProjects || 0}</div>
                </Card>
                <Card>
                    <div className="text-slate-400 text-sm">Total Commits</div>
                    <div className="text-3xl font-bold mt-2">{stats.totalCommits || 0}</div>
                </Card>
            </div>

            {/* Error State */}
            {error && (
                <Card className="border-red-500/50 bg-red-500/10">
                    <p className="text-red-400">Error: {error}</p>
                    <Button variant="ghost" onClick={fetchProjects} className="mt-2">Retry</Button>
                </Card>
            )}

            {/* Empty State */}
            {!loading && projects.length === 0 && !error && (
                <Card className="text-center py-12">
                    <div className="text-6xl mb-6">🚀</div>
                    <h3 className="text-2xl font-bold mb-2">Add a Project to Start Learning</h3>
                    <p className="text-slate-400 mb-6 max-w-md mx-auto">
                        Track your coding projects, link your GitHub repos, and let AI analyze your progress!
                    </p>
                    <Button onClick={() => setShowModal(true)} size="lg">Create Your First Project</Button>
                </Card>
            )}

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project) => (
                    <Card key={project.id} hover className="flex flex-col h-full">
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-2xl font-bold">{project.name}</h3>
                                <div className="flex items-center gap-2">
                                    <Badge variant={
                                        project.status === 'Active' ? 'success' :
                                            project.status === 'Completed' ? 'primary' : 'warning'
                                    }>
                                        {project.status}
                                    </Badge>
                                </div>
                            </div>

                            <p className="text-slate-400 mb-4">{project.description || 'No description'}</p>

                            {/* AI Analysis - Enhanced */}
                            {project.aiAnalysis && (
                                <div className="mb-4 p-3 bg-primary-900/20 border border-primary-500/30 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">🤖 AI Analysis</span>
                                        {project.aiAnalysis.commitFrequencyScore !== undefined && (
                                            <Badge variant="success" className="text-xs">
                                                Commit Score: {project.aiAnalysis.commitFrequencyScore}%
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Progress Summary */}
                                    <p className="text-sm text-slate-300 mb-2">
                                        {project.aiAnalysis.progressSummary || project.aiAnalysis.reasoning || 'Analysis complete'}
                                    </p>

                                    {/* Trends */}
                                    {project.aiAnalysis.trends && (
                                        <p className="text-xs text-slate-400 mb-2">📈 {project.aiAnalysis.trends}</p>
                                    )}

                                    {/* Next Tasks */}
                                    {(project.aiAnalysis.nextRecommendedTasks?.length > 0 || project.aiAnalysis.suggestions?.length > 0) && (
                                        <div className="mt-2">
                                            <span className="text-xs text-slate-400">Next steps:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {(project.aiAnalysis.nextRecommendedTasks || project.aiAnalysis.suggestions)?.slice(0, 2).map((task, i) => (
                                                    <Badge key={i} variant="default" className="text-xs">{task}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Areas of Improvement */}
                                    {project.aiAnalysis.areasOfImprovement?.length > 0 && (
                                        <div className="mt-2">
                                            <span className="text-xs text-slate-400">Improve:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {project.aiAnalysis.areasOfImprovement.slice(0, 2).map((area, i) => (
                                                    <Badge key={i} variant="warning" className="text-xs">{area}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Progress - Use AI progress or fallback */}
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">Progress</span>
                                    <span className="text-gradient font-semibold">
                                        {project.aiAnalysis?.progressPercentage ?? project.progress ?? 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-dark-800 rounded-full h-2">
                                    <div
                                        className="gradient-primary h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${project.aiAnalysis?.progressPercentage ?? project.progress ?? 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Technologies */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {(project.technologies || []).map((tech, i) => (
                                    <Badge key={i} variant="default">{tech}</Badge>
                                ))}
                            </div>

                            {/* GitHub Stats */}
                            {project.githubData && (
                                <div className="flex gap-4 text-sm text-slate-400 mb-4">
                                    <span>⭐ {project.githubData.stars || 0}</span>
                                    <span>🍴 {project.githubData.forks || 0}</span>
                                    <span>📝 {project.githubData.openIssues || 0} issues</span>
                                </div>
                            )}
                        </div>

                        {/* Footer with actions */}
                        <div className="flex justify-between items-center pt-4 border-t border-white/10">
                            <div className="text-sm text-slate-400">
                                <span>{project.commits || 0} commits</span>
                            </div>
                            <div className="flex gap-2">
                                {project.repositoryUrl && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleReanalyze(project)}
                                        disabled={analyzing}
                                    >
                                        {analyzing ? '⏳' : '🔄'} Analyze
                                    </Button>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(project)}>
                                    ✏️ Edit
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(project.id)}>
                                    🗑️
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Create Modal */}
            {showModal && (
                <ProjectModal
                    isEdit={false}
                    onSubmit={handleSubmit}
                    onClose={() => setShowModal(false)}
                    formData={formData}
                    setFormData={setFormData}
                    analyzing={analyzing}
                />
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <ProjectModal
                    isEdit={true}
                    onSubmit={handleEditSubmit}
                    onClose={() => {
                        setShowEditModal(false)
                        setEditingProject(null)
                    }}
                    formData={formData}
                    setFormData={setFormData}
                    analyzing={analyzing}
                />
            )}
        </div>
    )
}
