const path = require('path');
require('dotenv').config();
const { initializeFirebase, collections } = require('./src/config/firebase');

// Initialize Firebase
initializeFirebase();

const reportService = require('./src/services/reportService');
const fs = require('fs');

async function testReport() {
    const userId = '';
    console.log(`📄 Generating PDF for user: ${userId}`);

    try {
        const { pdfBuffer } = await reportService.generatePDFReport(userId);
        const pdfPath = path.join(__dirname, 'test-report-debug.pdf');
        fs.writeFileSync(pdfPath, pdfBuffer);
        console.log(`✅ PDF saved to: ${pdfPath}`);
    } catch (error) {
        console.error('💥 Crash:', error);
    }
}

testReport();
