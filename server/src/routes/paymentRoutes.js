/**
 * Payment Routes
 * ═══════════════════════════════════════════════════════════════════════════
 * Router endpoints for Stripe subscriptions and usage reporting.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { requireAuth } = require('../middleware/auth');

// Note: /webhook route is handled separately in app.js with express.raw() body parsing
// before general express.json() middleware.

router.post('/create-checkout-session', requireAuth, paymentController.createCheckoutSession);
router.post('/create-portal-session', requireAuth, paymentController.createPortalSession);
router.get('/status', requireAuth, paymentController.getStatus);
router.get('/usage', requireAuth, paymentController.getUsage);
router.post('/cancel', requireAuth, paymentController.cancelSubscription);

module.exports = router;
