/**
 * Projects Controller
 * Handles CRUD operations for projects
 */

const { collections } = require('../config/firebase');
const { APIError } = require('../middleware/errorHandler');

/**
 * Get all projects for authenticated user
 * GET /api/projects
 */
const getProjects = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Get projects for user (simple query - no ordering to avoid index requirement)
        const projectsRef = collections.projects()
            .where('uid', '==', userId)
            .limit(limitNum);

        const snapshot = await projectsRef.get();

        const projects = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Get total count for pagination
        const countSnapshot = await collections.projects()
            .where('uid', '==', userId)
            .count()
            .get();

        const total = countSnapshot.data().count;

        res.status(200).json({
            success: true,
            data: {
                projects,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single project by ID
 * GET /api/projects/:id
 */
const getProject = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { id } = req.params;

        const projectDoc = await collections.projects().doc(id).get();

        if (!projectDoc.exists) {
            throw new APIError('Project not found', 404);
        }

        const project = projectDoc.data();

        if (project.uid !== userId) {
            throw new APIError('Access denied', 403);
        }

        res.status(200).json({
            success: true,
            data: {
                id: projectDoc.id,
                ...project,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new project
 * POST /api/projects
 */
const createProject = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { name, description, status, repositoryUrl, technologies, progress, commits, githubData, aiAnalysis } = req.body;

        const projectData = {
            uid: userId,
            name,
            description: description || '',
            status: status || 'Planning',
            repositoryUrl: repositoryUrl || '',
            technologies: technologies || [],
            progress: progress || 0,
            commits: commits || 0,
            githubData: githubData || null,
            aiAnalysis: aiAnalysis || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const projectRef = await collections.projects().add(projectData);

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: {
                id: projectRef.id,
                ...projectData,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update an existing project
 * PUT /api/projects/:id
 */
const updateProject = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { id } = req.params;
        const updates = req.body;

        const projectRef = collections.projects().doc(id);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            throw new APIError('Project not found', 404);
        }

        const project = projectDoc.data();

        if (project.uid !== userId) {
            throw new APIError('Access denied', 403);
        }

        const updateData = {
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        await projectRef.update(updateData);

        const updatedDoc = await projectRef.get();

        res.status(200).json({
            success: true,
            message: 'Project updated successfully',
            data: {
                id: projectRef.id,
                ...updatedDoc.data(),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a project
 * DELETE /api/projects/:id
 */
const deleteProject = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { id } = req.params;

        const projectRef = collections.projects().doc(id);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            throw new APIError('Project not found', 404);
        }

        const project = projectDoc.data();

        if (project.uid !== userId) {
            throw new APIError('Access denied', 403);
        }

        await projectRef.delete();

        res.status(200).json({
            success: true,
            message: 'Project deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get projects statistics
 * GET /api/projects/stats
 */
const getStats = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        const projectsSnapshot = await collections.projects()
            .where('uid', '==', userId)
            .get();

        const projects = projectsSnapshot.docs.map((doc) => doc.data());

        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.status === 'Active').length;
        const completedProjects = projects.filter(p => p.status === 'Completed').length;
        const totalCommits = projects.reduce((sum, p) => sum + (p.commits || 0), 0);

        // Get technology counts
        const techCounts = {};
        projects.forEach((project) => {
            (project.technologies || []).forEach((tech) => {
                techCounts[tech] = (techCounts[tech] || 0) + 1;
            });
        });

        const topTechnologies = Object.entries(techCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tech, count]) => ({ tech, count }));

        res.status(200).json({
            success: true,
            data: {
                totalProjects,
                activeProjects,
                completedProjects,
                totalCommits,
                topTechnologies,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    getStats,
};
