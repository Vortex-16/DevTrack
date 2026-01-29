/**
 * Skill Service
 * Handles calculation and verification of skills based on project data
 */

const { collections } = require('../config/firebase');

/**
 * Recalculate and update verified skills for a user
 * @param {string} userId - The user ID to update
 */
const recalculateSkills = async (userId) => {
    try {
        console.log(`🔄 Recalculating skills for user ${userId}...`);

        // 1. Fetch all projects for the user
        const projectsSnapshot = await collections.projects()
            .where('uid', '==', userId)
            .get();

        const projects = projectsSnapshot.docs.map(doc => doc.data());

        // 2. Aggregate counts and stats
        const skillStats = {};

        projects.forEach(project => {
            // Only consider projects that are "real" (have some commits or progress)
            // or explicitly "Active" / "Completed"
            if (project.commits > 0 || project.status === 'Completed' || project.status === 'Active') {

                const techs = project.technologies || [];

                techs.forEach(tech => {
                    if (!skillStats[tech]) {
                        skillStats[tech] = {
                            name: tech,
                            projectCount: 0,
                            totalCommits: 0,
                            lastUsed: project.updatedAt || project.createdAt
                        };
                    }

                    skillStats[tech].projectCount += 1;
                    skillStats[tech].totalCommits += (project.commits || 0);

                    // Keep track of most recent usage
                    if (project.updatedAt && (!skillStats[tech].lastUsed || new Date(project.updatedAt) > new Date(skillStats[tech].lastUsed))) {
                        skillStats[tech].lastUsed = project.updatedAt;
                    }
                });
            }
        });

        // 3. Determine Verification Status
        // Logic: Verified if used in multiple projects OR used in a significant project (commits > 10)
        const allSkills = Object.values(skillStats).map(skill => {
            const isVerified = (skill.projectCount >= 2) || (skill.projectCount >= 1 && skill.totalCommits >= 10);
            return {
                ...skill,
                verified: isVerified
            };
        });

        // Sort by relevance (verified first, then by usage count)
        allSkills.sort((a, b) => {
            if (a.verified === b.verified) {
                return b.projectCount - a.projectCount;
            }
            return a.verified ? -1 : 1;
        });

        // 4. Update User Document
        await collections.users().doc(userId).update({
            verifiedSkills: allSkills,
            skillsUpdatedAt: new Date().toISOString()
        });

        console.log(`✅ Skills updated for user ${userId}. Total skills: ${allSkills.length}`);

    } catch (error) {
        console.error(`❌ Failed to recalculate skills for user ${userId}:`, error);
        // Don't throw, just log. This is a background maintenance task.
    }
};

module.exports = {
    recalculateSkills
};
