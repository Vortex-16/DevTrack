/**
 * Projects Controller
 * Handles CRUD operations for projects
 */

const { collections } = require('../config/firebase');
const { APIError } = require('../middleware/errorHandler');
const {
    getActiveGithubToken,
    hasGithubAccessExpired,
    buildGithubAccessClearUpdate,
} = require('../services/githubAccessService');

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
 * 
 * OPTIMIZED: Returns immediately, runs GitHub/AI analysis in background
 */
const createProject = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { name, description, projectIdea, status, repositoryUrl, technologies, progress, commits, githubData, aiAnalysis } = req.body;

        const GitHubService = require('../services/githubService');

        // Validation for GitHub Repository
        if (repositoryUrl) {
            // 1. Valid URL format
            const parsed = GitHubService.parseGitHubUrl(repositoryUrl);
            if (!parsed) {
                throw new APIError('Invalid GitHub repository URL', 400);
            }

            const userDoc = await collections.users().doc(userId).get();
            if (!userDoc.exists) {
                throw new APIError('User profile not found', 404);
            }
            const userData = userDoc.data();
            const userGithubUsername = userData.githubUsername;

            if (!userGithubUsername) {
                throw new APIError('Please link your GitHub account in settings first', 400);
            }

            let githubAccessToken = getActiveGithubToken(userData);
            if (!githubAccessToken && hasGithubAccessExpired(userData)) {
                collections.users().doc(userId).update(buildGithubAccessClearUpdate()).catch(() => null);
            }

            // 3. Check if user owns or is a contributor to the repo
            const github = new GitHubService(githubAccessToken);

            // First check if repo exists and get its info
            let repoInfo;
            try {
                const repoResponse = await github.octokit.rest.repos.get({
                    owner: parsed.owner,
                    repo: parsed.repo,
                });
                repoInfo = repoResponse.data;
            } catch (err) {
                if (err.status === 404) {
                    throw new APIError('Repository not found on GitHub', 404);
                }
                throw new APIError(`Cannot access repository: ${err.message}`, 400);
            }

            // Check ownership OR push permissions (better for Orgs/Private repos)
            const isOwner = parsed.owner.toLowerCase() === userGithubUsername.toLowerCase();
            const hasPushAccess = repoInfo.permissions?.push || repoInfo.permissions?.admin;

            // If not owner and no push access, check if user is a contributor
            if (!isOwner && !hasPushAccess) {
                try {
                    const contributorsResponse = await github.octokit.rest.repos.listContributors({
                        owner: parsed.owner,
                        repo: parsed.repo,
                        per_page: 100, // Check first 100 contributors
                    });

                    const contributors = contributorsResponse.data || [];
                    const isContributor = contributors.some(
                        contributor => contributor.login.toLowerCase() === userGithubUsername.toLowerCase()
                    );

                    if (!isContributor) {
                        throw new APIError(
                            `You can only add repositories that you own or contribute to. You are not listed as a contributor to ${parsed.owner}/${parsed.repo}`,
                            403
                        );
                    }
                } catch (contributorErr) {
                    // If we can't fetch contributors (e.g., private repo without access), fall back to ownership check
                    if (contributorErr instanceof APIError) {
                        throw contributorErr;
                    }
                    throw new APIError(
                        `You can only add repositories that you own or contribute to (${userGithubUsername})`,
                        403
                    );
                }
            }

            // Get all user projects since we need to compare normalized URLs reliably
            const allProjectsSnapshot = await collections.projects()
                .where('uid', '==', userId)
                .get();
                
            const normalizeRepoUrl = (url) => {
                if (!url) return '';
                try {
                    return url.toLowerCase().trim()
                        .replace(/^https?:\/\/(www\.)?/, '')
                        .replace(/\.git$/, '')
                        .replace(/\/$/, '')
                        .replace(/^github\.com\//, '');
                } catch (e) {
                    return url.toLowerCase().trim();
                }
            };

            const providedNormalized = normalizeRepoUrl(repositoryUrl);
            const isDuplicate = allProjectsSnapshot.docs.some(doc => {
                const dbUrl = normalizeRepoUrl(doc.data().repositoryUrl);
                return dbUrl && dbUrl === providedNormalized;
            });

            if (isDuplicate) {
                throw new APIError('A project with this repository URL is already in your DevTrack', 400);
            }

            // [NEW] Always try to fetch user commits from contributors list
            // This ensures we show "User Commits" not "Total Commits"
            try {
                const contributorsResponse = await github.octokit.rest.repos.listContributors({
                    owner: parsed.owner,
                    repo: parsed.repo,
                    per_page: 100,
                });

                const contributors = contributorsResponse.data || [];
                const userContributor = contributors.find(
                    contributor => contributor.login.toLowerCase() === userGithubUsername.toLowerCase()
                );

                if (userContributor) {
                    req.body.userCommits = userContributor.contributions;
                }
            } catch (err) {
                console.warn('Could not fetch user specific commits:', err.message);
            }
        }

        // If githubData is already provided (from client-side analysis), use it directly
        const hasPreAnalyzedData = !!(githubData || aiAnalysis);

        // Create project immediately with basic data (no blocking on GitHub/AI)
        const projectData = {
            uid: userId,
            name,
            description: description || '',
            projectIdea: projectIdea || '',
            status: status || 'Planning',
            repositoryUrl: repositoryUrl || '',
            technologies: technologies || [],
            progress: aiAnalysis?.progressPercentage || progress || 0,
            commits: req.body.userCommits || githubData?.totalCommits || commits || 0,
            userCommits: req.body.userCommits || 0,
            totalCommits: githubData?.totalCommits || 0,
            githubData: githubData || null,
            aiAnalysis: aiAnalysis || null,
            // Flag to indicate if background analysis is pending
            isAnalyzing: !!(repositoryUrl && !hasPreAnalyzedData),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const projectRef = await collections.projects().add(projectData);
        const projectId = projectRef.id;

        // Return immediately - don't block on GitHub/AI analysis
        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: {
                id: projectId,
                ...projectData,
            },
        });

        // ═══════════════════════════════════════════════════════════════════
        // BACKGROUND PROCESSING: Run GitHub fetch + AI analysis asynchronously
        // ═══════════════════════════════════════════════════════════════════
        if (repositoryUrl && !hasPreAnalyzedData) {
            // Use setImmediate to ensure response is sent first
            setImmediate(async () => {
                try {
                    const { getGroqService } = require('../services/groqService');

                    const parsed = GitHubService.parseGitHubUrl(repositoryUrl);

                    if (parsed) {
                        // console.log(`[Background] Fetching GitHub data for ${parsed.owner}/${parsed.repo}...`);

                        // Re-fetch user to get token safely inside async context if needed, 
                        // but strictly we can rely on existing checks. 
                        // Note: We need a fresh service instance or reuse one. 
                        // Ideally we pass the token. fetching user again is safest for long running text
                        const userSnapshot = await collections.users().doc(userId).get();
                        const token = userSnapshot.exists ? getActiveGithubToken(userSnapshot.data()) : null;

                        const github = new GitHubService(token);
                        const fetchedGithubData = await github.getCompleteRepoInfo(parsed.owner, parsed.repo);

                        // console.log('[Background] Running AI analysis...');
                        const groqService = getGroqService();
                        const fetchedAiAnalysis = await groqService.analyzeProjectProgress(fetchedGithubData);

                        // Handle cumulative traffic stats
                        const oldGithubData = {}; // For a new project, there is no old data to merge
                        const mergedViews = mergeTrafficHistory(oldGithubData.viewHistory, fetchedGithubData.viewHistory);
                        const mergedClones = mergeTrafficHistory(oldGithubData.cloneHistory, fetchedGithubData.cloneHistory);
                        
                        fetchedGithubData.allTimeViews = mergedViews.reduce((sum, d) => sum + (d.count || 0), 0);
                        fetchedGithubData.allTimeClones = mergedClones.reduce((sum, d) => sum + (d.count || 0), 0);

                        // Update project with analyzed data
                        await collections.projects().doc(projectId).update({
                            githubData: fetchedGithubData,
                            aiAnalysis: fetchedAiAnalysis,
                            progress: fetchedAiAnalysis?.progressPercentage || 0,
                            commits: fetchedGithubData?.totalCommits || 0,
                            technologies: fetchedGithubData?.languages?.map(l => l.name) || technologies || [],
                            isAnalyzing: false,
                            updatedAt: new Date().toISOString(),
                        });

                        // console.log(`[Background] Project ${projectId} analysis complete`);

                        // Recalculate Skills
                        const { recalculateSkills } = require('../services/skillService');
                        await recalculateSkills(userId);
                    }
                } catch (bgError) {
                    console.error(`[Background] Analysis failed for project ${projectId}:`, bgError.message);
                    // Mark analysis as failed but don't delete the project
                    try {
                        await collections.projects().doc(projectId).update({
                            isAnalyzing: false,
                            analysisError: bgError.message,
                            updatedAt: new Date().toISOString(),
                        });
                    } catch (updateError) {
                        console.error('Failed to update project with error status:', updateError);
                    }
                }
            });
        }
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

        // If githubData is being updated, merge traffic histories for "All Time" stats
        if (updates.githubData) {
            const oldGithubData = project.githubData || {};
            const newGithubData = updates.githubData;

            const mergedViews = mergeTrafficHistory(oldGithubData.viewHistory, newGithubData.viewHistory);
            const mergedClones = mergeTrafficHistory(oldGithubData.cloneHistory, newGithubData.cloneHistory);

            updateData.githubData = {
                ...newGithubData,
                viewHistory: mergedViews,
                cloneHistory: mergedClones,
                allTimeViews: mergedViews.reduce((sum, d) => sum + (d.count || 0), 0),
                allTimeClones: mergedClones.reduce((sum, d) => sum + (d.count || 0), 0)
            };
        }

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
 * Reanalyze a project from GitHub + AI and persist merged traffic totals.
 * POST /api/projects/:id/reanalyze
 */
const reanalyzeProject = async (req, res, next) => {
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

        if (!project.repositoryUrl) {
            throw new APIError('Project has no repository URL to analyze', 400);
        }

        const GitHubService = require('../services/githubService');
        const { getGroqService } = require('../services/groqService');

        const parsed = GitHubService.parseGitHubUrl(project.repositoryUrl);
        if (!parsed) {
            throw new APIError('Invalid GitHub repository URL', 400);
        }

        let githubAccessToken = null;
        const userDoc = await collections.users().doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data() || {};
            githubAccessToken = getActiveGithubToken(userData);
            if (!githubAccessToken && hasGithubAccessExpired(userData)) {
                await collections.users().doc(userId).update(buildGithubAccessClearUpdate());
            }
        }

        const github = new GitHubService(githubAccessToken);
        const fetchedGithubData = await github.getCompleteRepoInfo(parsed.owner, parsed.repo);

        const groqService = getGroqService();
        const fetchedAiAnalysis = await groqService.analyzeProjectProgress(fetchedGithubData);

        const oldGithubData = project.githubData || {};
        const mergedViews = mergeTrafficHistory(oldGithubData.viewHistory, fetchedGithubData.viewHistory);
        const mergedClones = mergeTrafficHistory(oldGithubData.cloneHistory, fetchedGithubData.cloneHistory);

        const mergedGithubData = {
            ...fetchedGithubData,
            viewHistory: mergedViews,
            cloneHistory: mergedClones,
            allTimeViews: mergedViews.reduce((sum, d) => sum + (d.count || 0), 0),
            allTimeClones: mergedClones.reduce((sum, d) => sum + (d.count || 0), 0),
        };

        await projectRef.update({
            githubData: mergedGithubData,
            aiAnalysis: fetchedAiAnalysis,
            progress: fetchedAiAnalysis?.progressPercentage || 0,
            commits: fetchedGithubData?.totalCommits || 0,
            technologies: fetchedGithubData?.languages?.map(l => l.name) || project.technologies || [],
            isAnalyzing: false,
            analysisError: null,
            lastManualRefreshAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        statsCache.del(`stats_${userId}`);

        const updatedDoc = await projectRef.get();
        res.status(200).json({
            success: true,
            message: 'Project reanalyzed successfully',
            data: {
                id: updatedDoc.id,
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
const NodeCache = require('node-cache');
const statsCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

/**
 * Get projects statistics
 * GET /api/projects/stats
 */
const getStats = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const cacheKey = `stats_${userId}`;

        // Check cache first
        const cachedStats = statsCache.get(cacheKey);
        if (cachedStats) {
            return res.status(200).json({
                success: true,
                data: cachedStats,
                fromCache: true
            });
        }

        // Optimized query: select only needed fields
        const projectsSnapshot = await collections.projects()
            .where('uid', '==', userId)
            .select('status', 'commits', 'updatedAt', 'technologies', 'githubData')
            .get();

        const projects = projectsSnapshot.docs.map((doc) => doc.data());

        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.status === 'Active').length;
        const completedProjects = projects.filter(p => p.status === 'Completed').length;
        const totalCommits = projects.reduce((sum, p) => sum + (p.commits || 0), 0);
        const totalClones = projects.reduce((sum, p) => sum + (p.githubData?.allTimeClones || p.githubData?.clones || 0), 0);
        const totalViews = projects.reduce((sum, p) => sum + (p.githubData?.allTimeViews || p.githubData?.views || 0), 0);

        // Calculate commit growth based on project update times as a proxy
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const recentActiveProjects = projects.filter(p => new Date(p.updatedAt) >= oneWeekAgo).length;
        const previousActiveProjects = projects.filter(p => new Date(p.updatedAt) >= twoWeeksAgo && new Date(p.updatedAt) < oneWeekAgo).length;

        let totalCommitGrowth = 0;
        if (previousActiveProjects === 0) {
            totalCommitGrowth = recentActiveProjects > 0 ? 15 : 0;
        } else {
            totalCommitGrowth = Math.round(((recentActiveProjects - previousActiveProjects) / previousActiveProjects) * 100);
            if (totalCommitGrowth === 0 && recentActiveProjects > 0) totalCommitGrowth = 5;
        }

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

        const statsData = {
            totalProjects,
            activeProjects,
            completedProjects,
            totalCommits,
            totalCommitGrowth,
            totalClones,
            totalViews,
            topTechnologies,
        };

        // Set cache
        statsCache.set(cacheKey, statsData);

        res.status(200).json({
            success: true,
            data: statsData,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Helper to merge traffic history and avoid duplicates
 */
const mergeTrafficHistory = (oldHistory = [], newHistory = []) => {
    if (!Array.isArray(oldHistory)) oldHistory = [];
    if (!Array.isArray(newHistory)) newHistory = [];
    
    const historyMap = new Map();
    oldHistory.forEach(item => {
        if (item && item.timestamp) historyMap.set(item.timestamp, item);
    });
    newHistory.forEach(item => {
        if (item && item.timestamp) historyMap.set(item.timestamp, item);
    });

    return Array.from(historyMap.values())
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

/**
 * Cleanup projects: remove deleted GitHub repos and duplicates
 * POST /api/projects/cleanup
 */
const cleanupProjects = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        // Fetch all user projects
        const snapshot = await collections.projects()
            .where('uid', '==', userId)
            .get();

        const allProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const projectsWithRepo = allProjects.filter(p => p.repositoryUrl);

        if (projectsWithRepo.length === 0) {
            return res.status(200).json({
                success: true,
                data: { deletedRepos: 0, duplicatesRemoved: 0, totalRemoved: 0, message: 'No linked projects to check.' }
            });
        }

        // Get fresh GitHub token
        const GitHubService = require('../services/githubService');
        let githubAccessToken = null;
        try {
            const userDoc = await collections.users().doc(userId).get();
            const userData = userDoc.data() || {};
            githubAccessToken = getActiveGithubToken(userData);
            if (!githubAccessToken && hasGithubAccessExpired(userData)) {
                await collections.users().doc(userId).update(buildGithubAccessClearUpdate());
            }
        } catch (tokenErr) {
            console.warn('Could not resolve token for cleanup:', tokenErr.message);
        }

        if (!githubAccessToken) {
            return res.status(200).json({
                success: true,
                data: { deletedRepos: 0, duplicatesRemoved: 0, totalRemoved: 0, message: 'No GitHub token available — skipping cleanup.' }
            });
        }

        const github = new GitHubService(githubAccessToken);
        const toDelete = new Set();

        // --- Pass 1: Find duplicates (keep the oldest entry, remove newer ones) ---
        const seenNormalized = new Map(); // normalized url -> project id (first seen)
        const normalizeRepoUrl = (url) => {
            if (!url) return '';
            try {
                return url.toLowerCase().trim()
                    .replace(/^https?:\/\/(www\.)?/, '')
                    .replace(/\.git$/, '')
                    .replace(/\/$/, '')
                    .replace(/^github\.com\//, '');
            } catch (e) { return url.toLowerCase().trim(); }
        };

        // Sort by createdAt ascending so we keep the oldest
        const sorted = [...projectsWithRepo].sort((a, b) =>
            new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        );

        for (const p of sorted) {
            const key = normalizeRepoUrl(p.repositoryUrl);
            if (!key) continue;
            if (seenNormalized.has(key)) {
                // Duplicate — mark for deletion
                toDelete.add(p.id);
            } else {
                seenNormalized.set(key, p.id);
            }
        }

        // --- Pass 2: Check each unique repo against GitHub ---
        const uniqueProjects = projectsWithRepo.filter(p => !toDelete.has(p.id));
        const checkPromises = uniqueProjects.map(async (project) => {
            const parsed = GitHubService.parseGitHubUrl(project.repositoryUrl);
            if (!parsed) return;
            try {
                await github.octokit.rest.repos.get({ owner: parsed.owner, repo: parsed.repo });
                // Repo exists — keep it
            } catch (err) {
                if (err.status === 404) {
                    console.log(`Repo deleted on GitHub: ${parsed.owner}/${parsed.repo} — removing project ${project.id}`);
                    toDelete.add(project.id);
                }
                // Other errors (403, 500) — skip, don't delete
            }
        });

        await Promise.all(checkPromises);

        // --- Delete all flagged projects ---
        if (toDelete.size > 0) {
            await Promise.all([...toDelete].map(id => collections.projects().doc(id).delete()));
            console.log(`Cleanup removed ${toDelete.size} project(s) for user ${userId}`);

            // Invalidate stats cache
            statsCache.del(`stats_${userId}`);
        }

        // Compute split for response
        const duplicatesRemoved = projectsWithRepo.filter(p => {
            if (!toDelete.has(p.id)) return false;
            const key = normalizeRepoUrl(p.repositoryUrl);
            return seenNormalized.get(key) !== p.id; // it was a dupe, not 404
        }).length;
        const deletedRepos = toDelete.size - duplicatesRemoved;

        res.status(200).json({
            success: true,
            data: {
                totalRemoved: toDelete.size,
                deletedRepos,
                duplicatesRemoved,
            }
        });
    } catch (error) {
        console.error('Cleanup error:', error.message);
        next(error);
    }
};

module.exports = {
    getProjects,
    getProject,
    createProject,
    updateProject,
    reanalyzeProject,
    deleteProject,
    getStats,
    cleanupProjects,
};
