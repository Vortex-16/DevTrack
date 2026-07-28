/**
 * DevTrack Constants
 * ═══════════════════════════════════════════════════════════════════════════
 * Single source of truth for all enums, magic numbers, and feature flags.
 * Import from here instead of scattering literals across controllers.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── Subscription Tiers ──────────────────────────────────────────────────────

const TIERS = Object.freeze({
    FREE: 'free',
    PRO: 'pro',
    ENTERPRISE: 'enterprise',
});

// ─── Quota-able Actions ──────────────────────────────────────────────────────
// Each action maps 1:1 to a Redis counter key and a tier limit entry.

const ACTIONS = Object.freeze({
    AI_CHAT: 'ai_chat',
    AI_CODE_REVIEW: 'ai_code_review',
    AI_PROJECT_ANALYSIS: 'ai_project_analysis',
    AI_INSIGHTS: 'ai_insights',
    README_GEN: 'readme_gen',
    RESUME_AI_SUMMARY: 'resume_ai_summary',
    PDF_REPORT: 'pdf_report',
    PROJECT_CREATE: 'project_create',
    SHOWCASE_CREATE: 'showcase_create',
    LEARNING_LOG: 'learning_log',
});

// ─── Quota Windows ───────────────────────────────────────────────────────────

const QUOTA_WINDOWS = Object.freeze({
    DAY: 'day',
    MONTH: 'month',
    LIFETIME: 'lifetime',
});

// ─── Rate Limit Defaults (requests per window) ──────────────────────────────

const RATE_LIMITS = Object.freeze({
    API_GENERAL: { max: 2000, windowMs: 15 * 60 * 1000 },   // 2000 req / 15 min
    AI_ENDPOINTS: { max: 100, windowMs: 15 * 60 * 1000 },   // 100 req / 15 min
    AUTH_SYNC: { max: 120, windowMs: 15 * 60 * 1000 },      // 120 req / 15 min
    GITHUB_OPS: { max: 240, windowMs: 15 * 60 * 1000 },     // 240 req / 15 min
    PAYMENTS: { max: 30, windowMs: 15 * 60 * 1000 },        // 30 req / 15 min
});

// ─── Cache TTL (seconds) ─────────────────────────────────────────────────────

const CACHE_TTL = Object.freeze({
    GITHUB_COMMITS: 600,          // 10 min
    GITHUB_INSIGHTS: 600,         // 10 min
    GITHUB_REPOS: 300,            // 5 min
    PROJECT_STATS: 300,           // 5 min
    AI_INSIGHTS: 900,             // 15 min
    AI_RESPONSE_CACHE: 1800,      // 30 min (for identical AI queries)
    USER_PROFILE: 120,            // 2 min
    ACTIVITY_SUMMARY: 600,        // 10 min
    LANGUAGES: 3600,              // 1 hour
    SIMILAR_PROJECTS: 1800,       // 30 min
    QUOTA_COUNTER: 86400,         // 24h (daily counters)
    QUOTA_MONTHLY: 2678400,       // 31 days
    SUBSCRIPTION_STATUS: 300,     // 5 min
    RATE_LIMIT_WINDOW: 900,       // 15 min
});

// ─── File & Input Limits ─────────────────────────────────────────────────────

const INPUT_LIMITS = Object.freeze({
    MAX_FILE_SIZE_BYTES: 8 * 1024 * 1024,     // 8 MB
    MAX_CODE_LENGTH: 20000,                    // 20K chars for code review
    MAX_CHAT_MESSAGE_LENGTH: 10000,            // 10K chars per chat message
    MAX_LOG_DESCRIPTION_LENGTH: 5000,          // 5K chars for learning log
    MAX_PROJECT_NAME_LENGTH: 100,
    MAX_SHOWCASE_DESCRIPTION: 2000,
    MAX_RESUME_SECTION_LENGTH: 3000,
});

// ─── Server Config ───────────────────────────────────────────────────────────

const SERVER = Object.freeze({
    DEFAULT_PORT: 9000,
    GRACEFUL_SHUTDOWN_MS: 30_000,
    KEEP_ALIVE_TIMEOUT_MS: 65_000,
    HEADERS_TIMEOUT_MS: 66_000,
    JSON_BODY_LIMIT: '5mb',
});

// ─── Grandfathering Config ───────────────────────────────────────────────────

const GRANDFATHERING = Object.freeze({
    PRO_TRIAL_DAYS: 30,
    SEND_EMAIL_BEFORE_DOWNGRADE: true,
    EMAIL_DAYS_BEFORE_DOWNGRADE: 3,   // Send reminder 3 days before expiry
});

// ─── Stripe Config ───────────────────────────────────────────────────────────

const STRIPE = Object.freeze({
    CURRENCY_INR: 'inr',
    CURRENCY_USD: 'usd',
    PRICE_INR_AMOUNT: 19900,     // ₹199 in paise
    PRICE_USD_AMOUNT: 500,       // $5 in cents
    BILLING_INTERVAL: 'month',
    CHECKOUT_SUCCESS_PATH: '/dashboard?subscription=success',
    CHECKOUT_CANCEL_PATH: '/pricing?subscription=cancelled',
});

module.exports = {
    TIERS,
    ACTIONS,
    QUOTA_WINDOWS,
    RATE_LIMITS,
    CACHE_TTL,
    INPUT_LIMITS,
    SERVER,
    GRANDFATHERING,
    STRIPE,
};
