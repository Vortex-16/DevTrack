/**
 * Tier Configuration
 * ═══════════════════════════════════════════════════════════════════════════
 * Defines limits for Free / Pro / Enterprise tiers.
 * Single source of truth — quotaGuard, quotaService, and frontend all
 * derive their behavior from this file.
 *
 * Each limit entry:
 *   { max: number, window: 'day' | 'month' | 'lifetime', label: string }
 *
 * max = Infinity means "unlimited" (skip quota check entirely).
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { TIERS, ACTIONS, QUOTA_WINDOWS } = require('./constants');

// ─── Tier Limit Definitions ──────────────────────────────────────────────────

const TIER_LIMITS = Object.freeze({

    // ── FREE TIER ────────────────────────────────────────────────────────────
    [TIERS.FREE]: {
        [ACTIONS.AI_CHAT]: {
            max: 25,
            window: QUOTA_WINDOWS.DAY,
            label: 'AI Chat Messages',
        },
        [ACTIONS.AI_CODE_REVIEW]: {
            max: 3,
            window: QUOTA_WINDOWS.DAY,
            label: 'AI Code Reviews',
        },
        [ACTIONS.AI_PROJECT_ANALYSIS]: {
            max: 2,
            window: QUOTA_WINDOWS.DAY,
            label: 'AI Project Analyses',
        },
        [ACTIONS.AI_INSIGHTS]: {
            max: 3,
            window: QUOTA_WINDOWS.DAY,
            label: 'AI Insights',
        },
        [ACTIONS.README_GEN]: {
            max: 1,
            window: QUOTA_WINDOWS.DAY,
            label: 'README Generations',
        },
        [ACTIONS.RESUME_AI_SUMMARY]: {
            max: 0,    // Not available on Free tier
            window: QUOTA_WINDOWS.DAY,
            label: 'AI Resume Summary',
        },
        [ACTIONS.PDF_REPORT]: {
            max: 1,
            window: QUOTA_WINDOWS.MONTH,
            label: 'PDF Reports',
        },
        [ACTIONS.PROJECT_CREATE]: {
            max: 3,
            window: QUOTA_WINDOWS.LIFETIME,
            label: 'Projects',
        },
        [ACTIONS.SHOWCASE_CREATE]: {
            max: 2,
            window: QUOTA_WINDOWS.LIFETIME,
            label: 'Showcase Posts',
        },
        [ACTIONS.LEARNING_LOG]: {
            max: 50,
            window: QUOTA_WINDOWS.MONTH,
            label: 'Learning Logs',
        },
    },

    // ── PRO TIER ─────────────────────────────────────────────────────────────
    [TIERS.PRO]: {
        [ACTIONS.AI_CHAT]: {
            max: 200,
            window: QUOTA_WINDOWS.DAY,
            label: 'AI Chat Messages',
        },
        [ACTIONS.AI_CODE_REVIEW]: {
            max: 20,
            window: QUOTA_WINDOWS.DAY,
            label: 'AI Code Reviews',
        },
        [ACTIONS.AI_PROJECT_ANALYSIS]: {
            max: 15,
            window: QUOTA_WINDOWS.DAY,
            label: 'AI Project Analyses',
        },
        [ACTIONS.AI_INSIGHTS]: {
            max: 30,
            window: QUOTA_WINDOWS.DAY,
            label: 'AI Insights',
        },
        [ACTIONS.README_GEN]: {
            max: 10,
            window: QUOTA_WINDOWS.DAY,
            label: 'README Generations',
        },
        [ACTIONS.RESUME_AI_SUMMARY]: {
            max: 5,
            window: QUOTA_WINDOWS.DAY,
            label: 'AI Resume Summary',
        },
        [ACTIONS.PDF_REPORT]: {
            max: Infinity,
            window: QUOTA_WINDOWS.MONTH,
            label: 'PDF Reports',
        },
        [ACTIONS.PROJECT_CREATE]: {
            max: 15,
            window: QUOTA_WINDOWS.LIFETIME,
            label: 'Projects',
        },
        [ACTIONS.SHOWCASE_CREATE]: {
            max: Infinity,
            window: QUOTA_WINDOWS.LIFETIME,
            label: 'Showcase Posts',
        },
        [ACTIONS.LEARNING_LOG]: {
            max: Infinity,
            window: QUOTA_WINDOWS.MONTH,
            label: 'Learning Logs',
        },
    },

    // ── ENTERPRISE TIER (Placeholder — all unlimited) ────────────────────────
    [TIERS.ENTERPRISE]: {
        [ACTIONS.AI_CHAT]: {
            max: Infinity,
            window: QUOTA_WINDOWS.DAY,
            label: 'AI Chat Messages',
        },
        [ACTIONS.AI_CODE_REVIEW]: {
            max: Infinity,
            window: QUOTA_WINDOWS.DAY,
            label: 'AI Code Reviews',
        },
        [ACTIONS.AI_PROJECT_ANALYSIS]: {
            max: Infinity,
            window: QUOTA_WINDOWS.DAY,
            label: 'AI Project Analyses',
        },
        [ACTIONS.AI_INSIGHTS]: {
            max: Infinity,
            window: QUOTA_WINDOWS.DAY,
            label: 'AI Insights',
        },
        [ACTIONS.README_GEN]: {
            max: Infinity,
            window: QUOTA_WINDOWS.DAY,
            label: 'README Generations',
        },
        [ACTIONS.RESUME_AI_SUMMARY]: {
            max: Infinity,
            window: QUOTA_WINDOWS.DAY,
            label: 'AI Resume Summary',
        },
        [ACTIONS.PDF_REPORT]: {
            max: Infinity,
            window: QUOTA_WINDOWS.MONTH,
            label: 'PDF Reports',
        },
        [ACTIONS.PROJECT_CREATE]: {
            max: Infinity,
            window: QUOTA_WINDOWS.LIFETIME,
            label: 'Projects',
        },
        [ACTIONS.SHOWCASE_CREATE]: {
            max: Infinity,
            window: QUOTA_WINDOWS.LIFETIME,
            label: 'Showcase Posts',
        },
        [ACTIONS.LEARNING_LOG]: {
            max: Infinity,
            window: QUOTA_WINDOWS.MONTH,
            label: 'Learning Logs',
        },
    },
});

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Get the limit configuration for a specific tier and action.
 * @param {string} tier  - One of TIERS values ('free', 'pro', 'enterprise')
 * @param {string} action - One of ACTIONS values ('ai_chat', 'project_create', etc.)
 * @returns {{ max: number, window: string, label: string }}
 */
function getLimitForTier(tier, action) {
    const tierLimits = TIER_LIMITS[tier];
    if (!tierLimits) {
        // Unknown tier → fall back to free limits (safety net)
        return TIER_LIMITS[TIERS.FREE][action] || { max: 0, window: 'day', label: action };
    }
    return tierLimits[action] || { max: 0, window: 'day', label: action };
}

/**
 * Check if a tier + action combo is unlimited.
 * @param {string} tier
 * @param {string} action
 * @returns {boolean}
 */
function isUnlimited(tier, action) {
    const limit = getLimitForTier(tier, action);
    return limit.max === Infinity;
}

/**
 * Get all limits for a given tier (for dashboard display).
 * @param {string} tier
 * @returns {Object.<string, { max: number, window: string, label: string }>}
 */
function getAllLimitsForTier(tier) {
    return TIER_LIMITS[tier] || TIER_LIMITS[TIERS.FREE];
}

/**
 * Validate that a tier value is recognized.
 * @param {string} tier
 * @returns {boolean}
 */
function isValidTier(tier) {
    return Object.values(TIERS).includes(tier);
}

/**
 * Get the default tier for new users.
 * @returns {string}
 */
function getDefaultTier() {
    return TIERS.FREE;
}

/**
 * Self-test: validates that every ACTIONS value has an entry in every tier.
 * Call during startup in development to catch config drift.
 * @returns {{ valid: boolean, missing: string[] }}
 */
function validate() {
    const missing = [];
    for (const tier of Object.values(TIERS)) {
        for (const action of Object.values(ACTIONS)) {
            if (!TIER_LIMITS[tier]?.[action]) {
                missing.push(`${tier}.${action}`);
            }
        }
    }
    const valid = missing.length === 0;
    if (!valid) {
        console.error('[tierConfig] Missing limit definitions:', missing);
    }
    return { valid, missing };
}

module.exports = {
    TIER_LIMITS,
    getLimitForTier,
    isUnlimited,
    getAllLimitsForTier,
    isValidTier,
    getDefaultTier,
    validate,
};
