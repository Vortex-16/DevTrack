require('dotenv').config();
const { collections, initializeFirebase } = require('./src/config/firebase');

async function debugReports() {
    await initializeFirebase();
    console.log('--- User Report Preferences Debug ---');
    const snapshot = await collections.users().get();
    
    const now = new Date();
    const currentDay = now.getUTCDay();
    const currentHour = now.getUTCHours();
    
    console.log(`Current UTC Time: ${now.toISOString()}`);
    console.log(`Current Day: ${currentDay}, Current Hour: ${currentHour}\n`);

    snapshot.forEach(doc => {
        const data = doc.data();
        const schedule = data.reportPreferences || {};
        
        console.log(`User: ${data.name || doc.id} (${data.githubUsername || 'no-gh'})`);
        console.log(`  - Email: ${data.email || 'MISSING'}`);
        console.log(`  - Schedule: Day ${schedule.dayOfWeek} (${typeof schedule.dayOfWeek}), Hour ${schedule.hour} (${typeof schedule.hour})`);
        console.log(`  - Local: Day ${schedule.localDay}, Hour ${schedule.localHour}`);
        console.log(`  - Enabled: ${schedule.enabled}`);
        console.log(`  - Last Sent: ${data.lastReportSentAt || 'Never'}`);
        
        const targetDay = Number(schedule.dayOfWeek ?? 1);
        const targetHour = Number(schedule.hour ?? 15);
        
        const dayMatch = currentDay === targetDay;
        const hourMatch = currentHour === targetHour;
        
        console.log(`  - Match: Day=${dayMatch}, Hour=${hourMatch}`);
        console.log('-----------------------------------');
    });
    
    process.exit(0);
}

debugReports();
