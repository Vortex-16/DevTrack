const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');

router.get('/history', requireAuth, reportController.getUserReports);

module.exports = router;
