/**
 * GitHub Controller
 * Handles GitHub data fetching and storage
 */

const GitHubService = require('../services/githubService');
const { collections } = require('../config/firebase');
const { APIError } = require('../middleware/errorHandler');
const { clerkClient } = require('@clerk/clerk-sdk-node');

/**
 * Helper to ensure user has GitHub username and get fresh token
 */
const ensureGitHubData = async (userId) => {
    let userDoc = await collections.users().doc(userId).get();
    if (!userDoc.exists) {
        // Try a quick sync if doc doesn't exist
        const { syncUser } = require('./authController');
        // This is still a bit cyclic but we need a way to bootstrap the user
        // Alternative: just return null/throw if doc is missing
        return { user: null, githubUsername: null, githubAccessToken: null };
    }

    let user = userDoc.data();
    let githubUsername = user.githubUsername;
    let githubAccessToken = user.githubAccessToken;

    // 1. If username missing, try fetching from Clerk
    if (!githubUsername) {
        try {
            const clerkUser = await clerkClient.users.getUser(userId);
            if (clerkUser.externalAccounts) {
                const githubAccount = clerkUser.externalAccounts.find(
                    (acc) => acc.provider === 'github' || acc.provider === 'oauth_github'
                );
                if (githubAccount) {
                    githubUsername = githubAccount.username || githubAccount.externalId;
                    console.log(`✅ [Auto-Sync] Found GitHub username: ${githubUsername}`);

                    await collections.users().doc(userId).update({
                        githubUsername: githubUsername,
                        updatedAt: new Date().toISOString()
                    });
                }
            }
        } catch (e) {
            console.warn(`⚠️ [Auto-Sync] Clerk fetch failed for ${userId}:`, e.message);
        }
    }

    // 2. Always try to get a FRESH OAuth token from Clerk
    try {
        const oauthTokens = await clerkClient.users.getUserOauthAccessToken(userId, 'oauth_github');
        if (oauthTokens?.data?.[0]?.token) {
            githubAccessToken = oauthTokens.data[0].token;
            // Update cached token
            await collections.users().doc(userId).update({
                githubAccessToken: githubAccessToken,
                updatedAt: new Date().toISOString()
            });
        }
    } catch (tokenErr) {
        console.warn(`⚠️ [OAuth] Could not refresh token for ${userId}:`, tokenErr.message);
    }

    return { user, githubUsername, githubAccessToken };
};

/**
 * Get user's GitHub activity summary
 * GET /api/github/activity
 */
const getActivity = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        const { githubUsername, githubAccessToken } = await ensureGitHubData(userId);

        if (!githubUsername) {
            throw new APIError('GitHub account not connected', 400);
        }

        const githubService = new GitHubService(githubAccessToken);
        const activity = await githubService.getActivitySummary(githubUsername);

        // Store activity snapshot in Firestore
        await collections.activities().doc(`${userId}_${Date.now()}`).set({
            uid: userId,
            date: new Date().toISOString(),
            ...activity,
        });

        res.status(200).json({
            success: true,
            data: {
                username: user.githubUsername,
                activity,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's recent commits
 * GET /api/github/commits
 */
const getCommits = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const days = parseInt(req.query.days) || 7;

        const { githubUsername, githubAccessToken } = await ensureGitHubData(userId);

        if (!githubUsername) {
            console.log(`ℹ️ User ${userId} still has no GitHub username linked`);
            return res.status(200).json({
                success: true,
                data: {
                    username: null,
                    days,
                    totalCommits: 0,
                    commits: [],
                    streak: 0,
                    message: 'GitHub account not linked. Add your GitHub username in profile settings.'
                },
            });
        }

        console.log(`🔍 Fetching GitHub data for user: ${githubUsername} (userId: ${userId})`);
        console.log(`🔑 Using ${githubAccessToken ? 'user OAuth token' : 'server PAT'}`);

        // Use fresh OAuth token if available for accurate contributions (including private)
        const githubService = new GitHubService(githubAccessToken);

        // Fetch 14 days of data to calculate WoW growth
        const result = await githubService.getRecentCommits(githubUsername, 14);

        // Handle both old array format and new object format
        const allCommits = Array.isArray(result) ? result : (result.commits || []);
        const currentStreak = result.streak || 0;

        console.log(`📈 Fetched ${allCommits.length} commits, streak: ${currentStreak}, totalContributions: ${result.totalContributions || 'N/A'}`);

        // Calculate WoW growth
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const currentWeekCommits = allCommits.filter(c => new Date(c.date) >= oneWeekAgo).length;
        const previousWeekCommits = allCommits.filter(c => new Date(c.date) < oneWeekAgo).length;

        let commitGrowth = 0;
        if (previousWeekCommits === 0) {
            commitGrowth = currentWeekCommits > 0 ? 100 : 0;
        } else {
            commitGrowth = Math.round(((currentWeekCommits - previousWeekCommits) / previousWeekCommits) * 100);
        }

        // For Streak Growth, we can compare current streak vs a stored value or just provide a placeholder 
        // if we don't have historical streak data. Let's use 0 for now or a simple logic.
        let streakGrowth = currentStreak > 0 ? 10 : 0;

        res.status(200).json({
            success: true,
            data: {
                username: user.githubUsername,
                days,
                totalCommits: currentWeekCommits, // Show last 7 days count by default
                totalContributions: result.totalContributions || currentWeekCommits,
                streak: currentStreak,
                commits: allCommits.filter(c => new Date(c.date) >= oneWeekAgo), // Recent commits
                commitGrowth,
                streakGrowth
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's repositories
 * GET /api/github/repos
 */
const getRepos = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const limit = parseInt(req.query.limit) || 10;

        const userDoc = await collections.users().doc(userId).get();

        if (!userDoc.exists) {
            throw new APIError('User not found', 404);
        }

        const user = userDoc.data();

        if (!user.githubUsername) {
            throw new APIError('GitHub account not connected', 400);
        }

        const githubService = new GitHubService();
        const repos = await githubService.getRepos(user.githubUsername, limit);

        res.status(200).json({
            success: true,
            data: {
                username: user.githubUsername,
                totalRepos: repos.length,
                repos,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get languages used in user's repos
 * GET /api/github/languages
 */
const getLanguages = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        const userDoc = await collections.users().doc(userId).get();

        if (!userDoc.exists) {
            throw new APIError('User not found', 404);
        }

        const user = userDoc.data();

        if (!user.githubUsername) {
            throw new APIError('GitHub account not connected', 400);
        }

        const githubService = new GitHubService();
        const languages = await githubService.getLanguages(user.githubUsername);

        res.status(200).json({
            success: true,
            data: {
                username: user.githubUsername,
                languages,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's GitHub profile
 * GET /api/github/profile
 */
const getProfile = async (req, res, next) => {
    try {
        const githubService = new GitHubService();
        const profile = await githubService.getUser();

        res.status(200).json({
            success: true,
            data: profile,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Analyze a specific repository
 * GET /api/github/repo/:owner/:repo
 */
const analyzeRepo = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;

        if (!owner || !repo) {
            throw new APIError('Owner and repo are required', 400);
        }

        // Try to get user's GitHub token for private repo access
        let userToken = null;
        if (req.auth?.userId) {
            try {
                const userDoc = await collections.users().doc(req.auth.userId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    if (userData.githubAccessToken) {
                        userToken = userData.githubAccessToken;
                        console.log('🔑 Using user OAuth token for private access');
                    }
                }
            } catch (tokenErr) {
                console.warn('⚠️ Could not retrieve user token, falling back to PAT');
            }
        }

        // Use user token if available, otherwise fallback to PAT
        const githubService = new GitHubService(userToken);
        const repoInfo = await githubService.getRepoInfo(owner, repo);

        res.status(200).json({
            success: true,
            data: repoInfo,
        });
    } catch (error) {
        // If it's a 404 and we used user token, provide a helpful message
        if (error.status === 404 || error.message?.includes('Not Found')) {
            return res.status(404).json({
                success: false,
                error: 'Repository not found. If this is a private repo, ensure your GitHub account has access.',
            });
        }
        next(error);
    }
};

/**
 * Get languages for a specific repository
 * GET /api/github/repo/:owner/:repo/languages
 */
const getRepoLanguages = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;

        if (!owner || !repo) {
            throw new APIError('Owner and repo are required', 400);
        }

        // Try to get user's GitHub token for private repo access
        let userToken = null;
        if (req.auth?.userId) {
            try {
                const userDoc = await collections.users().doc(req.auth.userId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    if (userData.githubAccessToken) {
                        userToken = userData.githubAccessToken;
                    }
                }
            } catch (tokenErr) {
                console.warn('⚠️ Could not retrieve user token');
            }
        }

        const githubService = new GitHubService(userToken);
        const languages = await githubService.getRepoLanguagesOnly(owner, repo);

        res.status(200).json({
            success: true,
            data: { languages },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new GitHub repository
 * POST /api/github/repo
 */
const createRepo = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { name, description, isPrivate } = req.body;

        if (!name) {
            throw new APIError('Repository name is required', 400);
        }

        // Get FRESH token from Clerk (not cached Firestore token)
        const { clerkClient } = require('@clerk/clerk-sdk-node');
        let githubAccessToken = null;

        try {
            const oauthTokens = await clerkClient.users.getUserOauthAccessToken(
                userId,
                'oauth_github'
            );
            console.log('🔐 Fresh OAuth tokens from Clerk:', JSON.stringify(oauthTokens?.data, null, 2));

            if (oauthTokens?.data?.[0]?.token) {
                githubAccessToken = oauthTokens.data[0].token;

                // Also update the cached token in Firestore
                await collections.users().doc(userId).update({
                    githubAccessToken: githubAccessToken,
                    updatedAt: new Date().toISOString()
                });
                console.log('✅ Updated cached token in Firestore');
            }
        } catch (tokenErr) {
            console.error('❌ Failed to get fresh token from Clerk:', tokenErr.message);
        }

        if (!githubAccessToken) {
            throw new APIError('GitHub account not properly connected. Please sign out and sign in again with GitHub to grant repository access.', 400);
        }

        const { Octokit } = require('octokit');
        const octokit = new Octokit({ auth: githubAccessToken });

        console.log('🔧 Attempting to create repo:', name);

        // First, verify the token has proper scopes by checking user info
        try {
            const { headers } = await octokit.rest.users.getAuthenticated();
            const scopes = headers['x-oauth-scopes'] || '';
            console.log('📋 GitHub token scopes:', scopes);

            if (!scopes.includes('repo') && !scopes.includes('public_repo')) {
                return res.status(403).json({
                    success: false,
                    error: 'Your GitHub token does not have repository creation permissions. Please configure your Clerk dashboard to request the "repo" scope for GitHub OAuth, then sign out and sign in again.',
                });
            }
        } catch (scopeErr) {
            console.error('⚠️ Could not verify token scopes:', scopeErr.message);
        }

        // Create the repository
        const { data: newRepo } = await octokit.rest.repos.createForAuthenticatedUser({
            name,
            description: description || '',
            private: isPrivate || false,
            auto_init: true, // Initialize with README
        });

        console.log('✅ Created GitHub repo:', newRepo.full_name);

        res.status(201).json({
            success: true,
            data: {
                name: newRepo.name,
                fullName: newRepo.full_name,
                url: newRepo.html_url,
                cloneUrl: newRepo.clone_url,
                description: newRepo.description,
                private: newRepo.private,
            },
        });
    } catch (error) {
        console.error('❌ Create repo error:', error.status, error.message);

        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                error: 'GitHub API endpoint not found. This usually means your GitHub token lacks the "repo" scope. Please sign out and sign in again with GitHub.',
            });
        }
        if (error.status === 422) {
            return res.status(422).json({
                success: false,
                error: 'Repository name already exists or is invalid.',
            });
        }
        if (error.status === 401) {
            return res.status(401).json({
                success: false,
                error: 'GitHub authentication failed. Please sign out and sign in again.',
            });
        }
        if (error.status === 403) {
            return res.status(403).json({
                success: false,
                error: 'Permission denied. Your GitHub token may not have repository creation permissions. Please sign out and sign in again.',
            });
        }
        next(error);
    }
};

/**
 * Get comprehensive GitHub insights for bento grid
 * GET /api/github/insights
 */
const getInsights = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        const { githubUsername, githubAccessToken } = await ensureGitHubData(userId);

        if (!githubUsername) {
            throw new APIError('GitHub account not connected', 400);
        }

        const githubService = new GitHubService(githubAccessToken);
        const insights = await githubService.getGitHubInsights(githubUsername);

        res.status(200).json({
            success: true,
            data: insights,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getActivity,
    getCommits,
    getRepos,
    getLanguages,
    getProfile,
    analyzeRepo,
    getRepoLanguages,
    createRepo,
    getInsights,
};

