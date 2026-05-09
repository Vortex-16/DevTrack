const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');

// Report history (paginated)
router.get('/history', requireAuth, reportController.getUserReports);

// Download a specific past report PDF
router.get('/download/:reportId', requireAuth, reportController.downloadReport);

// Get user's current report schedule preference
router.get('/schedule', requireAuth, reportController.getSchedule);

// Save/update report schedule (dayOfWeek + hour + frequency)
router.post('/schedule', requireAuth, reportController.saveSchedule);

// Queue status — returns next scheduled report time and last sent time
router.get('/status', requireAuth, reportController.getQueueStatus);

// Manually trigger a report generation (on-demand)
router.post('/trigger', requireAuth, reportController.triggerReport);

module.exports = router;
