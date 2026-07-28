/**
 * Auth Controller
 * Handles user authentication and profile management
 */

const { collections } = require('../config/firebase');
const { clerkClient } = require('@clerk/clerk-sdk-node');
const { APIError } = require('../middleware/errorHandler');
const { TIERS } = require('../config/constants');
const { fetchGitHubAvatar } = require('../services/profileSyncService');
const {
    getActiveGithubToken,
    hasGithubAccessExpired,
    hasStoredGithubAccess,
    buildGithubAccessUpdate,
    buildGithubAccessClearUpdate,
    getGithubAccessWindow,
} = require('../services/githubAccessService');

const parseScopeList = (approvedScopes) => {
    if (Array.isArray(approvedScopes)) return approvedScopes;
    return String(approvedScopes || '')
        .split(/[\s,]+/)
        .map((scope) => scope.trim())
        .filter(Boolean);
};

const getClerkGithubOauthToken = async (userId) => {
    const providerKeys = ['github', 'oauth_github'];

    for (const providerKey of providerKeys) {
        try {
            const oauthTokens = await clerkClient.users.getUserOauthAccessToken(userId, providerKey);
            const tokenObj = oauthTokens?.data ? oauthTokens.data[0] : oauthTokens?.[0];
            const token = tokenObj?.token || null;
            if (token) return token;
        } catch {
            // Try next provider key.
        }
    }

    return null;
};

const buildSafeUserResponse = async (userData = {}) => {
    const activeGithubToken = getActiveGithubToken(userData);
    const {
        githubAccessToken,
        githubAccessTokenEncrypted,
        githubAccessTokenIv,
        githubAccessTokenAuthTag,
        githubAccessTokenAlgorithm,
        githubAccessTokenVersion,
        ...safeUser
    } = userData;

    // Generate Firebase Custom Token for client-side onSnapshot sync
    let firebaseToken = null;
    try {
        const { admin } = require('../config/firebase');
        firebaseToken = await admin.auth().createCustomToken(userData.clerkId);
    } catch (err) {
        console.error('Failed to generate Firebase Custom Token:', err.message);
    }

    return {
        ...safeUser,
        githubAccessToken: null,
        githubAccessActive: !!activeGithubToken,
        firebaseToken,
    };
};

/**
 * Sync user from Clerk to Firestore
 * POST /api/auth/sync
 */
const syncUser = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        // Get user details from Clerk
        const clerkUser = await clerkClient.users.getUser(userId);

        if (!clerkUser) {
            throw new APIError('User not found in Clerk', 404);
        }

        // Debug: Log FULL Clerk user structure
        // console.log('FULL Clerk user object keys:', Object.keys(clerkUser));
        // console.log('Clerk externalAccounts:', JSON.stringify(clerkUser.externalAccounts, null, 2));

        // Try multiple ways to find GitHub username
        let githubUsername = null;
        let githubId = null;
        let githubAccount = null;

        // Method 1: Check externalAccounts array
        if (clerkUser.externalAccounts && Array.isArray(clerkUser.externalAccounts)) {
            // Try different provider names
            githubAccount = clerkUser.externalAccounts.find(
                (acc) => acc.provider === 'github' ||
                    acc.provider === 'oauth_github' ||
                    acc.provider?.toLowerCase().includes('github')
            );

            if (githubAccount) {
                githubUsername = githubAccount.username || githubAccount.providerUserId || null;
                githubId = githubAccount.externalId || githubAccount.providerUserId || null;
                // console.log('Found GitHub from externalAccounts:', { githubUsername, githubId });
            }
        }

        // Method 2: Check if Clerk user has a username property (often set from GitHub)
        if (!githubUsername && clerkUser.username) {
            githubUsername = clerkUser.username;
            // console.log('Using Clerk username:', githubUsername);
        }

        // Method 3: Check primaryWeb3Wallet or other OAuth fields
        if (!githubUsername && clerkUser.primaryUsername) {
            githubUsername = clerkUser.primaryUsername;
            // console.log('Using primaryUsername:', githubUsername);
        }

        // console.log('Final GitHub data:', { githubUsername, githubId });

        // Try to get GitHub OAuth token for private repo access
        // Respect retention window: if expired, do not auto-renew during normal sync.
        let githubAccessToken = null;
        let githubAccessUpdate = null;
        const now = new Date();

        const userRef = collections.users().doc(userId);
        const existingUser = await userRef.get();
        const existingData = existingUser.exists ? existingUser.data() : null;

        if (existingData && hasGithubAccessExpired(existingData, now)) {
            githubAccessUpdate = buildGithubAccessClearUpdate(now);
        }

        const approvedScopes = githubAccount?.approvedScopes || '';
        const scopeList = parseScopeList(approvedScopes);
        const hasRepoScope = scopeList.includes('repo');

        // Track granted scopes on user doc for frontend scope checks (avoids Clerk round-trips)
        const grantedGithubScopes = scopeList.length > 0 ? scopeList : null;

        const existingWindow = existingData ? getGithubAccessWindow(existingData) : null;
        const expiresAtDate = existingWindow?.expiresAt ? new Date(existingWindow.expiresAt) : null;
        const hasValidWindow = !expiresAtDate || Number.isNaN(expiresAtDate.getTime()) || expiresAtDate > now;
        const missingTokenButRecoverable = !!existingData && !hasStoredGithubAccess(existingData, now) && hasValidWindow && hasRepoScope;

        const canAutoFetchToken =
            !existingData ||
            !existingData?.githubAccessGrantedAt ||
            missingTokenButRecoverable;
        try {
            if (canAutoFetchToken) {
                // Get OAuth access token from Clerk (provider key can vary by setup)
                githubAccessToken = await getClerkGithubOauthToken(userId);

                if (githubAccessToken && hasRepoScope) {
                    // Only persist as private-repo token when repo scope is present.
                    githubAccessUpdate = buildGithubAccessUpdate(githubAccessToken, existingData || {}, now);

                    // If we got a token but no username, try to fetch from GitHub API
                    if (!githubUsername && githubAccessToken) {
                        try {
                            const { Octokit } = require('octokit');
                            const octokit = new Octokit({ auth: githubAccessToken });
                            const { data: ghUser } = await octokit.rest.users.getAuthenticated();
                            githubUsername = ghUser.login;
                            githubId = String(ghUser.id);
                        } catch (ghErr) {
                            console.warn('Could not fetch from GitHub API:', ghErr.message);
                        }
                    }
                }
            }
        } catch (tokenErr) {
            console.warn('Could not retrieve GitHub OAuth token:', tokenErr.message);
        }

        if (!githubAccessToken && existingData) {
            githubAccessToken = getActiveGithubToken(existingData, now);
        }

        const userData = {
            clerkId: userId,
            email: clerkUser.emailAddresses?.[0]?.emailAddress || null,
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
            avatarUrl: clerkUser.imageUrl || null,
            githubUsername: githubUsername,
            githubId: githubId,
            githubAccessToken: null,
            grantedGithubScopes: grantedGithubScopes || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastStartTime: null,
            lastEndTime: null,
        };

        if (existingUser.exists) {
            // Update existing user (preserve lastStartTime/lastEndTime)
            const existing = existingUser.data();

            let githubAvatarUrl = existing.githubAvatarUrl || null;
            if (githubUsername) {
                githubAvatarUrl = await fetchGitHubAvatar(githubUsername, githubAccessToken);
            }

            // Initialize tier and 30-day Pro trial grandfathering if not present
            const isVortexAdmin = (githubUsername || '').toLowerCase() === 'vortex-16' ||
                (clerkUser.emailAddresses?.[0]?.emailAddress || '').toLowerCase().includes('alpha4coders');

            const proTrialExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            const currentTier = isVortexAdmin ? TIERS.PRO : (existing.tier || TIERS.PRO);
            const currentTierExpiresAt = isVortexAdmin ? null : (existing.tierExpiresAt !== undefined ? existing.tierExpiresAt : proTrialExpiry);

            await userRef.update({
                ...userData,
                ...(githubAccessUpdate || {}),
                tier: currentTier,
                tierExpiresAt: currentTierExpiresAt,
                isExemptFromDowngrade: isVortexAdmin || existing.isExemptFromDowngrade || false,
                avatarUrl: githubAvatarUrl || userData.avatarUrl || existing.avatarUrl || null,
                githubAvatarUrl: githubAvatarUrl || existing.githubAvatarUrl || null,
                createdAt: existing.createdAt, // Keep original creation date
                lastStartTime: existing.lastStartTime,
                lastEndTime: existing.lastEndTime,
            });
        } else {
            // Create new user with 30-day Pro trial grandfathering
            const isVortexAdmin = (githubUsername || '').toLowerCase() === 'vortex-16' ||
                (githubUsername || '').toLowerCase() === 'vortex-16' ||
                (clerkUser.emailAddresses?.[0]?.emailAddress || '').toLowerCase().includes('alpha4coders');

            const proTrialExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            let githubAvatarUrl = null;
            if (githubUsername) {
                githubAvatarUrl = await fetchGitHubAvatar(githubUsername, githubAccessToken);
            }

            const newUserData = {
                ...userData,
                tier: TIERS.PRO,
                tierExpiresAt: isVortexAdmin ? null : proTrialExpiry,
                isExemptFromDowngrade: isVortexAdmin,
                tierTrialStartedAt: new Date().toISOString(),
            };

            await userRef.set(newUserData);
            if (githubAvatarUrl) {
                await userRef.update({
                    avatarUrl: githubAvatarUrl,
                    githubAvatarUrl,
                });
            }
            if (githubAccessUpdate) {
                await userRef.update(githubAccessUpdate);
            }
        }

        const updatedUser = await userRef.get();

        res.status(200).json({
            success: true,
            message: 'User synced successfully',
            user: await buildSafeUserResponse(updatedUser.data()),
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Renew GitHub private-repo access window intentionally from settings/reauthorize flow
 * POST /api/auth/renew-github-access
 */
const renewGithubAccess = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const userRef = collections.users().doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            throw new APIError('User not found', 404);
        }

        const token = await getClerkGithubOauthToken(userId);

        if (!token) {
            throw new APIError('No GitHub OAuth token found. Please reconnect GitHub access.', 400);
        }

        const now = new Date();
        const updateData = buildGithubAccessUpdate(token, userDoc.data(), now);
        await userRef.update(updateData);

        const { retentionDays, expiresAt } = getGithubAccessWindow({
            ...userDoc.data(),
            ...updateData,
        });

        res.status(200).json({
            success: true,
            message: 'GitHub private-repo access renewed successfully',
            data: {
                githubAccessRetentionDays: retentionDays,
                githubAccessExpiresAt: expiresAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        const userRef = collections.users().doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            throw new APIError('User not found. Please sync your account first.', 404);
        }

        res.status(200).json({
            success: true,
            user: await buildSafeUserResponse(userDoc.data()),
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update user's last activity times (for notification logic)
 * PUT /api/auth/activity
 */
const updateActivityTime = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { startTime, endTime } = req.body;

        const userRef = collections.users().doc(userId);

        const updateData = {
            updatedAt: new Date().toISOString(),
        };

        if (startTime) {
            updateData.lastStartTime = startTime;
        }

        if (endTime) {
            updateData.lastEndTime = endTime;
        }

        await userRef.update(updateData);

        res.status(200).json({
            success: true,
            message: 'Activity time updated',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete user account
 * DELETE /api/auth/me
 */
const deleteAccount = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        // Delete user's logs
        const logsSnapshot = await collections.logs()
            .where('uid', '==', userId)
            .get();

        const batch = collections.users().firestore.batch();

        logsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Delete user document
        batch.delete(collections.users().doc(userId));

        await batch.commit();

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get GitHub scope status for the current user
 * GET /api/auth/github-scope-status
 *
 * Returns which GitHub scopes the user has granted, read from Firestore
 * (populated during /sync). This avoids a Clerk round-trip on every page.
 */
const getGithubScopeStatus = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        const userDoc = await collections.users().doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        const grantedScopes = userData.grantedGithubScopes || [];
        const hasRepoScope = grantedScopes.includes('repo');
        const hasReadUserScope = grantedScopes.includes('read:user');
        const hasUserEmailScope = grantedScopes.includes('user:email');

        const accessWindow = getGithubAccessWindow(userData);
        const accessExpired = hasGithubAccessExpired(userData);

        res.status(200).json({
            success: true,
            data: {
                grantedScopes,
                hasRepoScope,
                hasReadUserScope,
                hasUserEmailScope,
                githubConnected: !!userData.githubUsername,
                githubUsername: userData.githubUsername || null,
                privateAccessActive: !accessExpired && !!accessWindow?.expiresAt,
                accessWindow: accessWindow || null,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    syncUser,
    renewGithubAccess,
    getMe,
    updateActivityTime,
    deleteAccount,
    getGithubScopeStatus,
    buildSafeUserResponse,
};
