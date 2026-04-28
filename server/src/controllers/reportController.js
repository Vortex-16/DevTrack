const { collections } = require('../config/firebase');
const reportService = require('../services/reportService');

exports.getUserReports = async (req, res) => {
    try {
        const userId = req.auth.userId;

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

exports.downloadReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const userId = req.auth.userId;

        const reportDoc = await collections.reports().doc(reportId).get();

        if (!reportDoc.exists) {
            return res.status(404).json({ success: false, error: 'Report not found' });
        }

        const reportData = reportDoc.data();

        // Security check: Ensure the report belongs to the authenticated user
        if (reportData.userId !== userId) {
            return res.status(403).json({ success: false, error: 'Unauthorized access to this report' });
        }

        console.log(`Generating PDF download for report ${reportId}...`);
        
        // Use the existing service to generate the PDF
        // We can pass the stored insights to avoid re-generating them if we refactor reportService
        // For now, let's just use the main generator or a slightly modified one
        const { pdfBuffer } = await reportService.generatePDFReport(userId, reportData);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=DevTrack-Report-${reportData.createdAt.split('T')[0]}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error downloading report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate report PDF'
        });
    }
};
