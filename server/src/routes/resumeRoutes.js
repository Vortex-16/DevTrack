const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const { requireAuth } = require('../middleware/auth');
const { quotaGuard } = require('../middleware/quotaGuard');

// Protected Routes
router.use(requireAuth);

router.get('/', resumeController.getResume);
router.post('/', resumeController.saveResume);
router.post('/generate-summary', quotaGuard('resume_ai_summary'), resumeController.generateSummary);

module.exports = router;
