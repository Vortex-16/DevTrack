/**
 * Logs Routes
 * Routes for learning log CRUD operations
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { quotaGuard } = require('../middleware/quotaGuard');
const logsController = require('../controllers/logsController');

// Get logs statistics (must be before /:id to avoid conflict)
router.get('/stats', requireAuth, logsController.getStats);

// Get all logs for user (with pagination)
router.get('/', requireAuth, validate('pagination', 'query'), logsController.getLogs);

// Get single log by ID
router.get('/:id', requireAuth, logsController.getLog);

// Create new log (quota protected)
router.post('/', requireAuth, quotaGuard('learning_log'), validate('createLog'), logsController.createLog);

// Update log
router.put('/:id', requireAuth, validate('updateLog'), logsController.updateLog);

// Delete log
router.delete('/:id', requireAuth, logsController.deleteLog);

module.exports = router;
