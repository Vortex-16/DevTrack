/**
 * Unified Cache Layer (Redis-primary, node-cache fallback)
 * ═══════════════════════════════════════════════════════════════════════════
 * Provides a consistent get/set/del/flush interface.
 * Primary: Redis (Upstash) — distributed, survives restarts, shared across instances.
 * Fallback: node-cache (in-process) — used when Redis is unavailable.
 *
 * The API surface is identical to the original node-cache-only version,
 * so ZERO call-site changes are needed anywhere in the codebase.
 *
 * New additions:
 *   - getOrSet(key, fetchFn, ttl)  — cache-aside with stampede protection
 *   - incr(key, ttlSeconds)        — atomic increment (for quota counters)
 *   - decr(key)                    — atomic decrement
 *   - getAsync(key)                — async get (for Redis)
 * ═══════════════════════════════════════════════════════════════════════════
 */

const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// ─── In-memory fallback ──────────────────────────────────────────────────────
const _fallback = new NodeCache({
    stdTTL: 300,
    checkperiod: 120,
    useClones: false,
    deleteOnExpire: true,
});

// ─── Redis reference (lazy-loaded after initializeRedis) ─────────────────────
let _redis = null;

function _getRedis() {
    if (_redis !== null) return _redis;   // Already resolved (could be false = unavailable)
    try {
        const { getRedis, isRedisConnected } = require('./redis');
        const client = getRedis();
        if (client && isRedisConnected()) {
            _redis = client;
            return _redis;
        }
    } catch { /* ioredis not installed or redis not initialized */ }
    _redis = false;   // Mark as checked-but-unavailable
    // Re-check every 30s in case Redis reconnects
    setTimeout(() => { _redis = null; }, 30_000);
    return false;
}

// ─── Core API ─────────────────────────────────────────────────────────────────

/**
 * Get a cached value (sync for node-cache, checks Redis first if available).
 * For backwards compatibility, this remains synchronous — returns from node-cache.
 * Use getAsync() for the Redis-aware async version.
 * @param {string} key
 * @returns {any|undefined}
 */
const get = (key) => {
    return _fallback.get(key);
};

/**
 * Async get — checks Redis first, then falls back to node-cache.
 * @param {string} key
 * @returns {Promise<any|undefined>}
 */
const getAsync = async (key) => {
    const redis = _getRedis();
    if (redis) {
        try {
            const val = await redis.get(key);
            if (val !== null) {
                try { return JSON.parse(val); } catch { return val; }
            }
        } catch (err) {
            logger.warn('Redis GET failed, falling back to node-cache', { key, error: err.message });
        }
    }
    return _fallback.get(key);
};

/**
 * Set a value in cache with optional TTL.
 * Writes to both Redis and node-cache for consistency.
 * @param {string} key
 * @param {any} value
 * @param {number} [ttlSeconds]
 */
const set = (key, value, ttlSeconds) => {
    // Always write to node-cache (sync, fast)
    if (ttlSeconds !== undefined) {
        _fallback.set(key, value, ttlSeconds);
    } else {
        _fallback.set(key, value);
    }

    // Also write to Redis (async, fire-and-forget)
    const redis = _getRedis();
    if (redis) {
        const serialized = JSON.stringify(value);
        if (ttlSeconds && ttlSeconds > 0) {
            redis.set(key, serialized, 'EX', ttlSeconds).catch((err) => {
                logger.warn('Redis SET failed', { key, error: err.message });
            });
        } else {
            redis.set(key, serialized).catch((err) => {
                logger.warn('Redis SET failed', { key, error: err.message });
            });
        }
    }
};

/**
 * Delete a specific key from both layers.
 * @param {string} key
 */
const del = (key) => {
    _fallback.del(key);
    const redis = _getRedis();
    if (redis) {
        redis.del(key).catch(() => {});
    }
};

/**
 * Delete all keys matching a prefix.
 * @param {string} prefix
 * @returns {number} count of deleted keys from node-cache
 */
const delByPrefix = (prefix) => {
    // Node-cache
    const keys = _fallback.keys();
    const toDelete = keys.filter(k => k.startsWith(prefix));
    if (toDelete.length > 0) {
        _fallback.del(toDelete);
    }

    // Redis — use SCAN to find matching keys (safe for production, no KEYS *)
    const redis = _getRedis();
    if (redis) {
        (async () => {
            try {
                let cursor = '0';
                do {
                    const [nextCursor, foundKeys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
                    cursor = nextCursor;
                    if (foundKeys.length > 0) {
                        await redis.del(...foundKeys);
                    }
                } while (cursor !== '0');
            } catch (err) {
                logger.warn('Redis delByPrefix failed', { prefix, error: err.message });
            }
        })();
    }

    return toDelete.length;
};

/**
 * Flush the entire cache (both layers).
 */
const flush = () => {
    _fallback.flushAll();
    const redis = _getRedis();
    if (redis) {
        redis.flushdb().catch(() => {});
    }
};

/**
 * Get cache statistics.
 */
const stats = () => {
    const ncStats = _fallback.getStats();
    return {
        keys: _fallback.keys().length,
        hits: ncStats.hits,
        misses: ncStats.misses,
        ksize: ncStats.ksize,
        vsize: ncStats.vsize,
        redisConnected: !!_getRedis(),
    };
};

// ─── New: Atomic Counter Operations (for quota service) ──────────────────────

/**
 * Atomic increment — uses Redis INCR if available, else node-cache.
 * Sets TTL on first increment (so the counter auto-expires at window end).
 * @param {string} key
 * @param {number} [ttlSeconds] — TTL to set if key is new
 * @returns {Promise<number>} — new value after increment
 */
const incr = async (key, ttlSeconds) => {
    const redis = _getRedis();
    if (redis) {
        try {
            const newVal = await redis.incr(key);
            // Set TTL only on first increment (when value becomes 1)
            if (newVal === 1 && ttlSeconds && ttlSeconds > 0) {
                await redis.expire(key, ttlSeconds);
            }
            // Sync to node-cache
            _fallback.set(key, newVal, ttlSeconds || 0);
            return newVal;
        } catch (err) {
            logger.warn('Redis INCR failed, using node-cache', { key, error: err.message });
        }
    }

    // Fallback: node-cache (not atomic across processes)
    const current = _fallback.get(key) || 0;
    const newVal = current + 1;
    _fallback.set(key, newVal, ttlSeconds || 0);
    return newVal;
};

/**
 * Atomic decrement.
 * @param {string} key
 * @returns {Promise<number>}
 */
const decr = async (key) => {
    const redis = _getRedis();
    if (redis) {
        try {
            const newVal = await redis.decr(key);
            _fallback.set(key, Math.max(0, newVal));
            return Math.max(0, newVal);
        } catch {
            // Fall through
        }
    }
    const current = _fallback.get(key) || 0;
    const newVal = Math.max(0, current - 1);
    _fallback.set(key, newVal);
    return newVal;
};

// ─── New: Cache-Aside Pattern ────────────────────────────────────────────────

/**
 * Get a value from cache, or compute it with fetchFn and cache the result.
 * Includes basic stampede protection (in-flight request dedup).
 * @param {string} key
 * @param {function} fetchFn — async function that returns the value to cache
 * @param {number} [ttlSeconds] — TTL for the cached value
 * @returns {Promise<any>}
 */
const _inFlight = new Map();

const getOrSet = async (key, fetchFn, ttlSeconds) => {
    // Check cache first
    const cached = await getAsync(key);
    if (cached !== undefined) return cached;

    // Stampede protection: if another request is already fetching this key, wait for it
    if (_inFlight.has(key)) {
        return _inFlight.get(key);
    }

    const promise = (async () => {
        try {
            const value = await fetchFn();
            set(key, value, ttlSeconds);
            return value;
        } finally {
            _inFlight.delete(key);
        }
    })();

    _inFlight.set(key, promise);
    return promise;
};

// ─── TTL Constants (seconds) ──────────────────────────────────────────────────
const TTL = {
    GITHUB_COMMITS: 600,
    GITHUB_INSIGHTS: 600,
    GITHUB_REPOS: 300,
    PROJECT_STATS: 300,
    AI_INSIGHTS: 900,
    AI_RESPONSE_CACHE: 1800,
    USER_PROFILE: 120,
    ACTIVITY_SUMMARY: 600,
    LANGUAGES: 3600,
    SIMILAR_PROJECTS: 1800,
    QUOTA_COUNTER: 86400,
    QUOTA_MONTHLY: 2678400,
    SUBSCRIPTION_STATUS: 300,
    RATE_LIMIT_WINDOW: 900,
};

module.exports = { get, getAsync, set, del, delByPrefix, flush, stats, incr, decr, getOrSet, TTL };
