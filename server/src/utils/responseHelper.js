/**
 * Response Helper
 * ═══════════════════════════════════════════════════════════════════════════
 * Standardized response builders for consistent API responses.
 * Every controller should use these instead of hand-crafting res.json().
 * ═══════════════════════════════════════════════════════════════════════════
 */

const respond = {
    /**
     * 200 OK with data payload.
     */
    success(res, data, meta = {}) {
        return res.status(200).json({ success: true, data, ...meta });
    },

    /**
     * 201 Created.
     */
    created(res, data) {
        return res.status(201).json({ success: true, data });
    },

    /**
     * 200 OK with pagination metadata.
     */
    paginated(res, data, pagination) {
        return res.status(200).json({ success: true, data, pagination });
    },

    /**
     * 204 No Content (successful delete, etc.).
     */
    noContent(res) {
        return res.status(204).end();
    },

    /**
     * Generic error response (prefer throwing APIError subclasses instead).
     */
    error(res, statusCode, message, details = null) {
        return res.status(statusCode).json({
            success: false,
            error: message,
            ...(details && { details }),
        });
    },
};

module.exports = respond;
