/**
 * Clerk Authentication Middleware
 * Verifies JWT tokens from Clerk
 */

const { clerkClient } = require('@clerk/clerk-sdk-node');
const { APIError } = require('./errorHandler');

/**
 * Middleware to verify Clerk authentication
 * Extracts user from Bearer token
 */
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new APIError('No authorization token provided', 401);
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw new APIError('Invalid authorization header format', 401);
        }

        // Verify the session token with Clerk
        try {
            const sessionClaims = await clerkClient.verifyToken(token, { clockSkewInMs: 60000 });

            // Attach user info to request
            req.auth = {
                userId: sessionClaims.sub,
                sessionId: sessionClaims.sid,
                claims: sessionClaims,
            };

            next();
        } catch (clerkError) {
            console.error('Clerk verification error:', clerkError.message);
            throw new APIError('Invalid or expired token', 401);
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Optional auth middleware - doesn't fail if no token
 * Useful for routes that work with or without auth
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.auth = null;
            return next();
        }

        const token = authHeader.split(' ')[1];

        try {
            const sessionClaims = await clerkClient.verifyToken(token, { clockSkewInMs: 60000 });
            req.auth = {
                userId: sessionClaims.sub,
                sessionId: sessionClaims.sid,
                claims: sessionClaims,
            };
        } catch {
            req.auth = null;
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    requireAuth,
    optionalAuth,
};
