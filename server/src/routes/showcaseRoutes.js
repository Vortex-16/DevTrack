/**
 * Showcase Routes
 * Routes for project showcase functionality
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
    getShowcases,
    getMyShowcases,
    checkShowcaseStatus,
    createShowcase,
    deleteShowcase,
    toggleStar,
    addComment,
    deleteComment,
    getTrending,
    toggleOpenToBuild,
} = require('../controllers/showcaseController');

const { quotaGuard } = require('../middleware/quotaGuard');

// All routes require authentication
router.use(requireAuth);

// GET /api/showcase - Get all showcases
router.get('/', getShowcases);

// GET /api/showcase/mine - Get current user's showcases
router.get('/mine', getMyShowcases);

// GET /api/showcase/trending - Get trending showcases
router.get('/trending', getTrending);

// GET /api/showcase/check/:projectId - Check if project is showcased
router.get('/check/:projectId', checkShowcaseStatus);

// POST /api/showcase - Create a new showcase (quota protected)
router.post('/', quotaGuard('showcase_create'), createShowcase);

// DELETE /api/showcase/:id - Delete a showcase
router.delete('/:id', deleteShowcase);

// POST /api/showcase/:id/star - Toggle star on a showcase
router.post('/:id/star', toggleStar);

// POST /api/showcase/:id/comments - Add a comment
router.post('/:id/comments', addComment);

// DELETE /api/showcase/:id/comments/:commentId - Delete a comment
router.delete('/:id/comments/:commentId', deleteComment);

// PATCH /api/showcase/:id/open-to-build - Toggle Open to Build for a specific showcase
router.patch('/:id/open-to-build', toggleOpenToBuild);

module.exports = router;
