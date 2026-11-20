const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Public Profile Route
router.get('/profile/:username', publicController.getProfileByUsername);

// Public Platform Live Statistics
router.get('/stats', publicController.getPlatformStats);

module.exports = router;
