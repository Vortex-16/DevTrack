/**
 * Social Controller
 * Handles peer endorsements (vouches), collaboration status, and social networking features
 */

const { collections, admin } = require('../config/firebase');
const { APIError } = require('../middleware/errorHandler');

/**
 * Vouch for a project
 * POST /api/social/vouch
 */
const vouchProject = async (req, res, next) => {
    try {
        const fromUid = req.auth.userId;
        const { toUid, projectId, category } = req.body;

        if (!toUid || !projectId || !category) {
            throw new APIError('Missing required fields: toUid, projectId, category', 400);
        }

        if (fromUid === toUid) {
            throw new APIError('You cannot vouch for your own project', 400);
        }

        // Verify "from" user exists and has at least one project (to prevent spam bots)
        const fromUserProjects = await collections.projects().where('uid', '==', fromUid).limit(1).get();
        if (fromUserProjects.empty) {
            throw new APIError('You must have at least one project to vouch for others', 403);
        }

        // Check if already vouched for this category
        const existingVouch = await collections.endorsements()
            .where('fromUid', '==', fromUid)
            .where('projectId', '==', projectId)
            .where('category', '==', category)
            .limit(1)
            .get();

        if (!existingVouch.empty) {
            // Toggle Vouch (Remove if exists)
            await collections.endorsements().doc(existingVouch.docs[0].id).delete();
            return res.json({
                success: true,
                message: 'Vouch removed',
                action: 'removed'
            });
        }

        // Add Vouch
        const vouchData = {
            fromUid,
            toUid,
            projectId,
            category,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await collections.endorsements().add(vouchData);

        res.status(201).json({
            success: true,
            message: 'Vouched successfully',
            action: 'added',
            data: { id: docRef.id, ...vouchData }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get endorsements for a user/project
 * GET /api/social/endorsements/:userId
 */
const getEndorsements = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const snapshot = await collections.endorsements()
            .where('toUid', '==', userId)
            .get();

        const endorsements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json({
            success: true,
            data: endorsements
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update collaboration status
 * POST /api/social/collaboration
 */
const updateCollaborationStatus = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { status, seekingStack, goal } = req.body;

        await collections.users().doc(userId).update({
            'social.collaboration': {
                status: status || 'inactive',
                seekingStack: seekingStack || [],
                goal: goal || '',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }
        });

        res.json({
            success: true,
            message: 'Collaboration status updated'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    vouchProject,
    getEndorsements,
    updateCollaborationStatus
};
