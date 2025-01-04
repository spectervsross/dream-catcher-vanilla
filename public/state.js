/**
 * @fileoverview Global state management for the Dream Catcher application.
 * This module handles the application's global state and provides functions to update it.
 * @module state
 */

/**
 * Global state object containing all application-wide state
 * @typedef {Object} State
 * @property {boolean} isLoading - Indicates if any async operation is in progress
 * @property {string} connectionState - Current connection state ('connected' or 'disconnected')
 * @property {boolean} isMobile - Indicates if the app is being viewed on a mobile device
 * @property {string} insightsPeriod - Current period for insights view ('daily', 'weekly', 'monthly')
 * @property {boolean} debugMode - Indicates if debug mode is enabled
 * @property {boolean} hasMoreDreams - Indicates if there are more dreams to load
 * @property {number} currentPage - Current page number for pagination
 * @property {number} pageSize - Number of items per page
 * @property {boolean} sidebarOpen - Indicates if the sidebar is open
 * @property {string} currentTab - Currently active tab
 * @property {Array} messages - Array of chat messages
 * @property {Array} apiLogs - Array of API debug logs
 * @property {string} currentChatSessionId - ID of the current chat session
 * @property {Array} chatSessions - Array of chat sessions
 */
export const state = {
    isLoading: false,
    connectionState: 'connected',
    isMobile: window.innerWidth < 768,
    insightsPeriod: 'weekly',
    debugMode: true,
    hasMoreDreams: false,
    currentPage: 1,
    pageSize: 10,
    sidebarOpen: false,
    currentTab: 'chat',
    messages: [],
    apiLogs: [],
    currentChatSessionId: null,
    chatSessions: []
};

/**
 * Updates the loading state and related UI elements
 * @param {boolean} isLoading - The new loading state
 */
export function updateLoadingState(isLoading) {
    state.isLoading = isLoading;
    const messageForm = document.getElementById('message-form');
    const input = messageForm.querySelector('input');
    const button = messageForm.querySelector('button');
    
    input.disabled = isLoading;
    button.disabled = isLoading;
    
    if (isLoading) {
        button.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
    } else {
        button.textContent = 'Send';
    }
}

/**
 * Updates the connection state
 * @param {boolean} connected - Whether the application is connected
 */
export function updateConnectionState(connected) {
    state.connectionState = connected ? 'connected' : 'disconnected';
}

/**
 * Updates the mobile state based on window width
 */
export function updateMobileState() {
    state.isMobile = window.innerWidth < 768;
}

/**
 * Updates the current chat session
 * @param {string} sessionId - The ID of the chat session
 */
export function updateCurrentSession(sessionId) {
    state.currentChatSessionId = sessionId;
}

/**
 * Updates the chat sessions list
 * @param {Array} sessions - Array of chat sessions
 */
export function updateChatSessions(sessions) {
    state.chatSessions = sessions;
} 