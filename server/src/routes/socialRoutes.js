const express = require('express');
const router = express.Router();
const socialController = require('../controllers/socialController');
const { requireAuth } = require('../middleware/auth');

// Vouching
router.post('/vouch', requireAuth, socialController.vouchProject);
router.get('/endorsements/:userId', socialController.getEndorsements); // Publicly accessible

// Collaboration
router.post('/collaboration', requireAuth, socialController.updateCollaborationStatus);

module.exports = router;
