const Backendless = require('backendless');

// Initialize Backendless
Backendless.initApp('4DD34E37-20BB-4318-8FDB-81318F096BAD', '8945F044-0E41-4CD1-94F3-2403FE5CC316');

async function verifyData() {
    try {
        console.log('Starting data verification...\n');

        // 1. Get all ChatSessions
        console.log('Fetching ChatSessions...');
        const queryBuilder = Backendless.DataQueryBuilder.create();
        queryBuilder.setSortBy(['created DESC']);
        
        const chatSessions = await Backendless.Data.of("ChatSession").find(queryBuilder);
        console.log(`Found ${chatSessions.length} ChatSessions:\n`);
        
        // 2. For each ChatSession, get its Journal entries
        for (const session of chatSessions) {
            console.log(`=== ChatSession: ${session.title} ===`);
            console.log(`Symbol: ${session.symbol}`);
            console.log(`Mood: ${session.mood}`);
            console.log(`Note: ${session.note}`);
            console.log(`Created: ${new Date(session.created).toLocaleString()}`);
            console.log(`ObjectId: ${session.objectId}\n`);

            // Get related Journal entries
            const journalQuery = Backendless.DataQueryBuilder.create();
            journalQuery.setWhereClause(`chatSessionId = '${session.objectId}'`);
            journalQuery.setSortBy(['created ASC']);
            
            const journalEntries = await Backendless.Data.of("Journal").find(journalQuery);
            console.log(`Found ${journalEntries.length} Journal entries for this session:`);
            
            journalEntries.forEach((entry, index) => {
                console.log(`\n  ${index + 1}. ${entry.role.toUpperCase()}:`);
                console.log(`     Message: ${entry.message}`);
                console.log(`     Created: ${new Date(entry.created).toLocaleString()}`);
            });
            
            console.log('\n' + '='.repeat(50) + '\n');
        }

        // 3. Show total counts
        const totalJournalEntries = await Backendless.Data.of("Journal").getObjectCount();
        
        console.log('Summary:');
        console.log(`Total ChatSessions: ${chatSessions.length}`);
        console.log(`Total Journal Entries: ${totalJournalEntries}`);
        
    } catch (error) {
        console.error('Error verifying data:', error);
        process.exit(1);
    }
}

// Run the verification
verifyData(); 