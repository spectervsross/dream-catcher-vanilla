const Backendless = require('backendless');

// Initialize Backendless
Backendless.initApp('4DD34E37-20BB-4318-8FDB-81318F096BAD', '8945F044-0E41-4CD1-94F3-2403FE5CC316');

async function cleanup() {
    try {
        console.log('Cleaning up sample entries...');
        
        // Find all sample entries
        const whereClause = "userId = 'SYSTEM'";
        const entries = await Backendless.Data.of('JournalEntries').find({
            where: whereClause
        });

        console.log(`Found ${entries.length} sample entries to clean up`);

        // Delete each entry
        for (const entry of entries) {
            await Backendless.Data.of('JournalEntries').remove(entry.objectId);
            console.log(`Deleted entry: ${entry.objectId}`);
        }

        console.log('Cleanup completed successfully!');
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

// Run cleanup
cleanup(); 