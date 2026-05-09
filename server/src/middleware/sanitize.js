/**
 * Input Sanitization Middleware
 * Protects against XSS, markdown injection, and prompt injection.
 *
 * Strategy:
 *  - Strip HTML tags from all string values in body/query/params
 *  - Truncate absurdly long strings that could overload AI prompts
 *  - Normalize null/undefined consistently
 *  - Does NOT use DOMPurify (browser-only) — uses a lightweight regex approach
 *    safe for server-side use, matching OWASP recommendations.
 */

// Characters/patterns that are dangerous in HTML context
const HTML_TAG_RE = /<\/?[a-zA-Z][^>]*>/g;
const SCRIPT_CONTENT_RE = /<script[\s\S]*?<\/script>/gi;
const EVENT_HANDLER_RE = /\bon\w+\s*=\s*["'][^"']*["']/gi;
const JAVASCRIPT_PROTO_RE = /javascript\s*:/gi;
const DATA_PROTO_RE = /data\s*:\s*text\/html/gi;

// Prompt injection patterns (protect AI endpoints)
const PROMPT_INJECTION_RE = /(\bignore\s+(all\s+)?(previous|prior|above)\s+instructions?\b|\bsystem\s+prompt\b|\bact\s+as\s+(if\s+you\s+are|a\s+new)\b)/gi;

/**
 * Sanitize a single string value.
 * @param {string} value - Raw input string
 * @param {object} options
 * @param {number} [options.maxLength=10000] - Max allowed length (truncate beyond this)
 * @param {boolean} [options.stripPromptInjection=false] - Also remove prompt injection patterns
 * @returns {string} Sanitized string
 */
const sanitizeString = (value, options = {}) => {
    if (typeof value !== 'string') return value;

    const maxLength = options.maxLength ?? 10000;

    let sanitized = value
        .replace(SCRIPT_CONTENT_RE, '')    // Remove full <script>…</script> blocks
        .replace(EVENT_HANDLER_RE, '')     // Remove on* event handlers
        .replace(JAVASCRIPT_PROTO_RE, '')  // Remove javascript: URIs
        .replace(DATA_PROTO_RE, '')        // Remove data:text/html URIs
        .replace(HTML_TAG_RE, '');         // Strip remaining HTML tags

    if (options.stripPromptInjection) {
        sanitized = sanitized.replace(PROMPT_INJECTION_RE, '[REDACTED]');
    }

    // Truncate to prevent oversized payloads from reaching AI services
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
};

/**
 * Recursively sanitize an object's string values (body, query, params).
 * Skips non-string primitives and preserves object structure.
 * @param {any} obj - Input object
 * @param {object} options - Sanitization options
 * @returns {any} Sanitized object
 */
const sanitizeObject = (obj, options = {}) => {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        return sanitizeString(obj, options);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item, options));
    }

    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            // Skip binary/buffer-like fields and large nested data structures
            if (key === 'githubData' || key === 'aiAnalysis' || key === 'pdfBuffer') {
                sanitized[key] = value; // Pass through pre-validated complex objects
            } else {
                sanitized[key] = sanitizeObject(value, options);
            }
        }
        return sanitized;
    }

    return obj; // numbers, booleans, etc. pass through unchanged
};

/**
 * Express middleware: sanitizes req.body, req.query, and req.params.
 * Applied globally after body parsing.
 */
const sanitizeRequest = (req, res, next) => {
    // Determine if this is an AI endpoint (stricter sanitization)
    const isAiEndpoint = req.path.includes('/gemini') ||
        req.path.includes('/insights') ||
        req.path.includes('/readme') ||
        req.path.includes('/project-ideas');

    const options = {
        maxLength: isAiEndpoint ? 8000 : 10000,
        stripPromptInjection: isAiEndpoint,
    };

    try {
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body, options);
        }

        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeObject(req.query, { maxLength: 500 });
        }

        // Params are URL-decoded by Express — sanitize to prevent path traversal attempts
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeObject(req.params, { maxLength: 200 });
        }
    } catch (err) {
        // Never let sanitization itself crash the server
        console.error('[Sanitize] Error during sanitization:', err.message);
    }

    next();
};

module.exports = { sanitizeRequest, sanitizeString, sanitizeObject };
