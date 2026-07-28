/**
 * DevTrack Server — Entry Point
 *
 * Startup sequence:
 *   1. Load env vars
 *   2. Initialize Firebase Admin SDK
 *   3. Initialize Redis (Upstash)
 *   4. Boot Express app + middleware stack
 *   5. Initialize cron scheduler
 *   6. Listen on PORT
 *
 * Shutdown sequence (SIGTERM / SIGINT):
 *   1. Stop accepting new connections
 *   2. Wait up to 30s for in-flight requests to complete
 *   3. Disconnect Redis
 *   4. Close Firebase/cache connections
 *   5. Exit with code 0
 */

const app = require('./src/app');
const { initializeFirebase } = require('./src/config/firebase');
const { initializeRedis, disconnectRedis } = require('./src/config/redis');
const { initializeScheduler } = require('./src/utils/scheduler');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 9000;
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 30_000; // 30 seconds

let server = null;

// ─── Startup ─────────────────────────────────────────────────────────────────

const startServer = async () => {
    try {
        // Initialize Firebase Admin SDK
        await initializeFirebase();
        logger.info('Firebase initialized');

        // Initialize Redis (Upstash — graceful degradation if unavailable)
        await initializeRedis();

        // Initialize Scheduler (cron jobs)
        initializeScheduler();

        // Start HTTP server
        server = app.listen(PORT, () => {
            logger.info(`DevTrack server started`, {
                port: PORT,
                env: process.env.NODE_ENV || 'development',
                healthCheck: `http://localhost:${PORT}/api/health`,
            });
        });

        // Set connection timeout (prevents hung connections)
        server.keepAliveTimeout = 65_000;  // > Render's 60s LB timeout
        server.headersTimeout = 66_000;

    } catch (error) {
        logger.error('Failed to start server', { error: error.message, stack: error.stack });
        process.exit(1);
    }
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

const shutdown = (signal) => {
    logger.info(`${signal} received — starting graceful shutdown`);

    if (!server) {
        logger.info('No active server, exiting');
        process.exit(0);
    }

    // Stop accepting new connections
    server.close(async (err) => {
        if (err) {
            logger.error('Error during server close', { error: err.message });
            process.exit(1);
        }

        logger.info('HTTP server closed — all connections drained');

        try {
            // Disconnect Redis gracefully
            await disconnectRedis();
            logger.info('Redis disconnected');
        } catch {
            // Non-critical
        }

        logger.info('Shutdown complete');
        process.exit(0);
    });

    // Force-kill if drain takes too long
    setTimeout(() => {
        logger.error(`Graceful shutdown timed out after ${GRACEFUL_SHUTDOWN_TIMEOUT_MS}ms — force exiting`);
        process.exit(1);
    }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);
};

// ─── Process Event Handlers ───────────────────────────────────────────────────

process.on('SIGTERM', () => shutdown('SIGTERM')); // Render sends SIGTERM on deploy/scale
process.on('SIGINT', () => shutdown('SIGINT'));    // Ctrl+C in development

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
    });
    // Don't exit on unhandled rejections — log and continue
    // (exiting on every unhandled rejection in production causes unnecessary restarts)
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception — process will exit', {
        error: err.message,
        stack: err.stack,
    });
    // Uncaught exceptions leave the process in an undefined state — must exit
    shutdown('uncaughtException');
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

startServer();
