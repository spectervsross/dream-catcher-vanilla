const Backendless = require('backendless');

// Initialize Backendless
Backendless.initApp('4DD34E37-20BB-4318-8FDB-81318F096BAD', '8945F044-0E41-4CD1-94F3-2403FE5CC316');

class DatabaseUtils {
    // ChatSession operations
    static async createChatSession({ title, symbol, mood, note }) {
        try {
            // Validate required fields
            if (!title) throw new Error('Title is required for ChatSession');

            // Map and sanitize data
            const chatSessionData = {
                ___class: 'ChatSession',
                title: title.trim(),
                symbol: symbol?.trim() || '',
                mood: mood?.trim() || '',
                note: note?.trim() || '',
                created: new Date(),
                updated: new Date()
            };

            // Save to database
            const savedSession = await Backendless.Data.of("ChatSession").save(chatSessionData);
            console.log(`Created ChatSession: ${savedSession.title} (${savedSession.objectId})`);
            return savedSession;
        } catch (error) {
            console.error('Error creating ChatSession:', error);
            throw error;
        }
    }

    // Journal operations
    static async createJournalEntry({ role, message, chatSessionId }) {
        try {
            // Validate required fields
            if (!role) throw new Error('Role is required for Journal entry');
            if (!message) throw new Error('Message is required for Journal entry');
            if (!chatSessionId) throw new Error('ChatSession ID is required for Journal entry');

            // Validate role type
            const validRoles = ['user', 'assistant'];
            if (!validRoles.includes(role.toLowerCase())) {
                throw new Error('Invalid role. Must be either "user" or "assistant"');
            }

            // Map and sanitize data
            const journalData = {
                ___class: 'Journal',
                role: role.toLowerCase(),
                message: message.trim(),
                chatSessionId,
                created: new Date(),
                updated: new Date()
            };

            // Save to database
            const savedEntry = await Backendless.Data.of("Journal").save(journalData);
            console.log(`Created Journal entry for session: ${chatSessionId}`);
            return savedEntry;
        } catch (error) {
            console.error('Error creating Journal entry:', error);
            throw error;
        }
    }

    // Update chat session
    static async updateChatSession(sessionId, updates) {
        try {
            // Validate session existence
            const existingSession = await Backendless.Data.of("ChatSession").findById(sessionId);
            if (!existingSession) {
                throw new Error('ChatSession not found');
            }

            // Map and sanitize updates
            const updateData = {
                objectId: sessionId,
                ...updates,
                updated: new Date()
            };

            // Save updates
            const updatedSession = await Backendless.Data.of("ChatSession").save(updateData);
            console.log(`Updated ChatSession: ${updatedSession.title} (${updatedSession.objectId})`);
            return updatedSession;
        } catch (error) {
            console.error('Error updating ChatSession:', error);
            throw error;
        }
    }

    // Delete chat session and its entries
    static async deleteChatSession(sessionId) {
        try {
            // First delete all related journal entries
            const journalQuery = Backendless.DataQueryBuilder.create();
            journalQuery.setWhereClause(`chatSessionId = '${sessionId}'`);
            const entries = await Backendless.Data.of("Journal").find(journalQuery);
            
            for (const entry of entries) {
                await Backendless.Data.of("Journal").remove(entry.objectId);
            }

            // Then delete the chat session
            await Backendless.Data.of("ChatSession").remove(sessionId);
            console.log(`Deleted ChatSession and ${entries.length} entries: ${sessionId}`);
        } catch (error) {
            console.error('Error deleting ChatSession:', error);
            throw error;
        }
    }

    // Save message and create chat session if needed
    static async saveMessage({ content, sender, interpretation = '', chatSessionId = null, timestamp = new Date() }) {
        try {
            // If no chatSessionId, create a new chat session
            let sessionId = chatSessionId;
            if (!sessionId) {
                const newSession = await this.createChatSession({
                    title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                    symbol: '💭',
                    mood: '',
                    note: ''
                });
                sessionId = newSession.objectId;
            }

            // Create journal entry for the message
            const journalEntry = await this.createJournalEntry({
                role: sender,
                message: content,
                chatSessionId: sessionId,
                interpretation
            });

            return {
                messageId: journalEntry.objectId,
                sessionId,
                timestamp: journalEntry.created
            };
        } catch (error) {
            console.error('Error saving message:', error);
            throw error;
        }
    }

    // Save AI response
    static async saveAIResponse({ content, chatSessionId, interpretation = '', timestamp = new Date() }) {
        try {
            if (!chatSessionId) {
                throw new Error('ChatSession ID is required for AI response');
            }

            // Create journal entry for AI response
            const journalEntry = await this.createJournalEntry({
                role: 'assistant',
                message: content,
                chatSessionId,
                interpretation
            });

            // Update chat session with any interpretation if provided
            if (interpretation) {
                await this.updateChatSession(chatSessionId, {
                    note: interpretation
                });
            }

            return {
                messageId: journalEntry.objectId,
                timestamp: journalEntry.created
            };
        } catch (error) {
            console.error('Error saving AI response:', error);
            throw error;
        }
    }

    // Get conversation history
    static async getConversationHistory(sessionId) {
        try {
            const session = await Backendless.Data.of("ChatSession").findById(sessionId);
            if (!session) {
                throw new Error('ChatSession not found');
            }

            const journalQuery = Backendless.DataQueryBuilder.create();
            journalQuery.setWhereClause(`chatSessionId = '${sessionId}'`);
            journalQuery.setSortBy(['created ASC']);

            const entries = await Backendless.Data.of("Journal").find(journalQuery);

            // Format messages for conversation
            const messages = entries.map(entry => ({
                id: entry.objectId,
                content: entry.message,
                timestamp: entry.created,
                sender: entry.role,
                interpretation: entry.interpretation || '',
                sessionId: entry.chatSessionId
            }));

            return {
                sessionInfo: {
                    id: session.objectId,
                    title: session.title,
                    symbol: session.symbol,
                    mood: session.mood,
                    note: session.note,
                    created: session.created
                },
                messages
            };
        } catch (error) {
            console.error('Error getting conversation history:', error);
            throw error;
        }
    }

    // Add other necessary methods as needed...
}

module.exports = DatabaseUtils; 