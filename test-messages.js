const DatabaseUtils = require('./database-utils');

async function testMessageHandling() {
    try {
        console.log('Starting message handling test...\n');

        // 1. Save initial user message (creates new chat session)
        console.log('1. Testing user message save...');
        const userMessageResult = await DatabaseUtils.saveMessage({
            content: 'What do recurring dreams mean?',
            sender: 'user',
            interpretation: ''
        });
        console.log('User message saved:', userMessageResult);

        // 2. Save AI response to the same session
        console.log('\n2. Testing AI response save...');
        const aiResponseResult = await DatabaseUtils.saveAIResponse({
            content: 'Recurring dreams often indicate unresolved issues. They can represent ongoing concerns or patterns in your life.',
            chatSessionId: userMessageResult.sessionId,
            interpretation: 'User is interested in dream patterns.'
        });
        console.log('AI response saved:', aiResponseResult);

        // 3. Get conversation history
        console.log('\n3. Testing conversation history retrieval...');
        const history = await DatabaseUtils.getConversationHistory(userMessageResult.sessionId);
        console.log('Conversation history:', JSON.stringify(history, null, 2));

        // 4. Search for conversations about recurring dreams
        console.log('\n4. Testing conversation search...');
        const searchResults = await DatabaseUtils.searchConversations('recurring dreams');
        console.log('Search results:', JSON.stringify(searchResults, null, 2));

        // 5. Clean up test data
        console.log('\n5. Cleaning up test data...');
        await DatabaseUtils.deleteChatSession(userMessageResult.sessionId);
        console.log('Test data cleaned up');

        console.log('\nAll message handling tests completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

// Run the tests
testMessageHandling(); 