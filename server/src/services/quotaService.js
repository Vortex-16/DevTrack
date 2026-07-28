/**
 * Quota Service
 * ═══════════════════════════════════════════════════════════════════════════
 * Manages per-user usage counters and checks against tier limits.
 *
 * Storage strategy:
 *   - Redis (primary): Fast atomic INCR + TTL for daily/monthly counters
 *   - Firestore (audit): Optional audit log for billing/analytics
 *   - In-memory fallback: node-cache if Redis is unavailable
 *
 * Counter key format:
 *   quota:{userId}:{action}:{window_suffix}
 *   e.g. "quota:user_abc:ai_chat:2026-07-27"         (daily)
 *        "quota:user_abc:pdf_report:2026-07"           (monthly)
 *        "quota:user_abc:project_create:lifetime"      (lifetime)
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { collections } = require('../config/firebase');
const { TIERS, ACTIONS, QUOTA_WINDOWS } = require('../config/constants');
const { getLimitForTier, isUnlimited } = require('../config/tierConfig');
const logger = require('../utils/logger');

// ─── Key Helpers ─────────────────────────────────────────────────────────────

/**
 * Build the Redis key for a quota counter.
 */
function _buildKey(userId, action, window) {
    const suffix = _windowSuffix(window);
    return `quota:${userId}:${action}:${suffix}`;
}

/**
 * Generate a time-based suffix for the current window.
 */
function _windowSuffix(window) {
    const now = new Date();
    switch (window) {
        case QUOTA_WINDOWS.DAY:
            return now.toISOString().slice(0, 10);          // "2026-07-27"
        case QUOTA_WINDOWS.MONTH:
            return now.toISOString().slice(0, 7);            // "2026-07"
        case QUOTA_WINDOWS.LIFETIME:
            return 'lifetime';
        default:
            return now.toISOString().slice(0, 10);
    }
}

/**
 * Calculate seconds until the current window resets.
 */
function _ttlForWindow(window) {
    const now = new Date();
    switch (window) {
        case QUOTA_WINDOWS.DAY: {
            const endOfDay = new Date(now);
            endOfDay.setUTCHours(23, 59, 59, 999);
            return Math.ceil((endOfDay - now) / 1000) + 1;
        }
        case QUOTA_WINDOWS.MONTH: {
            const endOfMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
            return Math.ceil((endOfMonth - now) / 1000);
        }
        case QUOTA_WINDOWS.LIFETIME:
            return 0;   // Never expires
        default:
            return 86400; // 24h fallback
    }
}

/**
 * ISO string of when the current window resets.
 */
function _resetAt(window) {
    const now = new Date();
    switch (window) {
        case QUOTA_WINDOWS.DAY: {
            const tomorrow = new Date(now);
            tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
            tomorrow.setUTCHours(0, 0, 0, 0);
            return tomorrow.toISOString();
        }
        case QUOTA_WINDOWS.MONTH: {
            const nextMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
            return nextMonth.toISOString();
        }
        case QUOTA_WINDOWS.LIFETIME:
            return null;   // Never resets
        default:
            return null;
    }
}

// ─── Redis Abstraction (lazy-loaded, fallback-safe) ──────────────────────────

let _cache = null;

function _getCache() {
    if (!_cache) {
        _cache = require('../config/cache');
    }
    return _cache;
}

/**
 * Atomically get and increment a counter.
 * Returns the count BEFORE the increment (i.e., current usage).
 */
async function _getAndIncrement(key, ttlSeconds) {
    const cache = _getCache();

    // Try Redis-based atomic increment if available
    if (cache.incr) {
        try {
            const newVal = await cache.incr(key, ttlSeconds);
            return newVal - 1;   // Return count before this increment
        } catch {
            // Fall through to in-memory
        }
    }

    // Fallback: in-memory get/set (not atomic across processes, but works for single-instance)
    const current = cache.get(key) || 0;
    cache.set(key, current + 1, ttlSeconds || undefined);
    return current;
}

/**
 * Get current counter value without incrementing.
 */
async function _getCount(key) {
    const cache = _getCache();

    if (cache.getAsync) {
        try {
            const val = await cache.getAsync(key);
            return parseInt(val, 10) || 0;
        } catch {
            // Fall through
        }
    }

    return cache.get(key) || 0;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get the user's current tier from Firestore (with short-term caching).
 * @param {string} userId
 * @returns {Promise<string>} — 'free', 'pro', or 'enterprise'
 */
async function getUserTier(userId) {
    const cache = _getCache();
    const cacheKey = `tier:${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const userDoc = await collections.users().doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        const githubUsername = (userData.githubUsername || '').toLowerCase();
        const email = (userData.email || '').toLowerCase();

        // Permanent Pro Exemption for Vortex-16 / Admin
        const isVortexUser = githubUsername === 'vortex-16' ||
            githubUsername === 'Vortex-16' ||
            email.includes('alpha4coders') ||
            userData.isExemptFromDowngrade === true;

        if (isVortexUser) {
            cache.set(cacheKey, TIERS.PRO, 300);
            return TIERS.PRO;
        }

        const tier = userData.tier || TIERS.FREE;

        // Check if Pro trial has expired
        const tierExpiresAt = userData.tierExpiresAt;
        if (tier === TIERS.PRO && tierExpiresAt) {
            const expiryDate = tierExpiresAt.toDate ? tierExpiresAt.toDate() : new Date(tierExpiresAt);
            if (expiryDate < new Date()) {
                // Pro trial expired → downgrade to free
                await collections.users().doc(userId).update({
                    tier: TIERS.FREE,
                    tierExpiresAt: null,
                    tierDowngradedAt: new Date().toISOString(),
                });
                cache.set(cacheKey, TIERS.FREE, 120);
                return TIERS.FREE;
            }
        }

        cache.set(cacheKey, tier, 120);   // Cache for 2 min
        return tier;
    } catch (error) {
        logger.warn('Failed to fetch user tier, defaulting to free', { userId, error: error.message });
        return TIERS.FREE;
    }
}

/**
 * Check if a user can perform an action based on their tier.
 * Does NOT increment the counter — use incrementUsage() after the action succeeds.
 *
 * @param {string} userId
 * @param {string} action — One of ACTIONS values
 * @returns {Promise<{ allowed: boolean, remaining: number, limit: number, used: number, resetAt: string|null, label: string, tier: string }>}
 */
async function canPerformAction(userId, action) {
    const tier = await getUserTier(userId);
    const limitConfig = getLimitForTier(tier, action);

    // Unlimited? Always allowed.
    if (limitConfig.max === Infinity) {
        return {
            allowed: true,
            remaining: Infinity,
            limit: Infinity,
            used: 0,
            resetAt: null,
            label: limitConfig.label,
            tier,
        };
    }

    // Feature disabled for this tier (max === 0)?
    if (limitConfig.max === 0) {
        return {
            allowed: false,
            remaining: 0,
            limit: 0,
            used: 0,
            resetAt: null,
            label: limitConfig.label,
            tier,
        };
    }

    const key = _buildKey(userId, action, limitConfig.window);
    const used = await _getCount(key);
    const remaining = Math.max(0, limitConfig.max - used);

    return {
        allowed: used < limitConfig.max,
        remaining,
        limit: limitConfig.max,
        used,
        resetAt: _resetAt(limitConfig.window),
        label: limitConfig.label,
        tier,
    };
}

/**
 * Increment usage counter for an action.
 * Call this AFTER the action succeeds (not before — use canPerformAction for pre-check).
 *
 * @param {string} userId
 * @param {string} action
 * @returns {Promise<{ used: number, remaining: number, limit: number }>}
 */
async function incrementUsage(userId, action) {
    const tier = await getUserTier(userId);
    const limitConfig = getLimitForTier(tier, action);

    if (limitConfig.max === Infinity) {
        return { used: 0, remaining: Infinity, limit: Infinity };
    }

    const key = _buildKey(userId, action, limitConfig.window);
    const ttl = _ttlForWindow(limitConfig.window);
    const usedBefore = await _getAndIncrement(key, ttl);
    const usedAfter = usedBefore + 1;

    return {
        used: usedAfter,
        remaining: Math.max(0, limitConfig.max - usedAfter),
        limit: limitConfig.max,
    };
}

/**
 * Check AND increment in one call — for use by quotaGuard middleware.
 * Returns the quota check result; if allowed, the counter is already incremented.
 *
 * @param {string} userId
 * @param {string} action
 * @returns {Promise<{ allowed: boolean, remaining: number, limit: number, used: number, resetAt: string|null, label: string, tier: string }>}
 */
async function checkAndIncrement(userId, action) {
    const tier = await getUserTier(userId);
    const limitConfig = getLimitForTier(tier, action);

    if (limitConfig.max === Infinity) {
        return { allowed: true, remaining: Infinity, limit: Infinity, used: 0, resetAt: null, label: limitConfig.label, tier };
    }

    if (limitConfig.max === 0) {
        return { allowed: false, remaining: 0, limit: 0, used: 0, resetAt: null, label: limitConfig.label, tier };
    }

    const key = _buildKey(userId, action, limitConfig.window);
    const ttl = _ttlForWindow(limitConfig.window);
    const usedBefore = await _getAndIncrement(key, ttl);

    if (usedBefore >= limitConfig.max) {
        // Over limit — we incremented but shouldn't have. Decrement back.
        // (In-memory: just set to the limit value to avoid over-counting)
        const cache = _getCache();
        if (cache.decr) {
            try { await cache.decr(key); } catch { /* best effort */ }
        } else {
            cache.set(key, usedBefore, ttl || undefined);
        }

        return {
            allowed: false,
            remaining: 0,
            limit: limitConfig.max,
            used: usedBefore,
            resetAt: _resetAt(limitConfig.window),
            label: limitConfig.label,
            tier,
        };
    }

    return {
        allowed: true,
        remaining: Math.max(0, limitConfig.max - usedBefore - 1),
        limit: limitConfig.max,
        used: usedBefore + 1,
        resetAt: _resetAt(limitConfig.window),
        label: limitConfig.label,
        tier,
    };
}

/**
 * Get full usage summary for a user across all actions (for dashboard display).
 * @param {string} userId
 * @returns {Promise<Object.<string, { used: number, limit: number, remaining: number, resetAt: string|null, label: string }>>}
 */
async function getUsageSummary(userId) {
    const tier = await getUserTier(userId);
    const summary = {};

    for (const action of Object.values(ACTIONS)) {
        const limitConfig = getLimitForTier(tier, action);

        if (limitConfig.max === Infinity) {
            summary[action] = {
                used: 0,
                limit: Infinity,
                remaining: Infinity,
                resetAt: null,
                label: limitConfig.label,
            };
            continue;
        }

        const key = _buildKey(userId, action, limitConfig.window);
        const used = await _getCount(key);

        summary[action] = {
            used,
            limit: limitConfig.max,
            remaining: Math.max(0, limitConfig.max - used),
            resetAt: _resetAt(limitConfig.window),
            label: limitConfig.label,
        };
    }

    return { tier, usage: summary };
}

module.exports = {
    getUserTier,
    canPerformAction,
    incrementUsage,
    checkAndIncrement,
    getUsageSummary,
};
