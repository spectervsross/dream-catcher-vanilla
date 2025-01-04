/**
 * @fileoverview Chat and message handling functionality.
 * This module handles all chat-related operations including message sending,
 * receiving, and UI updates.
 * @module chat
 */

import { state, updateCurrentSession } from './state.js';
import { formatDate, formatResponse, showStatus } from './utils.js';
import { 
    createChatSession, 
    saveJournalEntry, 
    getConversationHistory,
    getChatSessions,
    deleteChatSession 
} from './api.js';

/**
 * Creates a message element for the chat UI
 * @param {Object} message - The message object
 * @param {string} message.sender - The sender of the message ('user' or 'assistant')
 * @param {string} message.content - The message content
 * @param {Date} message.timestamp - The message timestamp
 * @returns {HTMLElement} The created message element
 */
export function createMessageElement(message) {
    const div = document.createElement('div');
    div.className = `message ${message.sender} mb-4 p-4 rounded-lg mystical-glass ${
        message.sender === 'user' 
            ? 'bg-blue-600/20 ml-auto max-w-[80%]' 
            : 'bg-gray-800/50 max-w-[80%]'
    }`;
    
    const avatar = document.createElement('div');
    avatar.className = 'flex items-start mb-2';
    avatar.innerHTML = `
        <div class="avatar mr-2">
            <div class="w-4 h-4 rounded-full ${message.sender === 'user' ? 'bg-blue-600' : 'bg-purple-600'}"></div>
            <div class="avatar-status ${message.sender === 'user' ? 'online' : ''}"></div>
        </div>
        <div class="font-medium text-sm text-gray-400">${message.sender === 'user' ? 'You' : 'Dream Catcher'}</div>
    `;
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = `
        <div class="break-words text-white">${message.content}</div>
        <span class="text-xs text-gray-400 mt-2 block">${formatDate(message.timestamp)}</span>
    `;
    
    div.appendChild(avatar);
    div.appendChild(content);
    return div;
}

/**
 * Creates a typing indicator element
 * @returns {HTMLElement} The typing indicator element
 */
export function createTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'message assistant typing mb-4 p-4 rounded-lg mystical-glass bg-gray-800/50 max-w-[80%]';
    div.innerHTML = `
        <div class="flex items-start mb-2">
            <div class="avatar mr-2">
                <div class="w-4 h-4 rounded-full bg-purple-600"></div>
            </div>
            <div class="font-medium text-sm text-gray-400">Dream Catcher is typing</div>
        </div>
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    return div;
}

/**
 * Adds a message to the chat UI and state
 * @param {Object} message - The message object to add
 * @returns {Promise<void>}
 */
export async function addMessageToChat(message) {
    state.messages.push(message);
    const chatContainer = document.querySelector('.chat-messages');
    const messageElement = createMessageElement(message);
    chatContainer.appendChild(messageElement);
    
    // Smooth scroll to bottom
    requestAnimationFrame(() => {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    });
}

/**
 * Adds an error message to the chat UI
 * @param {string} errorText - The error message to display
 */
export function addErrorMessage(errorText) {
    const div = document.createElement('div');
    div.className = 'message error mb-4 p-4 rounded-lg bg-red-500/20 max-w-[80%] mx-auto';
    div.innerHTML = `
        <p class="text-red-400">${errorText}</p>
    `;
    document.querySelector('.chat-messages').appendChild(div);
}

/**
 * Loads chat history for a specific session
 * @param {string} chatSessionId - The chat session ID
 * @returns {Promise<void>}
 */
export async function loadChatHistory(chatSessionId) {
    try {
        const history = await getConversationHistory(chatSessionId);
        
        // Clear existing messages
        const chatContainer = document.querySelector('.chat-messages');
        chatContainer.innerHTML = '';
        state.messages = [];

        // Add messages to UI
        for (const entry of history) {
            const message = {
                id: entry.objectId,
                content: entry.message,
                timestamp: entry.created,
                sender: entry.role
            };
            await addMessageToChat(message);
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
        addErrorMessage('Failed to load chat history');
    }
}

/**
 * Loads and displays chat sessions
 * @returns {Promise<void>}
 */
export async function loadChatSessions() {
    try {
        const sessions = await getChatSessions();
        updateChatSessionsList(sessions);
    } catch (error) {
        console.error('Error loading chat sessions:', error);
        addErrorMessage('Failed to load chat sessions');
    }
}

/**
 * Updates the chat sessions list in the UI
 * @param {Array} sessions - Array of chat sessions
 */
function updateChatSessionsList(sessions) {
    const container = document.querySelector('.chat-sessions');
    if (!container) return;

    container.innerHTML = sessions.map(session => `
        <div class="chat-session mystical-glass p-3 mb-2 rounded-lg cursor-pointer hover:bg-gray-800/50" data-id="${session.objectId}">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="text-xl">${session.symbol}</span>
                    <span class="text-white">${session.title}</span>
                </div>
                <button class="delete-session text-gray-400 hover:text-red-400 p-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="text-xs text-gray-400 mt-1">${formatDate(session.created)}</div>
        </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.chat-session').forEach(el => {
        // Session click handler
        el.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-session')) {
                const sessionId = el.dataset.id;
                updateCurrentSession(sessionId);
                loadChatHistory(sessionId);
            }
        });

        // Delete button handler
        const deleteBtn = el.querySelector('.delete-session');
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const sessionId = el.dataset.id;
            if (confirm('Are you sure you want to delete this chat?')) {
                try {
                    await deleteChatSession(sessionId);
                    if (state.currentChatSessionId === sessionId) {
                        updateCurrentSession(null);
                        startNewChat();
                    }
                    loadChatSessions();
                } catch (error) {
                    console.error('Error deleting chat session:', error);
                    addErrorMessage('Failed to delete chat session');
                }
            }
        });
    });
}

/**
 * Sends a message to the AI and handles the response
 * @param {string} content - The message content to send
 * @returns {Promise<void>}
 */
export async function sendMessage(content) {
    if (!content.trim()) return;

    const requestStartTime = Date.now();
    console.log('\n=== Starting Message Send Process ===');

    // Check user authentication
    const currentUser = await Backendless.UserService.getCurrentUser();
    if (!currentUser) {
        console.error('No user logged in');
        addErrorMessage('Please log in to send messages');
        return;
    }

    showStatus(true, 'Connecting to AI...');
    state.isLoading = true;

    try {
        // Create new chat session if needed
        if (!state.currentChatSessionId) {
            const session = await createChatSession(content);
            updateCurrentSession(session.objectId);
            await loadChatSessions();
        }

        // Save user message
        const userMessage = {
            id: Date.now(),
            content: content.trim(),
            timestamp: new Date(),
            sender: 'user'
        };

        await saveJournalEntry(content, state.currentChatSessionId, 'user');
        await addMessageToChat(userMessage);
    
        // Show typing indicator
        const typingIndicator = createTypingIndicator();
        document.querySelector('.chat-messages').appendChild(typingIndicator);
        showStatus(true, 'AI is thinking...');

        // Get AI response
        let controller = new AbortController();
        let timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch('http://localhost:3000/api/interpret-dream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message: content,
                context: state.messages.slice(-5)
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        typingIndicator.remove();

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get response from server');
        }

        const data = await response.json();
        
        if (!data.message) {
            throw new Error('Invalid response format from server');
        }

        // Save and display AI response
        const assistantMessage = {
            id: Date.now(),
            content: formatResponse(data.message.trim()),
            timestamp: new Date(),
            sender: 'assistant',
            interpretation: data.interpretation || '',
            duration: data.duration
        };
        
        await saveJournalEntry(data.message, state.currentChatSessionId, 'assistant');
        await addMessageToChat(assistantMessage);

        showStatus(true, 'Response received!');
        setTimeout(() => showStatus(false), 2000);

    } catch (error) {
        console.error('Error in message handling:', error);
        
        let errorMessage = 'Failed to get response. Please try again.';
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Unable to connect to the server. Please check your internet connection.';
        }
        
        addErrorMessage(errorMessage);
        showStatus(true, 'Error occurred');
        setTimeout(() => showStatus(false), 2000);
    } finally {
        state.isLoading = false;
    }
}

/**
 * Starts a new chat session
 * @returns {Promise<void>}
 */
export async function startNewChat() {
    console.log('\n=== Starting New Chat ===');
    const startTime = Date.now();

    // Clear current session and messages
    updateCurrentSession(null);
    state.messages = [];
    const chatMessages = document.querySelector('.chat-messages');
    
    while (chatMessages.firstChild) {
        chatMessages.removeChild(chatMessages.firstChild);
    }

    // Show loading state
    chatMessages.innerHTML = `
        <div class="empty-state text-center py-8 md:py-12">
            <h3 class="text-xl md:text-2xl font-bold text-white mb-4">Loading suggestions...</h3>
            <div class="loading-spinner"></div>
        </div>
    `;

    try {
        // Show empty state with suggestions
        chatMessages.innerHTML = `
            <div class="empty-state text-center py-8 md:py-12">
                <h3 class="text-xl md:text-2xl font-bold text-white mb-4">Welcome to Dream Catcher</h3>
                <p class="text-gray-400 mb-8">Share your dreams and get insights from our AI</p>
                
                <div class="suggested-actions grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto px-4">
                    <button class="suggested-action mystical-glass p-4 md:p-6 rounded-lg text-left hover:bg-gray-800/50 transition-all">
                        <h4 class="text-white font-semibold mb-2">Recent Dream</h4>
                        <p class="text-gray-400 text-sm">Share and analyze your most recent dream</p>
                    </button>
                    <button class="suggested-action mystical-glass p-4 md:p-6 rounded-lg text-left hover:bg-gray-800/50 transition-all">
                        <h4 class="text-white font-semibold mb-2">Dream Patterns</h4>
                        <p class="text-gray-400 text-sm">Discover patterns in your dreams</p>
                    </button>
                </div>
            </div>
        `;

        // Re-attach suggested action listeners
        const suggestedActions = document.querySelectorAll('.suggested-action');
        const messageForm = document.getElementById('message-form');
        
        suggestedActions.forEach(button => {
            button.addEventListener('click', () => {
                const input = messageForm.querySelector('input');
                const sendButton = messageForm.querySelector('button');
                const action = button.querySelector('h4').textContent;
                input.value = `Tell me about ${action.toLowerCase()}`;
                input.focus();
                sendButton.click();
            });
        });

        // Load chat sessions
        await loadChatSessions();

    } catch (error) {
        console.error('Error starting new chat:', error);
        addErrorMessage('Failed to start new chat. Please try again.');
    }

    const duration = Date.now() - startTime;
    console.log(`New chat setup completed in ${duration}ms`);
} 