/**
 * README Routes
 * Routes for README generation and GitHub commit
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { quotaGuard } = require('../middleware/quotaGuard');
const readmeController = require('../controllers/readmeController');

// Generate README for a project (quota protected)
router.post('/generate/:projectId', requireAuth, quotaGuard('readme_gen'), readmeController.generateReadme);

// Commit README to GitHub
router.post('/commit/:projectId', requireAuth, readmeController.commitReadme);

module.exports = router;
