const leetCodeService = require('../services/leetCodeService');
const { collections } = require('../config/firebase');
const { APIError } = require('../middleware/errorHandler');

/**
 * Get LeetCode stats for the authenticated user
 * GET /api/leetcode/stats
 */
const getStats = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        // Get user's LeetCode username from their profile
        const userDoc = await collections.users().doc(userId).get();
        if (!userDoc.exists) {
            throw new APIError('User not found', 404);
        }

        const leetCodeUsername = userDoc.data().leetCodeUsername;
        if (!leetCodeUsername) {
            return res.status(200).json({
                success: true,
                data: null,
                message: 'LeetCode username not configured'
            });
        }

        // Fetch data from LeetCode
        const [profileData, submissionsData] = await Promise.all([
            leetCodeService.getUserPublicProfile(leetCodeUsername),
            leetCodeService.getRecentSubmissions(leetCodeUsername)
        ]);

        const stats = profileData.matchedUser.submitStats.acSubmissionNum;
        const totalSolved = stats.find(s => s.difficulty === 'All').count;
        const easySolved = stats.find(s => s.difficulty === 'Easy').count;
        const mediumSolved = stats.find(s => s.difficulty === 'Medium').count;
        const hardSolved = stats.find(s => s.difficulty === 'Hard').count;

        res.status(200).json({
            success: true,
            data: {
                username: leetCodeUsername,
                realName: profileData.matchedUser.profile.realName,
                avatar: profileData.matchedUser.profile.userAvatar,
                ranking: profileData.matchedUser.profile.ranking,
                totalSolved,
                easySolved,
                mediumSolved,
                hardSolved,
                contestRating: profileData.userContestRanking?.rating || 0,
                recentSubmissions: submissionsData.recentAcSubmissionList || []
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Update LeetCode username
 * POST /api/leetcode/config
 */
const updateConfig = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { username, verificationCode } = req.body;

        if (!username) {
            throw new APIError('Username is required', 400);
        }

        // Verify username exists on LeetCode
        let profileData;
        try {
            profileData = await leetCodeService.getUserPublicProfile(username);
        } catch (error) {
            throw new APIError('Invalid LeetCode username', 400);
        }

        if (verificationCode) {
            const aboutMe = profileData.matchedUser.profile.aboutMe || '';
            const summary = aboutMe.toLowerCase();
            const code = verificationCode.toLowerCase();

            if (!summary.includes(code)) {
                throw new APIError('Verification failed. Please ensure the code is added to your LeetCode summary/about section.', 400);
            }
        }

        // Update user profile
        await collections.users().doc(userId).update({
            leetCodeUsername: username,
            updatedAt: new Date().toISOString()
        });

        res.status(200).json({
            success: true,
            message: 'LeetCode username connected successfully'
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStats,
    updateConfig
};
