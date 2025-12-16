/**
 * Task Controller
 * Handles task/deadline management for calendar feature
 */

const { collections } = require('../config/firebase');
const { APIError } = require('../middleware/errorHandler');
const { getNotificationService } = require('../services/notificationService');

/**
 * Get all tasks for user
 * GET /api/tasks
 */
const getTasks = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { completed, limit = 50 } = req.query;

        let query = collections.tasks().where('uid', '==', userId);

        if (completed !== undefined) {
            query = query.where('completed', '==', completed === 'true');
        }

        const snapshot = await query
            .orderBy('dueDate', 'asc')
            .limit(parseInt(limit))
            .get();

        const tasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.status(200).json({
            success: true,
            data: { tasks, total: tasks.length },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get tasks for a date range
 * GET /api/tasks/range?start=YYYY-MM-DD&end=YYYY-MM-DD
 */
const getTasksByRange = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { start, end } = req.query;

        if (!start || !end) {
            throw new APIError('Start and end dates are required', 400);
        }

        const snapshot = await collections.tasks()
            .where('uid', '==', userId)
            .where('dueDate', '>=', start)
            .where('dueDate', '<=', end)
            .orderBy('dueDate', 'asc')
            .get();

        const tasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.status(200).json({
            success: true,
            data: { tasks, total: tasks.length },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new task
 * POST /api/tasks
 */
const createTask = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { title, description, dueDate, priority, projectId } = req.body;

        if (!title) {
            throw new APIError('Title is required', 400);
        }

        if (!dueDate) {
            throw new APIError('Due date is required', 400);
        }

        const taskData = {
            uid: userId,
            title,
            description: description || '',
            dueDate, // YYYY-MM-DD format
            priority: priority || 'medium', // low, medium, high
            projectId: projectId || null,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await collections.tasks().add(taskData);

        // Send FCM notification for high priority tasks due today/tomorrow
        if (priority === 'high') {
            try {
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];

                if (dueDate === todayStr || dueDate === tomorrowStr) {
                    const notificationService = getNotificationService();
                    const notificationType = dueDate === todayStr ? 'due_today' : 'due_tomorrow';
                    await notificationService.sendTaskNotification(userId, {
                        id: docRef.id,
                        title,
                        dueDate,
                        priority,
                    }, 'created');
                    console.log(`📱 FCM notification sent for high priority task: ${title}`);
                }
            } catch (notifErr) {
                console.warn('⚠️ Failed to send FCM notification:', notifErr.message);
                // Don't fail the task creation if notification fails
            }
        }

        res.status(201).json({
            success: true,
            data: {
                id: docRef.id,
                ...taskData,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a task
 * PUT /api/tasks/:id
 */
const updateTask = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { id } = req.params;
        const { title, description, dueDate, priority, completed, projectId } = req.body;

        const taskRef = collections.tasks().doc(id);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
            throw new APIError('Task not found', 404);
        }

        if (taskDoc.data().uid !== userId) {
            throw new APIError('Unauthorized', 403);
        }

        const updateData = {
            updatedAt: new Date().toISOString(),
        };

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (dueDate !== undefined) updateData.dueDate = dueDate;
        if (priority !== undefined) updateData.priority = priority;
        if (completed !== undefined) updateData.completed = completed;
        if (projectId !== undefined) updateData.projectId = projectId;

        await taskRef.update(updateData);

        const updatedDoc = await taskRef.get();

        res.status(200).json({
            success: true,
            data: {
                id: updatedDoc.id,
                ...updatedDoc.data(),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a task
 * DELETE /api/tasks/:id
 */
const deleteTask = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { id } = req.params;

        const taskRef = collections.tasks().doc(id);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
            throw new APIError('Task not found', 404);
        }

        if (taskDoc.data().uid !== userId) {
            throw new APIError('Unauthorized', 403);
        }

        await taskRef.delete();

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle task completion
 * PATCH /api/tasks/:id/toggle
 */
const toggleTask = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { id } = req.params;

        const taskRef = collections.tasks().doc(id);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
            throw new APIError('Task not found', 404);
        }

        if (taskDoc.data().uid !== userId) {
            throw new APIError('Unauthorized', 403);
        }

        const currentCompleted = taskDoc.data().completed;
        await taskRef.update({
            completed: !currentCompleted,
            updatedAt: new Date().toISOString(),
        });

        const updatedDoc = await taskRef.get();

        res.status(200).json({
            success: true,
            data: {
                id: updatedDoc.id,
                ...updatedDoc.data(),
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTasks,
    getTasksByRange,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
};
