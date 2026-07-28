/**
 * Projects Routes
 * Routes for project CRUD operations
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { quotaGuard } = require('../middleware/quotaGuard');
const projectController = require('../controllers/projectController');

// Get projects statistics (must be before /:id to avoid conflict)
router.get('/stats', requireAuth, projectController.getStats);

// Get all projects for user (with pagination)
router.get('/', requireAuth, validate('pagination', 'query'), projectController.getProjects);

// Get single project by ID
router.get('/:id', requireAuth, projectController.getProject);

// Create new project (quota protected)
router.post('/', requireAuth, quotaGuard('project_create'), validate('createProject'), projectController.createProject);

// Update project
router.put('/:id', requireAuth, validate('updateProject'), projectController.updateProject);

// Reanalyze project from GitHub + AI (quota protected)
router.post('/:id/reanalyze', requireAuth, quotaGuard('ai_project_analysis'), projectController.reanalyzeProject);

// Delete project
router.delete('/:id', requireAuth, projectController.deleteProject);

// Cleanup: remove projects with deleted GitHub repos and duplicates
router.post('/cleanup', requireAuth, projectController.cleanupProjects);

module.exports = router;
