const Backendless = require('backendless');

// Initialize Backendless
Backendless.initApp('4DD34E37-20BB-4318-8FDB-81318F096BAD', '8945F044-0E41-4CD1-94F3-2403FE5CC316');

async function dropTable(tableName) {
    try {
        const query = Backendless.DataQueryBuilder.create();
        query.setPageSize(100);
        let hasMore = true;
        
        while (hasMore) {
            const records = await Backendless.Data.of(tableName).find(query);
            if (records.length > 0) {
                for (const record of records) {
                    await Backendless.Data.of(tableName).remove(record.objectId);
                }
                hasMore = records.length === 100;
            } else {
                hasMore = false;
            }
        }
        console.log(`Dropped table: ${tableName}`);
    } catch (error) {
        if (!error.message.includes('Table not found')) {
            throw error;
        }
    }
}

async function setupTables() {
    try {
        console.log('Starting table setup...');

        // Drop existing tables
        console.log('\nDropping existing tables...');
        await dropTable("Journal");
        await dropTable("ChatSession");

        // Create ChatSession table
        console.log('\nCreating ChatSession table...');
        const chatSession = {
            ___class: 'ChatSession',
            title: '',
            symbol: '',
            mood: '',
            note: '',
            properties: {
                title: { type: 'STRING', required: true },
                symbol: { type: 'STRING', required: false },
                mood: { type: 'STRING', required: false },
                note: { type: 'TEXT', required: false }
            }
        };
        await Backendless.Data.of("ChatSession").save(chatSession);
        console.log("ChatSession table created successfully!");

        // Create Journal table
        console.log('\nCreating Journal table...');
        const journal = {
            ___class: 'Journal',
            role: '',
            message: '',
            chatSessionId: null,
            properties: {
                role: { type: 'STRING', required: true },
                message: { type: 'TEXT', required: true },
                chatSessionId: { type: 'STRING', required: true }
            }
        };
        await Backendless.Data.of("Journal").save(journal);
        console.log("Journal table created successfully!");

        // Verify table creation
        console.log('\nVerifying table creation...');
        const chatSessionSchema = await Backendless.Data.describe("ChatSession");
        const journalSchema = await Backendless.Data.describe("Journal");
        
        console.log('\nChatSession Schema:', JSON.stringify(chatSessionSchema, null, 2));
        console.log('\nJournal Schema:', JSON.stringify(journalSchema, null, 2));

        console.log('\nTable setup completed successfully!');
    } catch (error) {
        console.error('Error during table setup:', error);
        process.exit(1);
    }
}

// Run the setup
setupTables(); 