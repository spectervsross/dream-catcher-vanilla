const DatabaseUtils = require('./database-utils');

async function testDatabaseUtils() {
    try {
        console.log('Starting database utilities test...\n');

        // 1. Create a new chat session
        console.log('1. Testing createChatSession...');
        const newSession = await DatabaseUtils.createChatSession({
            title: "Test Dream",
            symbol: "🌟",
            mood: "Curious",
            note: "A test dream for database operations"
        });
        console.log('Created session:', newSession);

        // 2. Create journal entries for the session
        console.log('\n2. Testing createJournalEntry...');
        const userEntry = await DatabaseUtils.createJournalEntry({
            role: "user",
            message: "I had a strange dream about testing database operations.",
            chatSessionId: newSession.objectId
        });
        console.log('Created user entry:', userEntry);

        const assistantEntry = await DatabaseUtils.createJournalEntry({
            role: "assistant",
            message: "That's interesting! Testing dreams often represent a desire for validation and success. How did you feel during the test?",
            chatSessionId: newSession.objectId
        });
        console.log('Created assistant entry:', assistantEntry);

        // 3. Get session with its entries
        console.log('\n3. Testing getChatSessionWithEntries...');
        const sessionWithEntries = await DatabaseUtils.getChatSessionWithEntries(newSession.objectId);
        console.log('Session with entries:', JSON.stringify(sessionWithEntries, null, 2));

        // 4. Update the session
        console.log('\n4. Testing updateChatSession...');
        const updatedSession = await DatabaseUtils.updateChatSession(newSession.objectId, {
            mood: "Confident",
            note: "Updated test dream note"
        });
        console.log('Updated session:', updatedSession);

        // 5. Get all sessions (should include our test session)
        console.log('\n5. Testing getAllChatSessions...');
        const allSessions = await DatabaseUtils.getAllChatSessions({ pageSize: 5 });
        console.log(`Found ${allSessions.length} sessions`);
        allSessions.forEach((item, index) => {
            console.log(`\nSession ${index + 1}:`);
            console.log('Title:', item.session.title);
            console.log('Entries:', item.entries.length);
        });

        // 6. Clean up by deleting the test session
        console.log('\n6. Testing deleteChatSession...');
        await DatabaseUtils.deleteChatSession(newSession.objectId);
        console.log('Test session and its entries deleted');

        console.log('\nAll tests completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

// Run the tests
testDatabaseUtils(); 