/**
 * Profile Sync Service
 * Refreshes GitHub-linked profile data such as avatar URLs.
 */

const { collections } = require('../config/firebase');
const { getActiveGithubToken } = require('./githubAccessService');

const GITHUB_API_BASE = 'https://api.github.com';

const fetchGitHubAvatar = async (username, token = null) => {
    if (!username) return null;

    try {
        const response = await fetch(`${GITHUB_API_BASE}/users/${encodeURIComponent(username)}`, {
            headers: {
                'Accept': 'application/vnd.github+json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
        });

        if (!response.ok) {
            throw new Error(`GitHub avatar lookup failed with ${response.status}`);
        }

        const data = await response.json();
        return data.avatar_url || null;
    } catch (error) {
        console.warn(`Failed to fetch GitHub avatar for ${username}:`, error.message);
        return null;
    }
};

const refreshUserAvatar = async (userId, options = {}) => {
    const userRef = collections.users().doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        return { success: false, error: 'User not found' };
    }

    const user = userDoc.data();
    if (!user.githubUsername) {
        return { success: false, skipped: true, reason: 'No GitHub username linked' };
    }

    const avatarUrl = await fetchGitHubAvatar(user.githubUsername, options.githubToken || getActiveGithubToken(user) || null);
    if (!avatarUrl) {
        return { success: false, error: 'Could not fetch GitHub avatar' };
    }

    await userRef.update({
        avatarUrl,
        githubAvatarUrl: avatarUrl,
        githubAvatarUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    return { success: true, avatarUrl };
};

const refreshAllGitHubAvatars = async () => {
    const snapshot = await collections.users().get();
    const results = [];

    for (const doc of snapshot.docs) {
        const user = doc.data();
        if (!user.githubUsername) continue;

        const result = await refreshUserAvatar(doc.id);
        results.push({ userId: doc.id, ...result });
    }

    return {
        success: true,
        checked: results.length,
        updated: results.filter(r => r.success).length,
        skipped: results.filter(r => r.skipped).length,
        results,
    };
};

module.exports = {
    fetchGitHubAvatar,
    refreshUserAvatar,
    refreshAllGitHubAvatars,
};
