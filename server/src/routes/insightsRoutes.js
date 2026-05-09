/**
 * Insights Routes
 * AI-powered developer productivity and risk analysis endpoints.
 * All routes use aiLimiter (100 req/15min) defined in app.js.
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const insights = require('../controllers/insightsController');

// Productivity trend analysis (commit/activity patterns over 30-90 days)
router.get('/productivity', requireAuth, insights.getProductivityTrends);

// Personalized strategic recommendations
router.get('/recommendations', requireAuth, insights.getRecommendations);

// Project risk analysis (health, staleness, security alerts)
router.get('/risk', requireAuth, insights.getRiskAnalysis);

// Weekly momentum score + 12-week history
router.get('/momentum', requireAuth, insights.getMomentum);

module.exports = router;
