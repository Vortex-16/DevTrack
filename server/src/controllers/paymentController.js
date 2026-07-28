/**
 * Payment Controller
 * ═══════════════════════════════════════════════════════════════════════════
 * Express route handlers for Stripe subscription checkout, customer portal,
 * status checks, webhook handling, and usage statistics.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const paymentService = require('../services/paymentService');
const { getUsageSummary } = require('../services/quotaService');
const respond = require('../utils/responseHelper');
const { APIError, ValidationError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Create a Stripe Checkout Session for subscription upgrade.
 * POST /api/payments/create-checkout-session
 */
const createCheckoutSession = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { email, countryCode, returnUrl } = req.body;

        if (!userId) {
            throw new APIError('Unauthorized access', 401);
        }

        const userEmail = email || req.auth.sessionClaims?.email || `${userId}@user.devtrack.app`;

        const session = await paymentService.createCheckoutSession(
            userId,
            userEmail,
            countryCode || 'IN',
            returnUrl
        );

        return respond.success(res, session);
    } catch (error) {
        next(error);
    }
};

/**
 * Create a Stripe Customer Portal session to manage billing/subscription.
 * POST /api/payments/create-portal-session
 */
const createPortalSession = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { returnUrl } = req.body;

        const portal = await paymentService.createPortalSession(userId, returnUrl);

        return respond.success(res, portal);
    } catch (error) {
        next(error);
    }
};

/**
 * Stripe Webhook Handler.
 * POST /api/payments/webhook
 * Note: Must be parsed with express.raw({ type: 'application/json' }) before signature check.
 */
const handleWebhook = async (req, res, next) => {
    try {
        const signature = req.headers['stripe-signature'];
        if (!signature) {
            throw new ValidationError('Missing stripe-signature header');
        }

        // Payload is raw Buffer from body-parser
        const payload = req.body;

        const result = await paymentService.handleWebhook(payload, signature);

        return res.status(200).json({ received: true, ...result });
    } catch (error) {
        logger.error('Webhook error handler caught exception', { error: error.message });
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }
};

/**
 * Get current user subscription & tier status.
 * GET /api/payments/status
 */
const getStatus = async (req, res, next) => {
    try {
        const userId = req.auth.userId;

        const status = await paymentService.getSubscriptionStatus(userId);

        return respond.success(res, status);
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user's usage summary against quota limits across all features.
 * GET /api/payments/usage
 */
const getUsage = async (req, res, next) => {
    try {
        const userId = req.auth.userId;

        const usageData = await getUsageSummary(userId);

        return respond.success(res, usageData);
    } catch (error) {
        next(error);
    }
};

/**
 * Cancel user subscription (downgrade to Free tier).
 * POST /api/payments/cancel
 */
const cancelSubscription = async (req, res, next) => {
    try {
        const userId = req.auth.userId;

        const result = await paymentService.cancelSubscription(userId);

        return respond.success(res, result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCheckoutSession,
    createPortalSession,
    handleWebhook,
    getStatus,
    getUsage,
    cancelSubscription,
};
