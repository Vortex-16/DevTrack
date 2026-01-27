/**
 * DevTrack Server - Entry Point
 */

const app = require('./src/app');
const { initializeFirebase } = require('./src/config/firebase');
const { initializeScheduler } = require('./src/utils/scheduler');

const PORT = process.env.PORT || 9000;

const http = require('http');
const { initializeSocket } = require('./src/socket/socketManager');

// Initialize Firebase before starting server
const startServer = async () => {
    try {
        // Initialize Firebase Admin SDK
        await initializeFirebase();
        console.log('✅ Firebase initialized successfully');

        // Initialize Scheduler
        initializeScheduler();

        // Create HTTP server for Socket.io
        const server = http.createServer(app);

        // Initialize Socket.io
        initializeSocket(server);
        console.log('✅ Socket.io initialized');

        // Start Server
        server.listen(PORT, () => {
            console.log(`🚀 DevTrack server running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📴 SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📴 SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err.message);
    process.exit(1);
});

startServer();
