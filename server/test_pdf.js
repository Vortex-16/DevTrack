const { collections, initializeFirebase } = require('./src/config/firebase');
require('dotenv').config();
initializeFirebase();
const fs = require('fs');

const rs = require('./src/services/reportService');

async function test() {
    const users = await collections.users().limit(1).get();
    if (users.empty) {
        console.log('No users found');
        process.exit(1);
    }
    const userId = users.docs[0].id;
    console.log(`Generating report for ${userId}...`);
    
    try {
        const { pdfBuffer } = await rs.generatePDFReport(userId);
        fs.writeFileSync('test_report.pdf', pdfBuffer);
        console.log('PDF saved to test_report.pdf');
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

test();
