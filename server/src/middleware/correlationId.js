/**
 * Correlation ID Middleware
 * ═══════════════════════════════════════════════════════════════════════════
 * Generates or propagates a unique request ID on every incoming request.
 * The ID is:
 *   1. Read from the incoming X-Request-ID header (if present)
 *   2. Or generated as a crypto-random UUID
 *   3. Attached to req.requestId for downstream use (logger, error handler)
 *   4. Returned in the X-Request-ID response header for client correlation
 * ═══════════════════════════════════════════════════════════════════════════
 */

const crypto = require('crypto');

const correlationId = (req, res, next) => {
    req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
    res.setHeader('X-Request-ID', req.requestId);
    next();
};

module.exports = correlationId;
