/**
 * Project Ideas Routes
 * AI-powered project idea generation
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const projectIdeasController = require('../controllers/projectIdeasController');

// Generate personalized project ideas based on user's skills
// POST /api/project-ideas/generate
router.post('/generate', requireAuth, projectIdeasController.generateIdeas);

module.exports = router;
