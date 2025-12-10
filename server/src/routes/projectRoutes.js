/**
 * Projects Routes
 * Routes for project CRUD operations
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const projectController = require('../controllers/projectController');

// Get projects statistics (must be before /:id to avoid conflict)
router.get('/stats', requireAuth, projectController.getStats);

// Get all projects for user (with pagination)
router.get('/', requireAuth, validate('pagination', 'query'), projectController.getProjects);

// Get single project by ID
router.get('/:id', requireAuth, projectController.getProject);

// Create new project
router.post('/', requireAuth, validate('createProject'), projectController.createProject);

// Update project
router.put('/:id', requireAuth, validate('updateProject'), projectController.updateProject);

// Delete project
router.delete('/:id', requireAuth, projectController.deleteProject);

module.exports = router;
