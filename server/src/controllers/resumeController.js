/**
 * Resume Controller
 * Handles resume data persistence and retrieval
 */

const { collections } = require('../config/firebase');
const { APIError } = require('../middleware/errorHandler');
const { GroqService } = require('../services/groqService');
const groqService = new GroqService();

/**
 * Get user's resume data
 * GET /api/resume
 */
const getResume = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        // 1. Fetch Resume Doc
        // We assume 1 resume per user for now, using ID 'default' or just storing by UserID
        // Storing in a separate collection 'resumes' with docID = userId is cleanest.
        const resumeDoc = await collections.resumes().doc(userId).get();

        let resumeData = null;
        if (resumeDoc.exists) {
            resumeData = resumeDoc.data();
        } else {
            // Return empty skeleton if none exists
            resumeData = {
                uid: userId,
                basics: { phone: '', linkedin: '', website: '', summary: '', location: '' },
                experience: [],
                education: [],
                skills: [], // custom/manual skills
                selectedProjectIds: [],
                selectedSkillNames: [], // from verified list
                template: 'modern'
            };
        }

        // 2. Hydrate Selected Projects
        // If we have selected IDs, we should fetch those specific projects 
        // to ensure we display up-to-date stats (commits, description)
        let hydratedProjects = [];
        if (resumeData.selectedProjectIds && resumeData.selectedProjectIds.length > 0) {
            // Firestore 'in' query supports max 10/30 items. 
            // If user has many, we might need multiple queries or just fetch all active and filter.
            // Fetching all user projects is safer/easier since N is small (<100 typ).

            const projectsSnapshot = await collections.projects()
                .where('uid', '==', userId)
                .get();

            const allProjects = projectsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // Filter and sort by selection order if possible, or just verified list
            hydratedProjects = allProjects.filter(p => resumeData.selectedProjectIds.includes(p.id));
        }

        res.status(200).json({
            success: true,
            data: {
                ...resumeData,
                projects: hydratedProjects
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Save user's resume data
 * POST /api/resume
 */
const saveResume = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { basics, experience, education, skills, selectedProjectIds, selectedSkillNames, template } = req.body;

        const resumeData = {
            uid: userId,
            basics: basics || {},
            experience: experience || [],
            education: education || [],
            skills: skills || [],
            selectedProjectIds: selectedProjectIds || [],
            selectedSkillNames: selectedSkillNames || [],
            template: template || 'modern',
            updatedAt: new Date().toISOString()
        };

        // Upsert
        await collections.resumes().doc(userId).set(resumeData, { merge: true });

        res.status(200).json({
            success: true,
            message: 'Resume saved successfully',
            data: resumeData
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Generate AI Summary for Resume
 * POST /api/resume/generate-summary
 */
const generateSummary = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { experience } = req.body; // Pass current experience from frontend state if available

        // Fetch User Data & Skills
        const userDoc = await collections.users().doc(userId).get();
        if (!userDoc.exists) throw new APIError('User not found', 404);
        const userData = userDoc.data();

        // Fetch Top Projects (Verified)
        const projectsSnapshot = await collections.projects()
            .where('uid', '==', userId)
            .limit(5)
            .get();
        const projects = projectsSnapshot.docs.map(d => d.data());

        const skills = userData.verifiedSkills || [];

        const result = await groqService.generateResumeSummary(
            { ...userData, experience: experience || [] },
            projects,
            skills
        );

        res.status(200).json({
            success: true,
            data: { summary: result.summary }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getResume,
    saveResume,
    generateSummary
};
