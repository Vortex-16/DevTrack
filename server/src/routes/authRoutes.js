/**
 * Auth Routes
 * Routes for user authentication and profile management
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const authController = require('../controllers/authController');

// Sync user from Clerk to Firestore
router.post('/sync', requireAuth, authController.syncUser);

// Explicitly renew GitHub private-repo access window
router.post('/renew-github-access', requireAuth, authController.renewGithubAccess);

// Get current user profile
router.get('/me', requireAuth, authController.getMe);

// Update activity times (for notification logic)
router.put('/activity', requireAuth, authController.updateActivityTime);

// Delete account
router.delete('/me', requireAuth, authController.deleteAccount);

module.exports = router;
