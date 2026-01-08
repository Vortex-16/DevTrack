/**
 * Gemini AI Routes
 * Routes for AI chat and assistance
 */

const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const geminiController = require('../controllers/geminiController');

// Chat with AI (requires auth for rate limiting per user)
router.post('/chat', requireAuth, validate('geminiChat'), geminiController.chat);

// Get motivational message based on stats
router.post('/motivation', requireAuth, geminiController.getMotivation);

// Get code review
router.post('/review', requireAuth, geminiController.reviewCode);

// Health check for Gemini service
router.get('/health', geminiController.healthCheck);

// Analyze project progress
router.post('/analyze-project', requireAuth, geminiController.analyzeProject);

// Get chat history
router.get('/history', requireAuth, geminiController.getChatHistory);

// Clear chat history
router.delete('/history', requireAuth, geminiController.deleteChatHistory);

module.exports = router;
