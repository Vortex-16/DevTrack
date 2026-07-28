/**
 * Gemini AI Routes
 * Routes for AI chat and assistance
 */

const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { quotaGuard } = require('../middleware/quotaGuard');
const geminiController = require('../controllers/geminiController');

// Chat with AI (quota protected)
router.post('/chat', requireAuth, quotaGuard('ai_chat'), validate('geminiChat'), geminiController.chat);

// Get motivational message based on stats
router.post('/motivation', requireAuth, geminiController.getMotivation);

// Get code review (quota protected)
router.post('/review', requireAuth, quotaGuard('ai_code_review'), geminiController.reviewCode);

// Health check for AI service
router.get('/health', geminiController.healthCheck);

// Analyze project progress (quota protected)
router.post('/analyze-project', requireAuth, quotaGuard('ai_project_analysis'), geminiController.analyzeProject);

// Get chat history
router.get('/history', requireAuth, geminiController.getChatHistory);

// Clear chat history
router.delete('/history', requireAuth, geminiController.deleteChatHistory);

module.exports = router;
