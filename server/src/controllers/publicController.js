/**
 * Public Controller
 * Handles public-facing profile and data access
 */

const { collections, admin } = require('../config/firebase');
const { APIError } = require('../middleware/errorHandler');
const cache = require('../config/cache');
const logger = require('../utils/logger');

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
        const projectsSnapshot = await collections
            .projects()
            .where('uid', '==', userId)
            // .where('status', 'in', ['Active', 'Completed']) // limitations on 'in' + 'where' might apply
            .get();

        const allProjects = projectsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // 3. Calculate/Get Verified Skills (if not already stored)
        let verifiedSkills = userData.verifiedSkills || [];

        if (!userData.verifiedSkills) {
            // Quick calculation fallback
            const skillCounts = {};
            allProjects.forEach((p) => {
                if (p.technologies && Array.isArray(p.technologies)) {
                    p.technologies.forEach((tech) => {
                        skillCounts[tech] = (skillCounts[tech] || 0) + 1;
                    });
                }
            });
            verifiedSkills = Object.entries(skillCounts)
                .map(([name, count]) => ({ name, count, verified: count >= 1 })) // Simple threshold
                .sort((a, b) => b.count - a.count);
        }

        // --- CUSTOMIZATION LOGIC ---
        const prefs = userData.preferences || {};
        const publicPrefs = prefs.publicProfile || {};

        // Filter Showcased Projects
        let showcaseProjects = [];
        if (
            publicPrefs.showcasedProjectIds &&
            Array.isArray(publicPrefs.showcasedProjectIds) &&
            publicPrefs.showcasedProjectIds.length > 0
        ) {
            // Manual Selection
            showcaseProjects = allProjects.filter((p) => publicPrefs.showcasedProjectIds.includes(p.id));
            // Maintain order of selection if important, or sort by standard metric
            // For now, let's keep them in the order of ids provided if possible, or just default sort
            showcaseProjects.sort((a, b) => {
                return publicPrefs.showcasedProjectIds.indexOf(a.id) - publicPrefs.showcasedProjectIds.indexOf(b.id);
            });
        } else {
            // Default: Top 6 Active/Completed
            showcaseProjects = allProjects
                .filter((p) => p.status === 'Completed' || p.status === 'Active')
                .sort((a, b) => (b.progress || 0) - (a.progress || 0)) // Sort by progress/quality
                .slice(0, 6); // Top 6
        }

        // 4. Sanitize Return Data
        const publicProfile = {
            id: userId,
            username: userData.githubUsername,
            name: userData.name,
            avatarUrl: userData.avatarUrl,
            // Use custom headline/bio if set, otherwise fallback
            headline: publicPrefs.headline || userData.headline || 'Full Stack Developer',
            bio: publicPrefs.bio || userData.bio || `Developer building with ${verifiedSkills[0]?.name || 'passion'}`,
            location: userData.location || null,
            joinDate:
                userData.createdAt && typeof userData.createdAt.toDate === 'function'
                    ? userData.createdAt.toDate().toISOString()
                    : userData.createdAt || new Date().toISOString(),
            stats: {
                totalProjects: allProjects.length,
                totalCommits: allProjects.reduce((sum, p) => sum + (p.commits || 0), 0),
                learningStreak: 0,
            },
            verifiedSkills: publicPrefs.showSkills !== false ? verifiedSkills : [], // Hide if disabled
            projects: showcaseProjects.map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                technologies: p.technologies,
                repositoryUrl: p.repositoryUrl,
                demoUrl: p.demoUrl || null,
                commits: p.commits,
                progress: p.progress,
            })),
            // New Customization Fields
            theme: publicPrefs.theme || 'default',
            accentColor: publicPrefs.accentColor || '#A855F7', // Default purple-500
            socials: publicPrefs.socials || {
                twitter: null,
                linkedin: null,
                github: userData.githubUsername,
                website: null,
            },
            bannerUrl: publicPrefs.bannerUrl || null,
            social: userData.social || {},
            resume: null,
        };

        // Fetch Resume Data if exists
        const resumeDoc = await collections.resumes().doc(userId).get();
        if (resumeDoc.exists) {
            const resumeData = resumeDoc.data();

            // Hydrate projects in resume
            let hydratedResumeProjects = [];
            if (resumeData.selectedProjectIds && resumeData.selectedProjectIds.length > 0) {
                hydratedResumeProjects = allProjects
                    .filter((p) => resumeData.selectedProjectIds.includes(p.id))
                    .map((p) => ({
                        id: p.id,
                        name: p.name,
                        description: p.description,
                        technologies: p.technologies,
                        repositoryUrl: p.repositoryUrl,
                        commits: p.commits,
                        createdAt: p.createdAt,
                        longDescription: p.longDescription,
                    }));
            }

            publicProfile.resume = {
                ...resumeData,
                projects: hydratedResumeProjects,
            };
        }

        // Fetch Endorsements (Vouches)
        const endorsementsSnapshot = await collections.endorsements().where('toUid', '==', userId).get();
        const endorsements = endorsementsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Get unique fromUids to fetch their basic info (names/avatars)
        const fromUids = [...new Set(endorsements.map((e) => e.fromUid))];
        const endorsersInfo = {};

        if (fromUids.length > 0) {
            const chunkedUids = [];
            for (let i = 0; i < fromUids.length; i += 10) {
                chunkedUids.push(fromUids.slice(i, i + 10));
            }

            for (const chunk of chunkedUids) {
                const endorsersSnapshot = await collections
                    .users()
                    .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
                    .get();
                endorsersSnapshot.forEach((doc) => {
                    const d = doc.data();
                    endorsersInfo[doc.id] = {
                        name: d.name,
                        avatarUrl: d.avatarUrl,
                        githubUsername: d.githubUsername,
                    };
                });
            }
        }

        publicProfile.endorsements = endorsements.map((e) => ({
            ...e,
            endorser: endorsersInfo[e.fromUid] || { name: 'Anonymous' },
        }));

        res.status(200).json({
            success: true,
            data: publicProfile,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get aggregated platform-wide public statistics (live telemetry)
 * GET /api/public/stats
 */
const getPlatformStats = async (req, res, next) => {
    try {
        const stats = await cache.getOrSet(
            'platform_public_stats',
            async () => {
                let githubStars = 16;
                try {
                    const headers = { 'User-Agent': 'DevTrack-Platform' };
                    if (process.env.GITHUB_PAT) {
                        headers['Authorization'] = `token ${process.env.GITHUB_PAT}`;
                    }
                    const ghRes = await fetch('https://api.github.com/repos/Vortex-16/DevTrack', { headers });
                    if (ghRes.ok) {
                        const ghData = await ghRes.json();
                        if (typeof ghData.stargazers_count === 'number') {
                            githubStars = ghData.stargazers_count;
                        }
                    }
                } catch (err) {
                    logger.warn('Failed to fetch DevTrack GitHub stars', { error: err.message });
                }

                // Real Firestore metrics (optimized with server-side aggregations and field selection)
                let activeDevelopers = 37;
                let commitsAnalyzed = 42709;
                let habitRetention = 60.5;
                let totalProjects = 154;

                try {
                    const [usersCountSnap, projectsSnap, reportsSnap] = await Promise.all([
                        collections
                            .users()
                            .count()
                            .get()
                            .catch(() => null),
                        collections
                            .projects()
                            .select('commits')
                            .get()
                            .catch(() => null),
                        collections
                            .reports()
                            .limit(50)
                            .select('aiInsights')
                            .get()
                            .catch(() => ({ docs: [], size: 0 })),
                    ]);

                    if (usersCountSnap && typeof usersCountSnap.data?.().count === 'number') {
                        activeDevelopers = usersCountSnap.data().count;
                    }

                    if (projectsSnap && !projectsSnap.empty) {
                        totalProjects = projectsSnap.size;
                        let projectCommits = 0;
                        projectsSnap.forEach((doc) => {
                            const data = doc.data();
                            projectCommits += data.commits || 0;
                        });
                        if (projectCommits > 0) {
                            commitsAnalyzed = projectCommits;
                        }
                    }

                    if (reportsSnap && reportsSnap.docs && reportsSnap.docs.length > 0) {
                        let totalConsistency = 0;
                        let count = 0;
                        reportsSnap.docs.forEach((doc) => {
                            const d = doc.data();
                            const score = d?.aiInsights?.dashboard?.kpis?.consistencyScore;
                            if (typeof score === 'number' && score > 0) {
                                totalConsistency += score;
                                count++;
                            }
                        });
                        if (count > 0) {
                            habitRetention = Number((totalConsistency / count).toFixed(1));
                        }
                    }
                } catch (dbErr) {
                    logger.warn('Failed to aggregate real DB stats for landing', { error: dbErr.message });
                }

                return {
                    githubStars,
                    commitsAnalyzed,
                    activeDevelopers,
                    habitRetention,
                    totalProjects,
                    lastUpdated: new Date().toISOString(),
                };
            },
            600
        ); // 10 minutes cache TTL

        res.status(200).json({
            success: true,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfileByUsername,
    getPlatformStats,
};
