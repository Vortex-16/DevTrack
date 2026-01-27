const socketIo = require('socket.io');

let io;
const participants = new Map(); // Map<socketId, { userId, challengeId, ... }>

const initializeSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*", // Allow all connections for now, refine for production
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 New client connected: ${socket.id}`);

        // Join a challenge room
        socket.on('join_challenge', ({ challengeId, userId, username }) => {
            socket.join(`challenge_${challengeId}`);
            participants.set(socket.id, { userId, username, challengeId, status: 'ONLINE', socketId: socket.id });

            // Notify admin/others in the room
            io.to(`challenge_${challengeId}`).emit('participant_update', {
                type: 'JOIN',
                participant: { userId, username, status: 'ONLINE' }
            });

            console.log(`👤 User ${username} joined challenge ${challengeId}`);
        });

        // Admin joins to monitor
        socket.on('admin_join', ({ challengeId }) => {
            socket.join(`challenge_${challengeId}_admin`);
            console.log(`👮 Admin monitoring challenge ${challengeId}`);

            // Send existing participants to the admin
            const challengeParticipants = Array.from(participants.values())
                .filter(p => p.challengeId === challengeId);

            socket.emit('init_participants', challengeParticipants);
        });

        // Sync Code (Throttled by client, but good to have server checks)
        socket.on('sync_code', ({ challengeId, userId, code }) => {
            // Broadcast to admin room only to save bandwidth, or to specific spectators
            io.to(`challenge_${challengeId}_admin`).emit('code_update', { userId, code });
        });

        // Violation Detected (Tab Switch, Fullscreen exit)
        socket.on('violation', ({ challengeId, userId, type, count }) => {
            console.warn(`⚠️ Violation by ${userId} in ${challengeId}: ${type} (${count})`);
            io.to(`challenge_${challengeId}_admin`).emit('violation_alert', { userId, type, count });

            // Optionally update participant status
            const p = participants.get(socket.id);
            if (p) {
                p.violations = (p.violations || 0) + 1;
                participants.set(socket.id, p);
            }
        });

        // Handle Disconnect
        socket.on('disconnect', () => {
            const p = participants.get(socket.id);
            if (p) {
                io.to(`challenge_${p.challengeId}`).emit('participant_update', {
                    type: 'LEAVE',
                    participant: { userId: p.userId, status: 'OFFLINE' }
                });
                participants.delete(socket.id);
                console.log(`🔌 Client disconnected: ${socket.id} (${p.username})`);
            }
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initializeSocket, getIO };
