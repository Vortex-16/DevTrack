const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const { requireAuth } = require('../middleware/auth');

// Protected Routes
router.use(requireAuth);

router.get('/', resumeController.getResume);
router.post('/', resumeController.saveResume);
router.post('/generate-summary', resumeController.generateSummary);

module.exports = router;
