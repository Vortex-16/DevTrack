/**
 * Public Controller
 * Handles public-facing profile and data access
 */

const { collections } = require('../config/firebase');
const { APIError } = require('../middleware/errorHandler');

/**
 * Get public profile by GitHub username
 * GET /api/public/profile/:username
 */
const getProfileByUsername = async (req, res, next) => {
    try {
        const { username } = req.params;

        if (!username) {
            throw new APIError('Username is required', 400);
        }

        // 1. Find user by githubUsername
        // Note: This requires a query. ensuring index exists for 'githubUsername' might be needed
        // or we scan (costly) or we structure DB to allow this.
        // For now, valid assumption is query.
        const usersRef = collections.users();
        const snapshot = await usersRef.where('githubUsername', '==', username).limit(1).get();

        if (snapshot.empty) {
            throw new APIError('User not found', 404);
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        const userId = userDoc.id;

        // 2. Fetch Active/Showcased Projects
        // logic: get all projects that are public or active? 
        // For now, let's get all 'Completed' or 'Active' projects for showcase
        const projectsSnapshot = await collections.projects()
            .where('uid', '==', userId)
            // .where('status', 'in', ['Active', 'Completed']) // limitations on 'in' + 'where' might apply
            .get();

        const allProjects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const showcaseProjects = allProjects
            .filter(p => p.status === 'Completed' || p.status === 'Active')
            .sort((a, b) => (b.progress || 0) - (a.progress || 0)) // Sort by progress/quality
            .slice(0, 6); // Top 6

        // 3. Calculate/Get Verified Skills (if not already stored)
        // If we haven't implemented stored verifiedSkills yet, we can calculate on fly for now
        // or use the ones from userData if they exist.
        let verifiedSkills = userData.verifiedSkills || [];
        
        if (!userData.verifiedSkills) {
            // Quick calculation fallback
            const skillCounts = {};
            allProjects.forEach(p => {
                if (p.technologies && Array.isArray(p.technologies)) {
                    p.technologies.forEach(tech => {
                        skillCounts[tech] = (skillCounts[tech] || 0) + 1;
                    });
                }
            });
             verifiedSkills = Object.entries(skillCounts)
                .map(([name, count]) => ({ name, count, verified: count >= 1 })) // Simple threshold
                .sort((a,b) => b.count - a.count);
        }

        // 4. Sanitize Return Data
        const publicProfile = {
            username: userData.githubUsername,
            name: userData.name,
            avatarUrl: userData.avatarUrl,
            bio: userData.bio || `Developer building with ${verifiedSkills[0]?.name || 'passion'}`, // Fallback bio
            location: userData.location || null,
            joinDate: userData.createdAt,
            stats: {
                totalProjects: allProjects.length,
                totalCommits: allProjects.reduce((sum, p) => sum + (p.commits || 0), 0),
                learningStreak: 0, // Placeholder until we link learning logs
            },
            verifiedSkills: verifiedSkills,
            projects: showcaseProjects.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                technologies: p.technologies,
                repositoryUrl: p.repositoryUrl,
                demoUrl: p.demoUrl || null,
                commits: p.commits,
                progress: p.progress
            }))
        };

        res.status(200).json({
            success: true,
            data: publicProfile
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfileByUsername
};
