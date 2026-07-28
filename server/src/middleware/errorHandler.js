/**
 * Enhanced Error Handler Middleware
 * ═══════════════════════════════════════════════════════════════════════════
 * Rich error class hierarchy + centralized error serialization.
 *
 * Error classes:
 *   APIError             — generic HTTP error (any status code)
 *   ValidationError      — 400 — malformed input
 *   QuotaExceededError   — 429 — tier limit exceeded
 *   PaymentRequiredError — 402 — feature requires upgrade
 *   SubscriptionExpiredError — 403 — subscription lapsed
 * ═══════════════════════════════════════════════════════════════════════════
 */

const logger = require('../utils/logger');

// ─── Error Classes ───────────────────────────────────────────────────────────

class APIError extends Error {
    /**
     * @param {string} message  — Human-readable message
     * @param {number} statusCode — HTTP status (default 500)
     * @param {object} [details] — Optional structured details (sent to client)
     */
    constructor(message, statusCode = 500, details = null) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

class ValidationError extends APIError {
    constructor(message = 'Validation failed', details = null) {
        super(message, 400, details);
        this.name = 'ValidationError';
        this.code = 'VALIDATION_ERROR';
    }
}

class QuotaExceededError extends APIError {
    /**
     * @param {string} action — e.g. 'ai_chat'
     * @param {number} limit  — max allowed
     * @param {number} used   — current usage count
     * @param {string} resetAt — ISO string of when the quota resets
     * @param {string} label  — Human-readable feature name
     */
    constructor(action, limit, used, resetAt, label = action) {
        const message = `${label} quota exceeded. You've used ${used}/${limit}. Resets ${resetAt}.`;
        super(message, 429, {
            code: 'QUOTA_EXCEEDED',
            action,
            limit,
            used,
            remaining: 0,
            resetAt,
            upgradeUrl: '/pricing',
        });
        this.name = 'QuotaExceededError';
    }
}

class PaymentRequiredError extends APIError {
    /**
     * @param {string} feature — e.g. 'AI Resume Summary'
     */
    constructor(feature = 'this feature') {
        super(`${feature} requires a Pro subscription. Upgrade to unlock.`, 402, {
            code: 'PAYMENT_REQUIRED',
            feature,
            upgradeUrl: '/pricing',
        });
        this.name = 'PaymentRequiredError';
    }
}

class SubscriptionExpiredError extends APIError {
    constructor() {
        super('Your Pro subscription has expired. Please renew to continue using premium features.', 403, {
            code: 'SUBSCRIPTION_EXPIRED',
            upgradeUrl: '/pricing',
        });
        this.name = 'SubscriptionExpiredError';
    }
}

// ─── Error Handler Middleware ─────────────────────────────────────────────────

const errorHandler = (err, req, res, next) => {
    // Log error with request context
    const logContext = {
        message: err.message,
        name: err.name,
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
        userId: req.auth?.userId,
        requestId: req.requestId,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    };

    if (err.statusCode >= 500 || !err.statusCode) {
        logger.error('Server error', logContext);
    } else if (err.statusCode >= 400) {
        logger.warn('Client error', logContext);
    }

    // Determine status and message
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let details = err.details || null;

    // Handle specific error types (non-APIError errors)
    if (err.name === 'ValidationError' && !err.statusCode) {
        statusCode = 400;
        message = err.details?.[0]?.message || 'Validation failed';
    }

    if (err.name === 'UnauthorizedError' || err.code === 'unauthorized') {
        statusCode = 401;
        message = 'Unauthorized access';
    }

    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400;
        message = 'File too large';
    }

    // Firebase auth errors
    if (err.code?.startsWith?.('auth/')) {
        statusCode = 401;
        message = 'Authentication failed';
    }

    // Don't leak error details in production for 5xx
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Something went wrong. Please try again later.';
        details = null;
    }

    // Structured error response
    const response = {
        success: false,
        error: message,
        ...(details && { details }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    };

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
module.exports.APIError = APIError;
module.exports.ValidationError = ValidationError;
module.exports.QuotaExceededError = QuotaExceededError;
module.exports.PaymentRequiredError = PaymentRequiredError;
module.exports.SubscriptionExpiredError = SubscriptionExpiredError;
