/**
 * Unified Cache Layer
 *
 * Provides a consistent get/set/del/flush interface.
 * Currently backed by node-cache (in-process, zero dependencies).
 * Designed to be swappable with Redis without changing call sites —
 * just swap the implementation below.
 *
 * TTL values:
 *  - GitHub commits/insights: 600s (10 min)
 *  - Project stats: 300s (5 min)
 *  - AI insights: 900s (15 min)
 *  - User profile: 120s (2 min)
 */

const NodeCache = require('node-cache');

// Shared cache instance — one per process
const _cache = new NodeCache({
    stdTTL: 300,          // default 5 min
    checkperiod: 120,     // scan for expired keys every 2 min
    useClones: false,     // skip cloning for performance (we don't mutate cached objects)
    deleteOnExpire: true,
});

// ─── Stats (development visibility) ───────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
    _cache.on('expired', (key) => {
        // console.debug(`[Cache] Expired: ${key}`);
    });
}

// ─── Core API ─────────────────────────────────────────────────────────────────

/**
 * Get a cached value.
 * @param {string} key
 * @returns {any|undefined} - undefined on cache miss
 */
const get = (key) => {
    return _cache.get(key);
};

/**
 * Set a value in cache with optional TTL.
 * @param {string} key
 * @param {any} value
 * @param {number} [ttlSeconds] - Override default TTL. 0 = never expire.
 */
const set = (key, value, ttlSeconds) => {
    if (ttlSeconds !== undefined) {
        _cache.set(key, value, ttlSeconds);
    } else {
        _cache.set(key, value);
    }
};

/**
 * Delete a specific key.
 * @param {string} key
 */
const del = (key) => {
    _cache.del(key);
};

/**
 * Delete all keys matching a prefix.
 * Useful for invalidating a user's entire cached dataset on mutation.
 * @param {string} prefix - e.g. 'stats_user123' or 'github_'
 */
const delByPrefix = (prefix) => {
    const keys = _cache.keys();
    const toDelete = keys.filter(k => k.startsWith(prefix));
    if (toDelete.length > 0) {
        _cache.del(toDelete);
    }
    return toDelete.length;
};

/**
 * Flush the entire cache (use sparingly — only for admin or test purposes).
 */
const flush = () => {
    _cache.flushAll();
};

/**
 * Get cache statistics for health/debug endpoint.
 */
const stats = () => {
    return {
        keys: _cache.keys().length,
        hits: _cache.getStats().hits,
        misses: _cache.getStats().misses,
        ksize: _cache.getStats().ksize,
        vsize: _cache.getStats().vsize,
    };
};

// ─── TTL Constants (seconds) ──────────────────────────────────────────────────
const TTL = {
    GITHUB_COMMITS: 600,       // 10 min
    GITHUB_INSIGHTS: 600,      // 10 min
    GITHUB_REPOS: 300,         // 5 min
    PROJECT_STATS: 300,        // 5 min
    AI_INSIGHTS: 900,          // 15 min
    USER_PROFILE: 120,         // 2 min
    ACTIVITY_SUMMARY: 600,     // 10 min
    LANGUAGES: 3600,           // 1 hour
    SIMILAR_PROJECTS: 1800,    // 30 min
};

module.exports = { get, set, del, delByPrefix, flush, stats, TTL };
