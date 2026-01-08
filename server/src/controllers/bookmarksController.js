/**
 * Bookmarks Controller
 * Handles saving and retrieving bookmarked repositories
 */

const { collections, admin } = require('../config/firebase');
const { APIError } = require('../middleware/errorHandler');

/**
 * Add a repository to bookmarks
 * POST /api/bookmarks
 */
const addBookmark = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const repoData = req.body;

        if (!repoData || !repoData.id || !repoData.url) {
            throw new APIError('Invalid repository data', 400);
        }

        // Store in a subcollection 'bookmarks' under the user document
        await collections.users()
            .doc(userId)
            .collection('bookmarks')
            .doc(repoData.id.toString())
            .set({
                ...repoData,
                bookmarkedAt: new Date().toISOString()
            });

        res.status(200).json({
            success: true,
            message: 'Repository bookmarked successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove a repository from bookmarks
 * DELETE /api/bookmarks/:repoId
 */
const removeBookmark = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { repoId } = req.params;

        if (!repoId) {
            throw new APIError('Repository ID is required', 400);
        }

        await collections.users()
            .doc(userId)
            .collection('bookmarks')
            .doc(repoId)
            .delete();

        res.status(200).json({
            success: true,
            message: 'Bookmark removed successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all bookmarked repositories
 * GET /api/bookmarks
 */
const getBookmarks = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        const snapshot = await collections.users()
            .doc(userId)
            .collection('bookmarks')
            .orderBy('bookmarkedAt', 'desc')
            .get();

        const bookmarks = [];
        snapshot.forEach(doc => {
            bookmarks.push(doc.data());
        });

        res.status(200).json({
            success: true,
            data: bookmarks
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Check if specific repos are bookmarked
 * POST /api/bookmarks/check
 * Body: { repoIds: [123, 456] }
 */
const checkStatus = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { repoIds } = req.body;

        if (!Array.isArray(repoIds)) {
            throw new APIError('repoIds must be an array', 400);
        }

        const statusMap = {};
        
        // This could be optimized for large arrays, but for UI usage (10-20 items) it's fine
        // Alternatively we could fetch all IDs from the subcollection if the list is small enough
        
        // Let's fetch all bookmarks to minimize reads/queries if checking multiple
        const snapshot = await collections.users()
            .doc(userId)
            .collection('bookmarks')
            .select('id') // Only fetch ID field
            .get();

        const bookmarkedIds = new Set();
        snapshot.forEach(doc => {
            bookmarkedIds.add(doc.id);
        });

        repoIds.forEach(id => {
            statusMap[id] = bookmarkedIds.has(id.toString());
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
    addBookmark,
    removeBookmark,
    getBookmarks,
    checkStatus
};
