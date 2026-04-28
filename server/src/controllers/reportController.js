const { collections } = require('../config/firebase');

exports.getUserReports = async (req, res) => {
    try {
        const userId = req.user.uid;

        const reportsSnapshot = await collections.reports()
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const reports = [];
        reportsSnapshot.forEach(doc => {
            reports.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.status(200).json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error('Error fetching user reports:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch report history'
        });
    }
};
