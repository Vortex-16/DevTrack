/**
 * Task Routes
 * Routes for task/deadline management (calendar feature)
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const taskController = require('../controllers/taskController');

// Get all tasks for user
router.get('/', requireAuth, taskController.getTasks);

// Get tasks for a specific date range
router.get('/range', requireAuth, taskController.getTasksByRange);

// Create a new task
router.post('/', requireAuth, taskController.createTask);

// Update a task
router.put('/:id', requireAuth, taskController.updateTask);

// Delete a task
router.delete('/:id', requireAuth, taskController.deleteTask);

// Toggle task completion
router.patch('/:id/toggle', requireAuth, taskController.toggleTask);

module.exports = router;
