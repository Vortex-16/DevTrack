/**
 * Structured Logger — Production-grade logging utility
 *
 * Features:
 *  - JSON-structured output in production (compatible with Render logs, Datadog, CloudWatch)
 *  - Human-readable colored output in development
 *  - Request ID propagation (attach to req.log when using withRequest())
 *  - Log levels: debug < info < warn < error
 *  - Never crashes on circular references or non-serializable objects
 *
 * Usage:
 *   const logger = require('./logger');
 *   logger.info('Server started', { port: 9000 });
 *   logger.error('GitHub API failed', { userId, error: err.message });
 *
 *   // In a middleware/controller with request context:
 *   const reqLog = logger.withRequest(req);
 *   reqLog.info('Fetching GitHub insights');
 */

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

const MIN_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] ?? (
    process.env.NODE_ENV === 'production' ? LOG_LEVELS.info : LOG_LEVELS.debug
);

const IS_PROD = process.env.NODE_ENV === 'production';

// ANSI color codes for dev readability
const COLORS = {
    debug: '\x1b[36m',  // Cyan
    info: '\x1b[32m',   // Green
    warn: '\x1b[33m',   // Yellow
    error: '\x1b[31m',  // Red
    reset: '\x1b[0m',
    dim: '\x1b[2m',
};

/**
 * Safely serialize a value to JSON, handling circular references.
 */
const safeStringify = (value) => {
    if (value === null || value === undefined) return String(value);
    if (typeof value === 'string') return value;
    if (value instanceof Error) {
        return JSON.stringify({
            message: value.message,
            name: value.name,
            stack: IS_PROD ? undefined : value.stack,
        });
    }
    try {
        const seen = new WeakSet();
        return JSON.stringify(value, (_key, val) => {
            if (typeof val === 'object' && val !== null) {
                if (seen.has(val)) return '[Circular]';
                seen.add(val);
            }
            return val;
        });
    } catch {
        return String(value);
    }
};

/**
 * Core log function
 * @param {'debug'|'info'|'warn'|'error'} level
 * @param {string} message
 * @param {object} [meta] - Additional structured data
 */
const log = (level, message, meta = {}) => {
    if (LOG_LEVELS[level] < MIN_LEVEL) return;

    const timestamp = new Date().toISOString();

    if (IS_PROD) {
        // JSON format for log aggregation (Render, Datadog, etc.)
        const entry = {
            ts: timestamp,
            level,
            msg: message,
            ...meta,
        };
        // Error/warn → stderr, others → stdout
        const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
        stream.write(safeStringify(entry) + '\n');
    } else {
        // Human-readable colored format for development
        const color = COLORS[level] || COLORS.reset;
        const dim = COLORS.dim;
        const reset = COLORS.reset;
        const levelTag = `${color}[${level.toUpperCase()}]${reset}`;
        const ts = `${dim}${timestamp.split('T')[1].replace('Z', '')}${reset}`;
        const metaStr = Object.keys(meta).length > 0
            ? ` ${dim}${safeStringify(meta)}${reset}`
            : '';
        console.log(`${ts} ${levelTag} ${message}${metaStr}`);
    }
};

// ─── Public API ───────────────────────────────────────────────────────────────

const logger = {
    debug: (msg, meta) => log('debug', msg, meta),
    info: (msg, meta) => log('info', msg, meta),
    warn: (msg, meta) => log('warn', msg, meta),
    error: (msg, meta) => log('error', msg, meta),

    /**
     * Create a child logger bound to a request context.
     * Automatically includes requestId and userId in all log entries.
     * @param {Express.Request} req
     * @returns {object} Logger with same API but pre-filled request context
     */
    withRequest: (req) => {
        const context = {
            requestId: req.headers?.['x-request-id'] || req.requestId,
            userId: req.auth?.userId,
            path: req.path,
            method: req.method,
        };
        return {
            debug: (msg, meta) => log('debug', msg, { ...context, ...meta }),
            info: (msg, meta) => log('info', msg, { ...context, ...meta }),
            warn: (msg, meta) => log('warn', msg, { ...context, ...meta }),
            error: (msg, meta) => log('error', msg, { ...context, ...meta }),
        };
    },

    /**
     * Log an HTTP request completion (used by custom morgan-compatible middleware).
     */
    http: (req, res, responseTime) => {
        const level = res.statusCode >= 500 ? 'error'
            : res.statusCode >= 400 ? 'warn'
                : 'info';
        log(level, `${req.method} ${req.path} ${res.statusCode}`, {
            duration: `${responseTime}ms`,
            requestId: req.headers?.['x-request-id'],
            ip: req.ip,
        });
    },
};

module.exports = logger;
