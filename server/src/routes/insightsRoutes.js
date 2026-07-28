/**
 * Insights Routes
 * AI-powered developer productivity and risk analysis endpoints.
 * All routes use aiLimiter (100 req/15min) defined in app.js.
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { quotaGuard } = require('../middleware/quotaGuard');
const insights = require('../controllers/insightsController');

// Productivity trend analysis (quota protected)
router.get('/productivity', requireAuth, quotaGuard('ai_insights'), insights.getProductivityTrends);

// Personalized strategic recommendations (quota protected)
router.get('/recommendations', requireAuth, quotaGuard('ai_insights'), insights.getRecommendations);

// Project risk analysis (quota protected)
router.get('/risk', requireAuth, quotaGuard('ai_insights'), insights.getRiskAnalysis);

// Weekly momentum score + 12-week history (quota protected)
router.get('/momentum', requireAuth, quotaGuard('ai_insights'), insights.getMomentum);

module.exports = router;
