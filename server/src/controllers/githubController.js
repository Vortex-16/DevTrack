/**
 * GitHub Controller
 * Handles GitHub data fetching and storage
 *
 * SECURITY FIX: resolveGithubTokenForUser now guards against re-fetching on
 * every request. Token is only re-fetched when:
 *   1. No encrypted token stored AND
 *   2. User has an active grant window (githubAccessGrantedAt is set) AND
 *   3. User has the repo scope on their Clerk account
 *
 * This eliminates the "repeated GitHub permission prompt" bug.
 */

const GitHubService = require('../services/githubService');
const { collections } = require('../config/firebase');
const { APIError } = require('../middleware/errorHandler');
const { clerkClient } = require('@clerk/clerk-sdk-node');
const cache = require('../config/cache');
const {
    getActiveGithubToken,
    hasGithubAccessExpired,
    buildGithubAccessUpdate,
    buildGithubAccessClearUpdate,
    getGithubAccessWindow,
} = require('../services/githubAccessService');

// ─── Scope Helpers ─────────────────────────────────────────────────────────────

const hasRepoScopeFromClerkUser = (clerkUser) => {
    const githubAccount = clerkUser?.externalAccounts?.find(
        (acc) => acc.provider === 'github' || acc.provider === 'oauth_github'
    );
    if (!githubAccount) return false;

    const approvedScopes = githubAccount.approvedScopes || '';
    if (Array.isArray(approvedScopes)) {
        return approvedScopes.includes('repo');
    }
    return String(approvedScopes)
        .split(/[\s,]+/)
        .map((scope) => scope.trim())
        .filter(Boolean)
        .includes('repo');
};

// ─── Token Resolution (fixed: no more re-fetch on every call) ─────────────────

/**
 * Resolve a GitHub OAuth token for a user, with strict guards to prevent
 * unnecessary Clerk API calls on every request.
 *
 * Only attempts Clerk token fetch when ALL conditions are true:
 *  - No active encrypted token in Firestore
 *  - User has `githubAccessGrantedAt` set (they previously authorized)
 *  - The stored access window has NOT expired
 *  - The user's Clerk account has the `repo` scope
 *
 * @param {string} userId - Firestore user doc ID
 * @param {object} userData - Firestore user document data
 * @returns {string|null} GitHub OAuth token or null
 */
const resolveGithubTokenForUser = async (userId, userData) => {
    const now = new Date();

    // Step 1: Try the stored encrypted token first (fast path)
    const token = getActiveGithubToken(userData, now);
    if (token) return token;

    // Step 2: If the stored window has expired — clear it and bail out
    if (hasGithubAccessExpired(userData, now)) {
        await collections.users().doc(userId)
            .update(buildGithubAccessClearUpdate(now))
            .catch(() => null);
        return null;
    }

    // Step 3: Only attempt Clerk re-fetch if user has a valid grant window
    // (i.e., they previously clicked "grant private access" but token is missing from store)
    const hasGrantWindow = !!userData.githubAccessGrantedAt;
    if (!hasGrantWindow) {
        // User never granted extended access — do not prompt/re-fetch
        return null;
    }

    const { expiresAt } = getGithubAccessWindow(userData);
    const expiryDate = expiresAt ? new Date(expiresAt) : null;
    const isWindowValid = !expiryDate || Number.isNaN(expiryDate.getTime()) || expiryDate > now;
    if (!isWindowValid) return null;

    // Step 4: Fetch fresh token from Clerk (only happens when above conditions pass)
    try {
        const clerkUser = await clerkClient.users.getUser(userId);

        // Only fetch if the user has the repo scope — avoids pointless API calls
        if (!hasRepoScopeFromClerkUser(clerkUser)) return null;

        const providerKeys = ['github', 'oauth_github'];
        let freshToken = null;
        for (const providerKey of providerKeys) {
            try {
                const oauthTokens = await clerkClient.users.getUserOauthAccessToken(userId, providerKey);
                const tokenObj = oauthTokens?.data ? oauthTokens.data[0] : oauthTokens?.[0];
                freshToken = tokenObj?.token || null;
                if (freshToken) break;
            } catch {
                // Try next provider key
            }
        }

        if (!freshToken) return null;

        // Persist fresh token to avoid another Clerk round-trip next time
        await collections.users().doc(userId).update(
            buildGithubAccessUpdate(freshToken, userData, now)
        ).catch(() => null);

        return freshToken;
    } catch {
        return null;
    }
};

// ─── Controllers ───────────────────────────────────────────────────────────────

/**
 * Get user's GitHub activity summary
 * GET /api/github/activity
 */
const getActivity = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        const userDoc = await collections.users().doc(userId).get();
        if (!userDoc.exists) throw new APIError('User not found', 404);

        const user = userDoc.data();
        if (!user.githubUsername) throw new APIError('GitHub account not connected', 400);

        const githubService = new GitHubService();
        const activity = await githubService.getActivitySummary(user.githubUsername);

        await collections.activities().doc(`${userId}_${Date.now()}`).set({
            uid: userId,
            date: new Date().toISOString(),
            ...activity,
        });

        res.status(200).json({
            success: true,
            data: { username: user.githubUsername, activity },
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
        const cacheKey = `commits_${userId}_${days}`;

        // Cache hit
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.status(200).json({ success: true, data: cached, fromCache: true });
        }

        const userDoc = await collections.users().doc(userId).get();
        if (!userDoc.exists) throw new APIError('User not found', 404);

        const user = userDoc.data();

        if (!user.githubUsername) {
            return res.status(200).json({
                success: true,
                data: {
                    username: null,
                    days,
                    totalCommits: 0,
                    commits: [],
                    streak: 0,
                    message: 'GitHub account not linked. Add your GitHub username in profile settings.',
                },
            });
        }

        const githubAccessToken = await resolveGithubTokenForUser(userId, user);
        console.log(`🔑 Commits: using ${githubAccessToken ? 'user OAuth token' : 'server PAT'} for ${user.githubUsername}`);

        const githubService = new GitHubService(githubAccessToken);
        const result = await githubService.getRecentCommits(user.githubUsername, 360);

        const allCommits = Array.isArray(result) ? result : (result.commits || []);
        const currentStreak = result.streak || 0;

        const now = new Date();
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        oneWeekAgo.setHours(0, 0, 0, 0);

        const twoWeeksAgo = new Date(now);
        twoWeeksAgo.setDate(now.getDate() - 14);
        twoWeeksAgo.setHours(0, 0, 0, 0);

        const currentWeekCommits = allCommits.filter(c => new Date(c.date) >= oneWeekAgo).length;
        const previousWeekCommits = allCommits.filter(c => {
            const date = new Date(c.date);
            return date >= twoWeeksAgo && date < oneWeekAgo;
        }).length;

        let commitGrowth = 0;
        if (previousWeekCommits === 0) {
            commitGrowth = currentWeekCommits > 0 ? 100 : 0;
        } else {
            commitGrowth = Math.round(((currentWeekCommits - previousWeekCommits) / previousWeekCommits) * 100);
        }

        const streakGrowth = currentStreak > 0 ? 10 : 0;

        const responseData = {
            username: user.githubUsername,
            days,
            totalCommits: currentWeekCommits,
            totalContributions: result.totalContributions || currentWeekCommits,
            streak: currentStreak,
            commits: allCommits.filter(c => new Date(c.date) >= oneWeekAgo),
            commitGrowth,
            streakGrowth,
        };

        cache.set(cacheKey, responseData, cache.TTL.GITHUB_COMMITS);

        res.status(200).json({ success: true, data: responseData });
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
        const filterImported = req.query.filterImported === 'true';
        const cacheKey = `repos_${userId}_${limit}_${filterImported}`;

        if (!filterImported) {
            const cached = cache.get(cacheKey);
            if (cached) {
                return res.status(200).json({ success: true, data: cached, fromCache: true });
            }
        }

        const userDoc = await collections.users().doc(userId).get();
        if (!userDoc.exists) throw new APIError('User not found', 404);

        const user = userDoc.data();
        if (!user.githubUsername) throw new APIError('GitHub account not connected', 400);

        const githubAccessToken = await resolveGithubTokenForUser(userId, user);
        const githubService = new GitHubService(githubAccessToken);
        let repos = await githubService.getRepos(user.githubUsername, limit);

        if (filterImported) {
            const normalizeUrl = (url) => {
                if (!url) return '';
                try {
                    return url.toLowerCase().trim()
                        .replace(/^https?:\/\/(www\.)?/, '')
                        .replace(/\.git$/, '')
                        .replace(/\/$/, '')
                        .replace(/^github\.com\//, '');
                } catch {
                    return url.toLowerCase().trim();
                }
            };

            const allProjectsSnapshot = await collections.projects()
                .where('uid', '==', userId)
                .select('repositoryUrl', 'name')
                .get();

            const existingUrls = new Set();
            const existingNames = new Set();

            allProjectsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.repositoryUrl) existingUrls.add(normalizeUrl(data.repositoryUrl));
                if (data.name) existingNames.add(data.name.toLowerCase());
            });

            repos = repos.filter(repo => {
                const normalizedUrl = normalizeUrl(repo.url);
                return !existingUrls.has(normalizedUrl) && !existingNames.has(repo.name?.toLowerCase());
            });
        }

        const responseData = {
            username: user.githubUsername,
            totalRepos: repos.length,
            repos,
        };

        if (!filterImported) {
            cache.set(cacheKey, responseData, cache.TTL.GITHUB_REPOS);
        }

        res.status(200).json({ success: true, data: responseData });
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
        const cacheKey = `languages_${userId}`;

        const cached = cache.get(cacheKey);
        if (cached) {
            return res.status(200).json({ success: true, data: cached, fromCache: true });
        }

        const userDoc = await collections.users().doc(userId).get();
        if (!userDoc.exists) throw new APIError('User not found', 404);

        const user = userDoc.data();
        if (!user.githubUsername) throw new APIError('GitHub account not connected', 400);

        const githubService = new GitHubService();
        const languages = await githubService.getLanguages(user.githubUsername);

        const responseData = { username: user.githubUsername, languages };
        cache.set(cacheKey, responseData, cache.TTL.LANGUAGES);

        res.status(200).json({ success: true, data: responseData });
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
        res.status(200).json({ success: true, data: profile });
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

        if (!owner || !repo) throw new APIError('Owner and repo are required', 400);

        let userToken = null;
        if (req.auth?.userId) {
            try {
                const userDoc = await collections.users().doc(req.auth.userId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const activeToken = getActiveGithubToken(userData);
                    if (activeToken) {
                        userToken = activeToken;
                    } else if (hasGithubAccessExpired(userData)) {
                        collections.users().doc(req.auth.userId)
                            .update(buildGithubAccessClearUpdate())
                            .catch(() => null);
                    }
                }
            } catch {
                console.warn('⚠️ Could not retrieve user token, falling back to PAT');
            }
        }

        const githubService = new GitHubService(userToken);
        const repoInfo = await githubService.getRepoInfo(owner, repo);

        res.status(200).json({ success: true, data: repoInfo });
    } catch (error) {
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
        if (!owner || !repo) throw new APIError('Owner and repo are required', 400);

        let userToken = null;
        if (req.auth?.userId) {
            try {
                const userDoc = await collections.users().doc(req.auth.userId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const activeToken = getActiveGithubToken(userData);
                    if (activeToken) {
                        userToken = activeToken;
                    } else if (hasGithubAccessExpired(userData)) {
                        collections.users().doc(req.auth.userId)
                            .update(buildGithubAccessClearUpdate())
                            .catch(() => null);
                    }
                }
            } catch {
                console.warn('⚠️ Could not retrieve user token');
            }
        }

        const githubService = new GitHubService(userToken);
        const languages = await githubService.getRepoLanguagesOnly(owner, repo);

        res.status(200).json({ success: true, data: { languages } });
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

        if (!name) throw new APIError('Repository name is required', 400);

        // Basic repo name validation (alphanumeric, hyphens, underscores, dots)
        if (!/^[a-zA-Z0-9._-]{1,100}$/.test(name)) {
            throw new APIError('Repository name contains invalid characters', 400);
        }

        const userDoc = await collections.users().doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        const githubAccessToken = getActiveGithubToken(userData);

        if (!githubAccessToken && hasGithubAccessExpired(userData)) {
            await collections.users().doc(userId).update(buildGithubAccessClearUpdate());
        }

        if (!githubAccessToken) {
            throw new APIError('Private repository access expired or not connected. Reauthorize GitHub from settings to continue.', 400);
        }

        const { Octokit } = require('octokit');
        const octokit = new Octokit({ auth: githubAccessToken });

        try {
            const { headers } = await octokit.rest.users.getAuthenticated();
            const scopes = headers['x-oauth-scopes'] || '';

            if (!scopes.includes('repo') && !scopes.includes('public_repo')) {
                return res.status(403).json({
                    success: false,
                    error: 'Your GitHub token does not have repository creation permissions. Please reconnect GitHub from settings.',
                    needsScopeUpgrade: true,
                    requiredScopes: ['repo'],
                });
            }
        } catch (scopeErr) {
            console.error('⚠️ Could not verify token scopes:', scopeErr.message);
        }

        const { data: newRepo } = await octokit.rest.repos.createForAuthenticatedUser({
            name,
            description: description || '',
            private: isPrivate || false,
            auto_init: true,
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

        if (error.status === 422) {
            return res.status(422).json({ success: false, error: 'Repository name already exists or is invalid.' });
        }
        if (error.status === 401) {
            return res.status(401).json({ success: false, error: 'GitHub authentication failed. Please sign out and sign in again.' });
        }
        if (error.status === 403) {
            return res.status(403).json({ success: false, error: 'Permission denied. Your GitHub token may not have repository creation permissions.', needsScopeUpgrade: true });
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
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        const { userId } = req.auth;
        const cacheKey = `insights_${userId}`;

        const cached = cache.get(cacheKey);
        if (cached) {
            return res.status(200).json({ success: true, data: cached, fromCache: true });
        }

        const userDoc = await collections.users().doc(userId).get();
        if (!userDoc.exists) throw new APIError('User not found', 404);

        let user = userDoc.data();
        const githubAccessToken = await resolveGithubTokenForUser(userId, user);

        // Auto-sync GitHub username if missing
        if (!user.githubUsername) {
            console.log('🔄 GitHub username missing, attempting auto-sync...');
            try {
                const clerkUser = await clerkClient.users.getUser(userId);
                let githubUsername = null;

                if (clerkUser.externalAccounts) {
                    const ghAccount = clerkUser.externalAccounts.find(
                        acc => acc.provider === 'github' || acc.provider === 'oauth_github'
                    );
                    if (ghAccount) githubUsername = ghAccount.username;
                }

                if (!githubUsername && githubAccessToken) {
                    const { Octokit } = require('octokit');
                    const octokit = new Octokit({ auth: githubAccessToken });
                    const { data: ghUser } = await octokit.rest.users.getAuthenticated();
                    githubUsername = ghUser.login;
                }

                if (githubUsername) {
                    await collections.users().doc(userId).update({
                        githubUsername,
                        updatedAt: new Date().toISOString(),
                    });
                    user.githubUsername = githubUsername;
                } else {
                    throw new APIError('GitHub account not connected. Please sign out and sign in with GitHub.', 400);
                }
            } catch (syncErr) {
                if (syncErr instanceof APIError) throw syncErr;
                throw new APIError('GitHub account not connected. Please sign out and sign in with GitHub.', 400);
            }
        }

        const githubService = new GitHubService(githubAccessToken);
        const insights = await githubService.getGitHubInsights(user.githubUsername);

        cache.set(cacheKey, insights, cache.TTL.GITHUB_INSIGHTS);

        res.status(200).json({ success: true, data: insights });
    } catch (error) {
        next(error);
    }
};

/**
 * Search for similar open-source projects
 * GET /api/github/similar-projects
 */
const getSimilarProjects = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { languages, topics, minStars, limit } = req.query;

        let languageArray = languages ? languages.split(',').map(l => l.trim()) : [];
        let topicArray = topics ? topics.split(',').map(t => t.trim()) : [];
        const stars = parseInt(minStars) || 50;
        const perPage = parseInt(limit) || 12;

        const userDoc = await collections.users().doc(userId).get();
        if (!userDoc.exists) throw new APIError('User not found', 404);

        const user = userDoc.data();

        if (languageArray.length === 0 && topicArray.length === 0 && user.githubUsername) {
            try {
                let githubAccessToken = getActiveGithubToken(user);
                if (!githubAccessToken && hasGithubAccessExpired(user)) {
                    await collections.users().doc(userId).update(buildGithubAccessClearUpdate());
                }

                const githubService = new GitHubService(githubAccessToken);
                const repos = await githubService.getRepos(user.githubUsername, 10);

                const readmePromises = repos.slice(0, 3).map(async (repo) => {
                    try {
                        const [owner, repoName] = repo.full_name ? repo.full_name.split('/') : [user.githubUsername, repo.name];
                        return await githubService.getReadme(owner, repoName);
                    } catch {
                        return null;
                    }
                });
                const readmeContents = await Promise.all(readmePromises);

                const { getGroqService } = require('../services/groqService');
                const groqService = getGroqService();
                const analysis = await groqService.analyzeReposForSimilarProjects(repos, readmeContents);

                if (analysis.success) {
                    const aiTopics = [
                        ...analysis.searchTerms?.slice(0, 3) || [],
                        ...analysis.coreFeatures?.slice(0, 2) || [],
                        ...analysis.projectPurpose?.slice(0, 1) || [],
                    ].filter(Boolean);

                    if (aiTopics.length > 0) topicArray.push(...aiTopics);

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

        if (languageArray.length === 0) {
            const projectsSnapshot = await collections.projects()
                .where('uid', '==', userId)
                .limit(10)
                .get();

            const userLanguages = new Set();
            projectsSnapshot.forEach(doc => {
                const project = doc.data();
                if (project.languages?.forEach) {
                    project.languages.forEach(lang => { if (lang.name) userLanguages.add(lang.name); });
                }
                if (project.primaryLanguage) userLanguages.add(project.primaryLanguage);
            });

            if (userLanguages.size > 0) languageArray.push(...Array.from(userLanguages).slice(0, 3));
        }

        if (languageArray.length === 0) {
            languageArray.push('JavaScript', 'TypeScript', 'Python');
        }

        const githubService = new GitHubService();
        const results = await githubService.searchSimilarProjects(languageArray, topicArray, stars, perPage);

        res.status(200).json({
            success: true,
            data: results,
            aiEnhanced: topicArray.length > 0,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Download weekly PDF report
 * GET /api/github/report
 */
const getReport = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const reportService = require('../services/reportService');
        const reportData = await reportService.generatePDFReport(userId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="devtrack-report-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.send(reportData.pdfBuffer);
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
    getSimilarProjects,
    getReport,
};
