/**
 * @fileoverview Utility functions for debugging, logging, and formatting.
 * This module provides common utility functions used throughout the application.
 * @module utils
 */

import { state } from './state.js';

/**
 * Adds a log entry to the debug panel
 * @param {string} type - The type of log ('info', 'error', etc.)
 * @param {string|Object} message - The message to log
 */
export function addDebugLog(type, message) {
    const timestamp = new Date().toISOString();
    const log = { timestamp, type, message };
    state.apiLogs.push(log);
    updateDebugPanel();
}

/**
 * Updates the debug panel UI with current logs
 */
export function updateDebugPanel() {
    const debugPanel = document.querySelector('.debug-panel');
    if (!debugPanel) return;

    const logsContainer = debugPanel.querySelector('.logs-container');
    logsContainer.innerHTML = state.apiLogs.map(log => `
        <div class="log-entry mb-2 ${log.type === 'error' ? 'text-red-400' : 'text-gray-300'}">
            <span class="text-gray-500">[${log.timestamp.split('T')[1].split('.')[0]}]</span>
            <span class="ml-2">${typeof log.message === 'object' ? JSON.stringify(log.message, null, 2) : log.message}</span>
        </div>
    `).join('');
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

/**
 * Shows or hides the status indicator with an optional message
 * @param {boolean} show - Whether to show the status indicator
 * @param {string} [message=''] - Optional message to display
 */
export function showStatus(show, message = '') {
    const statusIndicator = document.querySelector('.status-indicator');
    if (!statusIndicator) return;

    statusIndicator.style.opacity = show ? '1' : '0';
    if (message) {
        statusIndicator.querySelector('.status-text').textContent = message;
    }
}

/**
 * Formats a date into a human-readable string
 * @param {Date|string|number} date - The date to format
 * @returns {string} The formatted date string
 */
export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

/**
 * Formats a response text with markdown-like syntax
 * @param {string} text - The text to format
 * @returns {string} The formatted HTML string
 */
export function formatResponse(text) {
    // Replace *text* with <em>text</em> for emphasis
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Replace **text** with <strong>text</strong> for strong emphasis
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace numbered lists
    text = text.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>');
    
    // Replace bullet points
    text = text.replace(/^[-•]\s+(.*)$/gm, '<li>$1</li>');
    
    // Add paragraphs
    text = text.split('\n\n').map(para => `<p>${para}</p>`).join('');
    
    return text;
} 