/**
 * GitHub Controller
 * Handles GitHub data fetching and storage
 */

const GitHubService = require('../services/githubService');
const { collections } = require('../config/firebase');
const { APIError } = require('../middleware/errorHandler');

/**
 * Get user's GitHub activity summary
 * GET /api/github/activity
 */
const getActivity = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        // Get user's GitHub username from Firestore
        const userDoc = await collections.users().doc(userId).get();

        if (!userDoc.exists) {
            throw new APIError('User not found', 404);
        }

        const user = userDoc.data();

        if (!user.githubUsername) {
            throw new APIError('GitHub account not connected', 400);
        }

        const githubService = new GitHubService();
        const activity = await githubService.getActivitySummary(user.githubUsername);

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
const NodeCache = require('node-cache');
const githubCache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

/**
 * Get user's recent commits
 * GET /api/github/commits
 */
const getCommits = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const days = parseInt(req.query.days) || 7;
        const cacheKey = `commits_${userId}_${days}`;

        // Check cache first
        const cachedCommits = githubCache.get(cacheKey);
        if (cachedCommits) {
            return res.status(200).json({
                success: true,
                data: cachedCommits,
                fromCache: true
            });
        }

        const userDoc = await collections.users().doc(userId).get();

        if (!userDoc.exists) {
            throw new APIError('User not found', 404);
        }

        const user = userDoc.data();

        if (!user.githubUsername) {
            // Return empty array instead of error - more graceful for dashboard
            console.log(`ℹ️ User ${userId} has no GitHub username linked`);
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

        // Get FRESH OAuth token from Clerk for accurate contribution data
        let githubAccessToken = user.githubAccessToken || null;

        try {
            const { clerkClient } = require('@clerk/clerk-sdk-node');
            const oauthTokens = await clerkClient.users.getUserOauthAccessToken(
                userId,
                'oauth_github'
            );

            if (oauthTokens?.data?.[0]?.token) {
                githubAccessToken = oauthTokens.data[0].token;
                console.log('🔑 Using FRESH OAuth token from Clerk for contributions');

                // Update the cached token in Firestore for future use
                // Don't await this to speed up response
                collections.users().doc(userId).update({
                    githubAccessToken: githubAccessToken,
                    updatedAt: new Date().toISOString()
                }).catch(err => console.error('Failed to update token cache:', err.message));
            } else {
                console.log('⚠️ No fresh OAuth token available, using cached or PAT');
            }
        } catch (tokenErr) {
            console.warn('⚠️ Could not get fresh OAuth token from Clerk:', tokenErr.message);
        }

        console.log(`🔍 Fetching GitHub data for user: ${user.githubUsername} (userId: ${userId})`);
        console.log(`🔑 Using ${githubAccessToken ? 'user OAuth token' : 'server PAT'}`);

        // Use fresh OAuth token if available for accurate contributions (including private)
        const githubService = new GitHubService(githubAccessToken);

        // Fetch 14 days of data to calculate WoW growth
        const result = await githubService.getRecentCommits(user.githubUsername, 14);

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

        const responseData = {
            username: user.githubUsername,
            days,
            totalCommits: currentWeekCommits, // Show last 7 days count by default
            totalContributions: result.totalContributions || currentWeekCommits,
            streak: currentStreak,
            commits: allCommits.filter(c => new Date(c.date) >= oneWeekAgo), // Recent commits
            commitGrowth,
            streakGrowth
        };

        // Cache the result
        githubCache.set(cacheKey, responseData);

        res.status(200).json({
            success: true,
            data: responseData,
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

        const userDoc = await collections.users().doc(userId).get();
        if (!userDoc.exists) {
            throw new APIError('User not found', 404);
        }

        let user = userDoc.data();
        let githubAccessToken = user.githubAccessToken || null;

        // Get fresh OAuth token from Clerk for full access
        const { clerkClient } = require('@clerk/clerk-sdk-node');
        try {
            const oauthTokens = await clerkClient.users.getUserOauthAccessToken(userId, 'oauth_github');
            if (oauthTokens?.data?.[0]?.token) {
                githubAccessToken = oauthTokens.data[0].token;
            }
        } catch (tokenErr) {
            console.warn('Could not get fresh OAuth token:', tokenErr.message);
        }

        // Auto-sync GitHub username if missing
        if (!user.githubUsername) {
            console.log('🔄 GitHub username missing, attempting auto-sync...');
            try {
                const clerkUser = await clerkClient.users.getUser(userId);
                let githubUsername = null;

                // Check externalAccounts
                if (clerkUser.externalAccounts) {
                    const ghAccount = clerkUser.externalAccounts.find(
                        acc => acc.provider === 'github' || acc.provider === 'oauth_github'
                    );
                    if (ghAccount) {
                        githubUsername = ghAccount.username;
                    }
                }

                // Fallback: try GitHub API with token
                if (!githubUsername && githubAccessToken) {
                    const { Octokit } = require('octokit');
                    const octokit = new Octokit({ auth: githubAccessToken });
                    const { data: ghUser } = await octokit.rest.users.getAuthenticated();
                    githubUsername = ghUser.login;
                }

                if (githubUsername) {
                    await collections.users().doc(userId).update({
                        githubUsername,
                        githubAccessToken,
                        updatedAt: new Date().toISOString()
                    });
                    user.githubUsername = githubUsername;
                    console.log('✅ Auto-synced GitHub username:', githubUsername);
                } else {
                    throw new APIError('GitHub account not connected. Please sign out and sign in with GitHub.', 400);
                }
            } catch (syncErr) {
                console.error('Auto-sync failed:', syncErr.message);
                throw new APIError('GitHub account not connected. Please sign out and sign in with GitHub.', 400);
            }
        }

        const githubService = new GitHubService(githubAccessToken);
        const insights = await githubService.getGitHubInsights(user.githubUsername);

        res.status(200).json({
            success: true,
            data: insights,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Search for similar open-source projects based on AI analysis of user's repos and READMEs
 * GET /api/github/similar-projects
 */
const getSimilarProjects = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { languages, topics, minStars, limit } = req.query;

        // Parse query params
        let languageArray = languages ? languages.split(',').map(l => l.trim()) : [];
        let topicArray = topics ? topics.split(',').map(t => t.trim()) : [];
        const stars = parseInt(minStars) || 50;
        const perPage = parseInt(limit) || 12;

        // Get user data for GitHub access
        const userDoc = await collections.users().doc(userId).get();
        if (!userDoc.exists) {
            throw new APIError('User not found', 404);
        }
        const user = userDoc.data();

        // If no filters provided, use AI to analyze user's GitHub repos
        if (languageArray.length === 0 && topicArray.length === 0 && user.githubUsername) {
            console.log(`🤖 Using AI to analyze repos for ${user.githubUsername}...`);

            try {
                // Get user's GitHub access token for private repos
                let githubAccessToken = user.githubAccessToken || null;
                const { clerkClient } = require('@clerk/clerk-sdk-node');
                try {
                    const oauthTokens = await clerkClient.users.getUserOauthAccessToken(userId, 'oauth_github');
                    if (oauthTokens?.data?.[0]?.token) {
                        githubAccessToken = oauthTokens.data[0].token;
                    }
                } catch (tokenErr) {
                    console.warn('Could not get OAuth token:', tokenErr.message);
                }

                const githubService = new GitHubService(githubAccessToken);

                // Fetch user's actual GitHub repos
                const repos = await githubService.getRepos(user.githubUsername, 10);
                console.log(`📦 Fetched ${repos.length} repos for analysis`);

                // Fetch READMEs from top repos (limit to 3 for performance)
                const readmePromises = repos.slice(0, 3).map(async (repo) => {
                    try {
                        const [owner, repoName] = repo.full_name ? repo.full_name.split('/') : [user.githubUsername, repo.name];
                        return await githubService.getReadme(owner, repoName);
                    } catch (err) {
                        return null;
                    }
                });
                const readmeContents = await Promise.all(readmePromises);
                console.log(`📄 Fetched ${readmeContents.filter(r => r).length} READMEs`);

                // Use AI to analyze repos and extract keywords
                const getGroqService = require('../services/groqService');
                const groqService = getGroqService();

                const analysis = await groqService.analyzeReposForSimilarProjects(repos, readmeContents);

                if (analysis.success) {
                    console.log('🧠 AI README Analysis Results:');
                    console.log(`   Core Features: ${analysis.coreFeatures?.join(', ') || 'N/A'}`);
                    console.log(`   Tech Stack: ${analysis.techStackKeywords?.join(', ') || 'N/A'}`);
                    console.log(`   Project Purpose: ${analysis.projectPurpose?.join(', ') || 'N/A'}`);
                    console.log(`   Search Terms: ${analysis.searchTerms?.join(', ') || 'N/A'}`);
                    console.log(`   Suggested Query: ${analysis.suggestedSearchQuery || 'N/A'}`);

                    // Build search parameters from AI README analysis
                    // Prioritize core features and project purpose for README-similar matching
                    const aiTopics = [
                        ...analysis.searchTerms?.slice(0, 3) || [],
                        ...analysis.coreFeatures?.slice(0, 2) || [],
                        ...analysis.projectPurpose?.slice(0, 1) || [],
                    ].filter(Boolean);

                    if (aiTopics.length > 0) {
                        topicArray.push(...aiTopics);
                    }

                    // Extract languages from repos
                    const repoLanguages = repos
                        .map(r => r.language)
                        .filter(Boolean)
                        .reduce((acc, lang) => {
                            acc[lang] = (acc[lang] || 0) + 1;
                            return acc;
                        }, {});

                    languageArray = Object.entries(repoLanguages)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([lang]) => lang);
                }
            } catch (aiError) {
                console.error('AI analysis failed, falling back to basic search:', aiError.message);
            }
        }

        // Fallback: try to get languages from saved DevTrack projects
        if (languageArray.length === 0) {
            const projectsSnapshot = await collections.projects()
                .where('uid', '==', userId)
                .limit(10)
                .get();

            const userLanguages = new Set();
            projectsSnapshot.forEach(doc => {
                const project = doc.data();
                if (project.languages && Array.isArray(project.languages)) {
                    project.languages.forEach(lang => {
                        if (lang.name) userLanguages.add(lang.name);
                    });
                }
                if (project.primaryLanguage) {
                    userLanguages.add(project.primaryLanguage);
                }
            });

            if (userLanguages.size > 0) {
                languageArray.push(...Array.from(userLanguages).slice(0, 3));
            }
        }

        // If still no languages, use common ones
        if (languageArray.length === 0) {
            languageArray.push('JavaScript', 'TypeScript', 'Python');
        }

        console.log(`🔍 Final search parameters:`);
        console.log(`   Languages: ${languageArray.join(', ')}`);
        console.log(`   Topics: ${topicArray.join(', ') || 'none'}`);

        const githubService = new GitHubService();
        const results = await githubService.searchSimilarProjects(
            languageArray,
            topicArray,
            stars,
            perPage
        );

        res.status(200).json({
            success: true,
            data: results,
            aiEnhanced: topicArray.length > 0, // Flag to indicate AI was used
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Download weekly PDF report
 * GET /api/github/report
 */
const downloadReport = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        console.log(`📄 Generating PDF report for user ${userId}...`);

        const reportService = require('../services/reportService');
        const pdfBuffer = await reportService.generatePDFReport(userId);

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=devtrack-report-${new Date().toISOString().split('T')[0]}.pdf`);
        res.setHeader('Content-Length', pdfBuffer.length);

        console.log(`✅ PDF report generated, sending ${pdfBuffer.length} bytes`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('❌ Report generation error:', error.message);
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
    getSimilarProjects,
    downloadReport,
};

