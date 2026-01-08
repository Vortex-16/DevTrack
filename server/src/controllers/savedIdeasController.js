/**
 * Saved Ideas Controller
 * Handles saving and retrieving AI project ideas
 */

const { collections } = require('../config/firebase');
const { APIError } = require('../middleware/errorHandler');

/**
 * Save a project idea
 * POST /api/saved-ideas
 */
const saveIdea = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const ideaData = req.body;

        if (!ideaData || !ideaData.title) {
            throw new APIError('Invalid idea data', 400);
        }

        // Generate a unique ID based on title
        const ideaId = Buffer.from(ideaData.title).toString('base64').replace(/[/+=]/g, '_').substring(0, 50);

        // Store in a subcollection 'savedIdeas' under the user document
        await collections.users()
            .doc(userId)
            .collection('savedIdeas')
            .doc(ideaId)
            .set({
                ...ideaData,
                id: ideaId,
                savedAt: new Date().toISOString()
            });

        res.status(200).json({
            success: true,
            message: 'Project idea saved successfully',
            data: { id: ideaId }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove a saved idea
 * DELETE /api/saved-ideas/:ideaId
 */
const removeIdea = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { ideaId } = req.params;

        if (!ideaId) {
            throw new APIError('Idea ID is required', 400);
        }

        await collections.users()
            .doc(userId)
            .collection('savedIdeas')
            .doc(ideaId)
            .delete();

        res.status(200).json({
            success: true,
            message: 'Saved idea removed successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all saved ideas
 * GET /api/saved-ideas
 */
const getSavedIdeas = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        const snapshot = await collections.users()
            .doc(userId)
            .collection('savedIdeas')
            .orderBy('savedAt', 'desc')
            .get();

        const ideas = [];
        snapshot.forEach(doc => {
            ideas.push(doc.data());
        });

        res.status(200).json({
            success: true,
            data: ideas
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Check if specific ideas are saved
 * POST /api/saved-ideas/check
 * Body: { titles: ["Idea 1", "Idea 2"] }
 */
const checkStatus = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { titles } = req.body;

        if (!Array.isArray(titles)) {
            throw new APIError('titles must be an array', 400);
        }

        const snapshot = await collections.users()
            .doc(userId)
            .collection('savedIdeas')
            .select('title')
            .get();

        const savedTitles = new Set();
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.title) savedTitles.add(data.title);
        });

        const statusMap = {};
        titles.forEach(title => {
            statusMap[title] = savedTitles.has(title);
        });

        res.status(200).json({
            success: true,
            data: statusMap
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    saveIdea,
    removeIdea,
    getSavedIdeas,
    checkStatus
};
