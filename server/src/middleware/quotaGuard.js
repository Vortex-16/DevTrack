/**
 * Quota Guard Middleware
 * ═══════════════════════════════════════════════════════════════════════════
 * Express middleware factory that checks tier-based quotas before
 * allowing a request through.
 *
 * Usage:
 *   const { quotaGuard } = require('../middleware/quotaGuard');
 *   router.post('/chat', requireAuth, quotaGuard('ai_chat'), chatController);
 *
 * On quota exceeded → throws QuotaExceededError (429) with structured details.
 * On feature disabled for tier → throws PaymentRequiredError (402).
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { checkAndIncrement } = require('../services/quotaService');
const { QuotaExceededError, PaymentRequiredError } = require('./errorHandler');
const logger = require('../utils/logger');

/**
 * Create a quota-checking middleware for a specific action.
 *
 * @param {string} action — One of ACTIONS values (e.g., 'ai_chat', 'project_create')
 * @returns {function} Express middleware (req, res, next)
 */
function quotaGuard(action) {
    return async (req, res, next) => {
        try {
            const userId = req.auth?.userId;

            if (!userId) {
                // No auth → let the auth middleware handle it (shouldn't reach here)
                return next();
            }

            const result = await checkAndIncrement(userId, action);

            // Attach quota info to request for downstream use (e.g., response headers)
            req.quota = {
                action,
                tier: result.tier,
                used: result.used,
                limit: result.limit,
                remaining: result.remaining,
                resetAt: result.resetAt,
            };

            if (!result.allowed) {
                // Feature completely disabled for this tier (limit === 0)
                if (result.limit === 0) {
                    throw new PaymentRequiredError(result.label);
                }

                // Over quota
                throw new QuotaExceededError(
                    action,
                    result.limit,
                    result.used,
                    result.resetAt,
                    result.label
                );
            }

            // Set informational response headers
            res.setHeader('X-Quota-Limit', result.limit === Infinity ? 'unlimited' : result.limit);
            res.setHeader('X-Quota-Remaining', result.remaining === Infinity ? 'unlimited' : result.remaining);
            if (result.resetAt) {
                res.setHeader('X-Quota-Reset', result.resetAt);
            }

            next();
        } catch (error) {
            // Re-throw quota/payment errors directly
            if (error instanceof QuotaExceededError || error instanceof PaymentRequiredError) {
                return next(error);
            }

            // Unexpected errors → log and let the request through (fail-open for quota checks)
            logger.error('Quota guard error — failing open', {
                action,
                userId: req.auth?.userId,
                error: error.message,
            });
            next();
        }
    };
}

/**
 * Tier-gate middleware: blocks the request entirely if user is not on the required tier.
 * Unlike quotaGuard which counts usage, this is a simple tier check.
 *
 * @param  {...string} allowedTiers — e.g. tierGate('pro', 'enterprise')
 * @returns {function} Express middleware
 */
function tierGate(...allowedTiers) {
    return async (req, res, next) => {
        try {
            const userId = req.auth?.userId;
            if (!userId) return next();

            const { getUserTier } = require('../services/quotaService');
            const tier = await getUserTier(userId);

            if (!allowedTiers.includes(tier)) {
                throw new PaymentRequiredError('this feature');
            }

            req.tier = tier;
            next();
        } catch (error) {
            if (error instanceof PaymentRequiredError) {
                return next(error);
            }
            logger.error('Tier gate error — failing open', { error: error.message });
            next();
        }
    };
}

module.exports = { quotaGuard, tierGate };
