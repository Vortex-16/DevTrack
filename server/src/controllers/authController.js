/**
 * Auth Controller
 * Handles user authentication and profile management
 */

const { collections } = require('../config/firebase');
const { clerkClient } = require('@clerk/clerk-sdk-node');
const { APIError } = require('../middleware/errorHandler');
const { fetchGitHubAvatar } = require('../services/profileSyncService');

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
        let githubAccessToken = null;
        try {
            // Get OAuth access token from Clerk
            const oauthTokens = await clerkClient.users.getUserOauthAccessToken(
                userId,
                'oauth_github'
            );
            // console.log(' OAuth tokens response:', JSON.stringify(oauthTokens?.data, null, 2));

            if (oauthTokens?.data?.[0]?.token) {
                githubAccessToken = oauthTokens.data[0].token;
                // console.log('GitHub OAuth token retrieved');

                // If we got a token but no username, try to fetch from GitHub API
                if (!githubUsername && githubAccessToken) {
                    try {
                        const { Octokit } = require('octokit');
                        const octokit = new Octokit({ auth: githubAccessToken });
                        const { data: ghUser } = await octokit.rest.users.getAuthenticated();
                        githubUsername = ghUser.login;
                        githubId = String(ghUser.id);
                        // console.log('Got username from GitHub API:', githubUsername);
                    } catch (ghErr) {
                        console.warn('Could not fetch from GitHub API:', ghErr.message);
                    }
                }
            }
        } catch (tokenErr) {
            console.warn('Could not retrieve GitHub OAuth token:', tokenErr.message);
        }

        const userData = {
            clerkId: userId,
            email: clerkUser.emailAddresses?.[0]?.emailAddress || null,
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
            avatarUrl: clerkUser.imageUrl || null,
            githubUsername: githubUsername,
            githubId: githubId,
            githubAccessToken: githubAccessToken,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastStartTime: null,
            lastEndTime: null,
        };

        // Upsert user in Firestore
        const userRef = collections.users().doc(userId);
        const existingUser = await userRef.get();

        if (existingUser.exists) {
            // Update existing user (preserve lastStartTime/lastEndTime)
            const existing = existingUser.data();

            let githubAvatarUrl = existing.githubAvatarUrl || null;
            if (githubUsername) {
                githubAvatarUrl = await fetchGitHubAvatar(githubUsername, githubAccessToken);
            }

            await userRef.update({
                ...userData,
                avatarUrl: githubAvatarUrl || userData.avatarUrl || existing.avatarUrl || null,
                githubAvatarUrl: githubAvatarUrl || existing.githubAvatarUrl || null,
                createdAt: existing.createdAt, // Keep original creation date
                lastStartTime: existing.lastStartTime,
                lastEndTime: existing.lastEndTime,
            });
        } else {
            // Create new user
            let githubAvatarUrl = null;
            if (githubUsername) {
                githubAvatarUrl = await fetchGitHubAvatar(githubUsername, githubAccessToken);
            }

            await userRef.set(userData);
            if (githubAvatarUrl) {
                await userRef.update({
                    avatarUrl: githubAvatarUrl,
                    githubAvatarUrl,
                });
            }
        }

        const updatedUser = await userRef.get();

        res.status(200).json({
            success: true,
            message: 'User synced successfully',
            user: updatedUser.data(),
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
            user: userDoc.data(),
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

module.exports = {
    syncUser,
    getMe,
    updateActivityTime,
    deleteAccount,
};
