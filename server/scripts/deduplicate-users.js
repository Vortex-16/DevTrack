require('dotenv').config();
const { initializeFirebase } = require('../src/config/firebase');
const { userManager } = require('../src/services/userService');

async function main() {
    const isDryRun = !process.argv.includes('--execute');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 DevTrack User Deduplication Engine (OOP Architecture)');
    console.log(`   Mode: ${isDryRun ? 'DRY RUN (Analysis only, no changes)' : '🚀 LIVE EXECUTION (Merging duplicates)'}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    try {
        await initializeFirebase();
        console.log('✅ Firebase initialized.\n');

        console.log('⏳ Scanning Firestore users collection for duplicates...');
        const result = await userManager.deduplicateAll({ dryRun: isDryRun });

        console.log(`\n📊 Scan Summary:`);
        console.log(`   Duplicate Clusters Found : ${result.totalClusters}`);
        console.log(`   Records Merged          : ${result.mergedCount}`);

        if (result.audit.length === 0) {
            console.log('\n✨ Excellent! Zero duplicate user records detected in Firestore.');
        } else {
            console.log('\n📋 Audit Report:');
            result.audit.forEach((cluster, idx) => {
                console.log(`\n  [Cluster ${idx + 1}] ${cluster.reason}`);
                console.log(`   • Canonical Record ID : ${cluster.canonicalId}`);
                console.log(`   • Duplicate IDs       : ${cluster.duplicateIds.join(', ')}`);
                console.log(`   • Status              : ${cluster.action}`);
                if (cluster.migrated) {
                    console.log(`   • Migrated Resources  :`, cluster.migrated);
                }
            });

            if (isDryRun) {
                console.log('\n💡 To perform the actual merge and clean up duplicates, run:');
                console.log('   node scripts/deduplicate-users.js --execute\n');
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('\n❌ Deduplication failed with error:', err.message);
        if (err.stack) console.error(err.stack);
        process.exit(1);
    }
}

main();
