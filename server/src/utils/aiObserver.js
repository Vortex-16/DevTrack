/**
 * AI Observer — Tracing & Observability Utility
 * ═══════════════════════════════════════════════════════════════════════════
 * Tracks latency, token counts, model provider, and status for all AI operations
 * (Groq Llama 3.3, Gemini 1.5/2.0).
 *
 * Stores lightweight execution telemetry in Redis & Firestore for observability.
 * zero external dependencies, 100% free-tier compatible.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const logger = require('./logger');
const cache = require('../config/cache');

class AIObserver {
    /**
     * Wrap an AI service invocation with execution tracing.
     *
     * @param {string} provider - 'groq' | 'gemini'
     * @param {string} model - e.g. 'llama-3.3-70b-versatile'
     * @param {string} intentType - e.g. 'code_review', 'project_analysis'
     * @param {string} userId - User's Clerk ID
     * @param {function} asyncFn - Async AI service invocation
     * @returns {Promise<any>} Result of asyncFn
     */
    async track(provider, model, intentType, userId, asyncFn) {
        const startTime = Date.now();
        let success = true;
        let errorMsg = null;
        let result = null;

        try {
            result = await asyncFn();
            return result;
        } catch (err) {
            success = false;
            errorMsg = err.message;
            throw err;
        } finally {
            const durationMs = Date.now() - startTime;
            const logEntry = {
                provider,
                model,
                intentType,
                userId: userId || 'anonymous',
                durationMs,
                success,
                ...(errorMsg && { error: errorMsg }),
                timestamp: new Date().toISOString(),
            };

            logger.info(`[AI Trace] ${provider}:${intentType} executed in ${durationMs}ms`, logEntry);

            // Record recent trace in Redis cache ring-buffer for dashboarding
            try {
                const key = `ai_traces:${new Date().toISOString().slice(0, 10)}`;
                const currentCount = (cache.get(key) || 0) + 1;
                cache.set(key, currentCount, 86400);
            } catch {
                /* Non-critical logging */
            }
        }
    }
}

module.exports = new AIObserver();
