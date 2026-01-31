const { admin, getFirestore } = require('../config/firebase');

// Get all goals for a user
exports.getAll = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const snapshot = await getFirestore().collection('goals')
            .where('userId', '==', userId)
            // .orderBy('createdAt', 'desc') // Removed to avoid index requirement
            .get();

        const goals = [];
        snapshot.forEach(doc => {
            goals.push({ id: doc.id, ...doc.data() });
        });

        // Sort in memory
        goals.sort((a, b) => {
            const dateA = a.createdAt?._seconds || 0;
            const dateB = b.createdAt?._seconds || 0;
            return dateB - dateA;
        });

        res.json({
            success: true,
            data: { goals }
        });
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch goals'
        });
    }
};

// Create a new goal
exports.create = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { title, description, category, startDate, targetDate, milestones } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            });
        }

        const newGoal = {
            userId,
            title,
            description: description || '',
            category: category || 'Personal',
            status: 'Not Started',
            progress: 0,
            startDate: startDate ? admin.firestore.Timestamp.fromDate(new Date(startDate)) : admin.firestore.Timestamp.now(),
            targetDate: targetDate ? admin.firestore.Timestamp.fromDate(new Date(targetDate)) : null,
            milestones: milestones || [], // Array of { id, title, isCompleted }
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await getFirestore().collection('goals').add(newGoal);
        const savedGoal = await docRef.get();

        res.status(201).json({
            success: true,
            data: { id: docRef.id, ...savedGoal.data() }
        });
    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create goal'
        });
    }
};

// Update a goal
exports.update = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const goalId = req.params.id;
        const updates = req.body;

        const goalRef = getFirestore().collection('goals').doc(goalId);
        const doc = await goalRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        if (doc.data().userId !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Handle timestamps if present
        if (updates.startDate) updates.startDate = admin.firestore.Timestamp.fromDate(new Date(updates.startDate));
        if (updates.targetDate) updates.targetDate = admin.firestore.Timestamp.fromDate(new Date(updates.targetDate));

        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        // Auto-calculate progress if milestones are updated
        if (updates.milestones) {
            const total = updates.milestones.length;
            if (total > 0) {
                const completed = updates.milestones.filter(m => m.isCompleted).length;
                updates.progress = Math.round((completed / total) * 100);
            } else {
                updates.progress = updates.progress || 0;
            }

            // Auto-update status based on progress
            if (updates.progress === 100) updates.status = 'Completed';
            else if (updates.progress > 0) updates.status = 'In Progress';
        }

        await goalRef.update(updates);
        const updatedDoc = await goalRef.get();

        res.json({
            success: true,
            data: { id: goalId, ...updatedDoc.data() }
        });

    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update goal'
        });
    }
};

// Delete a goal
exports.delete = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const goalId = req.params.id;

        const goalRef = getFirestore().collection('goals').doc(goalId);
        const doc = await goalRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        if (doc.data().userId !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await goalRef.delete();

        res.json({
            success: true,
            message: 'Goal deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete goal'
        });
    }
};
