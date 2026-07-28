/**
 * Redis Client Configuration (Upstash)
 * ═══════════════════════════════════════════════════════════════════════════
 * Serverless Redis via Upstash (free tier: 10K commands/day, 256MB).
 * Used for: quota counters, rate limiting, API response cache.
 *
 * Connection:
 *   - Uses REDIS_URL env var (rediss://...@upstash.io:6379)
 *   - TLS enabled by default (Upstash requires it)
 *   - Auto-reconnect with exponential backoff
 *   - Graceful degradation: exports a null client if REDIS_URL is not set
 *
 * Usage:
 *   const redis = require('./redis');
 *   if (redis) { await redis.set('key', 'value', 'EX', 300); }
 * ═══════════════════════════════════════════════════════════════════════════
 */

const logger = require('../utils/logger');

let client = null;
let isConnected = false;

/**
 * Initialize the Redis client.
 * Safe to call multiple times — returns existing client if already connected.
 * @returns {object|null} Redis client or null if unavailable
 */
async function initializeRedis() {
    if (client) return client;

    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        logger.warn('REDIS_URL not set — running without Redis (in-memory cache only)');
        return null;
    }

    try {
        // Lazy-load ioredis to avoid crashes if the package isn't installed
        const Redis = require('ioredis');

        client = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                if (times > 5) {
                    logger.error('Redis: max reconnection attempts reached');
                    return null;   // Stop retrying
                }
                const delay = Math.min(times * 200, 5000);
                return delay;
            },
            lazyConnect: true,
            enableOfflineQueue: false,
            // TLS is auto-detected from rediss:// protocol
        });

        client.on('connect', () => {
            isConnected = true;
            logger.info('Redis connected');
        });

        client.on('error', (err) => {
            isConnected = false;
            logger.error('Redis connection error', { error: err.message });
        });

        client.on('close', () => {
            isConnected = false;
            logger.warn('Redis connection closed');
        });

        client.on('reconnecting', (delay) => {
            logger.info('Redis reconnecting', { delayMs: delay });
        });

        await client.connect();
        return client;

    } catch (error) {
        logger.error('Failed to initialize Redis — falling back to in-memory cache', {
            error: error.message,
        });
        client = null;
        return null;
    }
}

/**
 * Get the Redis client instance.
 * @returns {object|null}
 */
function getRedis() {
    return client;
}

/**
 * Check if Redis is currently connected.
 * @returns {boolean}
 */
function isRedisConnected() {
    return isConnected && client !== null;
}

/**
 * Gracefully disconnect Redis.
 */
async function disconnectRedis() {
    if (client) {
        try {
            await client.quit();
            logger.info('Redis disconnected gracefully');
        } catch (error) {
            logger.error('Redis disconnect error', { error: error.message });
            try { client.disconnect(); } catch { /* force close */ }
        }
        client = null;
        isConnected = false;
    }
}

/**
 * Redis health check for /api/health endpoint.
 * @returns {Promise<{ connected: boolean, latencyMs: number }>}
 */
async function redisHealthCheck() {
    if (!client || !isConnected) {
        return { connected: false, latencyMs: -1 };
    }

    try {
        const start = Date.now();
        await client.ping();
        return { connected: true, latencyMs: Date.now() - start };
    } catch {
        return { connected: false, latencyMs: -1 };
    }
}

module.exports = {
    initializeRedis,
    getRedis,
    isRedisConnected,
    disconnectRedis,
    redisHealthCheck,
};
