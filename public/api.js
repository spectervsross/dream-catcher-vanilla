/**
 * @fileoverview API functions for database interactions
 * This module handles all interactions with the Backendless database.
 * @module api
 */

import { state } from './state.js';
import { addDebugLog } from './utils.js';

// Ensure Backendless is available
if (typeof Backendless === 'undefined') {
    throw new Error('Backendless SDK is not loaded');
}

/**
 * Creates a new chat session
 * @param {string} message - Initial message to create session title from
 * @returns {Promise<Object>} Created chat session object
 */
export async function createChatSession(message) {
    const requestId = Math.random().toString(36).substring(7);
    addDebugLog('info', `[${requestId}] Creating chat session...`);

    try {
        const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
        const chatSession = {
            title,
            symbol: '💭',
            mood: '',
            note: '',
            created: new Date(),
            updated: new Date()
        };

        const savedSession = await Backendless.Data.of("ChatSession").save(chatSession);
        addDebugLog('info', `[${requestId}] Chat session created: ${savedSession.objectId}`);
        return savedSession;
    } catch (error) {
        addDebugLog('error', `[${requestId}] Error creating chat session: ${error.message}`);
        throw error;
    }
}

/**
 * Saves a journal entry (message)
 * @param {string} message - The message content
 * @param {string} chatSessionId - The associated chat session ID
 * @param {string} role - The role of the message sender ('user' or 'assistant')
 * @returns {Promise<Object>} Created journal entry object
 */
export async function saveJournalEntry(message, chatSessionId, role = 'user') {
    const requestId = Math.random().toString(36).substring(7);
    addDebugLog('info', `[${requestId}] Saving journal entry...`);

    try {
        const journalEntry = {
            role,
            message,
            chatSessionId,
            created: new Date(),
            updated: new Date()
        };

        const savedEntry = await Backendless.Data.of("Journal").save(journalEntry);
        addDebugLog('info', `[${requestId}] Journal entry saved: ${savedEntry.objectId}`);
        return savedEntry;
    } catch (error) {
        addDebugLog('error', `[${requestId}] Error saving journal entry: ${error.message}`);
        throw error;
    }
}

/**
 * Gets conversation history for a chat session
 * @param {string} chatSessionId - The chat session ID
 * @returns {Promise<Array>} Array of journal entries
 */
export async function getConversationHistory(chatSessionId) {
    const requestId = Math.random().toString(36).substring(7);
    addDebugLog('info', `[${requestId}] Getting conversation history...`);

    try {
        const queryBuilder = Backendless.DataQueryBuilder.create()
            .setWhereClause(`chatSessionId = '${chatSessionId}'`)
            .setSortBy(['created ASC']);
        
        const entries = await Backendless.Data.of("Journal").find(queryBuilder);
        addDebugLog('info', `[${requestId}] Found ${entries.length} entries`);
        return entries;
    } catch (error) {
        addDebugLog('error', `[${requestId}] Error getting conversation history: ${error.message}`);
        throw error;
    }
}

/**
 * Gets list of chat sessions
 * @param {number} pageSize - Number of sessions to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} Array of chat sessions
 */
export async function getChatSessions(pageSize = 10, offset = 0) {
    const requestId = Math.random().toString(36).substring(7);
    addDebugLog('info', `[${requestId}] Getting chat sessions...`);

    try {
        const queryBuilder = Backendless.DataQueryBuilder.create()
            .setSortBy(['created DESC'])
            .setPageSize(pageSize)
            .setOffset(offset);
        
        const sessions = await Backendless.Data.of("ChatSession").find(queryBuilder);
        addDebugLog('info', `[${requestId}] Found ${sessions.length} sessions`);
        return sessions;
    } catch (error) {
        addDebugLog('error', `[${requestId}] Error getting chat sessions: ${error.message}`);
        throw error;
    }
}

/**
 * Updates a chat session
 * @param {string} sessionId - The chat session ID
 * @param {Object} updates - The updates to apply
 * @returns {Promise<Object>} Updated chat session object
 */
export async function updateChatSession(sessionId, updates) {
    const requestId = Math.random().toString(36).substring(7);
    addDebugLog('info', `[${requestId}] Updating chat session...`);

    try {
        const updateData = {
            objectId: sessionId,
            ...updates,
            updated: new Date()
        };

        const updatedSession = await Backendless.Data.of("ChatSession").save(updateData);
        addDebugLog('info', `[${requestId}] Chat session updated: ${sessionId}`);
        return updatedSession;
    } catch (error) {
        addDebugLog('error', `[${requestId}] Error updating chat session: ${error.message}`);
        throw error;
    }
}

/**
 * Deletes a chat session and its journal entries
 * @param {string} sessionId - The chat session ID to delete
 * @returns {Promise<void>}
 */
export async function deleteChatSession(sessionId) {
    const requestId = Math.random().toString(36).substring(7);
    addDebugLog('info', `[${requestId}] Deleting chat session...`);

    try {
        // First delete all related journal entries
        const journalQuery = Backendless.DataQueryBuilder.create()
            .setWhereClause(`chatSessionId = '${sessionId}'`);
        const entries = await Backendless.Data.of("Journal").find(journalQuery);
        
        for (const entry of entries) {
            await Backendless.Data.of("Journal").remove(entry.objectId);
        }

        // Then delete the chat session
        await Backendless.Data.of("ChatSession").remove(sessionId);
        addDebugLog('info', `[${requestId}] Deleted chat session and ${entries.length} entries`);
    } catch (error) {
        addDebugLog('error', `[${requestId}] Error deleting chat session: ${error.message}`);
        throw error;
    }
} 