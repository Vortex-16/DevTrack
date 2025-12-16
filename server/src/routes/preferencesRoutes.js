/**
 * Preferences Routes
 * Routes for user preferences and onboarding management
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const preferencesController = require('../controllers/preferencesController');

// Get user preferences
router.get('/', requireAuth, preferencesController.getPreferences);

// Save preferences after onboarding
router.post('/', requireAuth, preferencesController.savePreferences);

// Update preferences (partial update)
router.put('/', requireAuth, preferencesController.updatePreferences);

// Skip onboarding with defaults
router.post('/skip', requireAuth, preferencesController.skipOnboarding);

module.exports = router;
