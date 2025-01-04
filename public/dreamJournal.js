/**
 * @fileoverview Dream Journal functionality.
 * This module handles all dream journal related operations including
 * creating, reading, updating, and deleting dreams.
 * @module dreamJournal
 */

import { state } from './state.js';
import { formatDate } from './utils.js';

/**
 * Initializes the Dream Journal functionality
 */
export function initDreamJournal() {
    const newDreamBtn = document.getElementById('new-dream-btn');
    const dreamForm = document.getElementById('dream-form');
    const cancelDreamBtn = document.getElementById('cancel-dream');
    const loadMoreBtn = document.getElementById('load-more-dreams');
    const tabDreamJournal = document.getElementById('tab-journal');

    // Check if required elements exist
    if (!newDreamBtn || !dreamForm || !cancelDreamBtn || !tabDreamJournal) {
        console.log('Dream journal elements not found, skipping initialization');
        return;
    }

    // Event Listeners
    newDreamBtn.addEventListener('click', () => {
        dreamForm.classList.remove('hidden');
    });

    cancelDreamBtn.addEventListener('click', () => {
        dreamForm.classList.add('hidden');
        dreamForm.reset();
    });

    dreamForm.addEventListener('submit', handleDreamSubmit);
    tabDreamJournal.addEventListener('click', initializeDreamsList);
}

/**
 * Handles dream submission from the form
 * @param {Event} e - The form submit event
 * @returns {Promise<void>}
 */
export async function handleDreamSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
        const dreamData = {
            content: document.getElementById('dream-content').value,
            mood: document.getElementById('dream-mood').value,
            tags: document.getElementById('dream-tags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0),
            interpretation: document.getElementById('dream-interpretation')?.value || ''
        };

        const savedDream = await saveDream(dreamData);
        form.classList.add('hidden');
        form.reset();
        
        // Add the new dream to the top of the list
        const dreamsList = document.getElementById('dreams-list');
        const dreamElement = createDreamElement(savedDream);
        dreamsList.insertBefore(dreamElement, dreamsList.firstChild);
        
        // Hide empty state if visible
        document.getElementById('dreams-empty').classList.add('hidden');

        // Refresh journal list to show the new entry
        await initializeJournalList();
    } catch (error) {
        console.error('Failed to save dream:', error);
        alert('Failed to save dream: ' + error.message);
    } finally {
        submitButton.disabled = false;
    }
}

/**
 * Initializes the dreams list view
 * @returns {Promise<void>}
 */
export async function initializeDreamsList() {
    const dreamsContainer = document.getElementById('dreams-container');
    const dreamsList = document.getElementById('dreams-list');
    const loadingElement = document.getElementById('dreams-loading');
    const emptyElement = document.getElementById('dreams-empty');
    const loadMoreBtn = document.getElementById('load-more-dreams');

    // Check if user is logged in
    const currentUser = await Backendless.UserService.getCurrentUser();
    if (!currentUser) {
        return;
    }

    // Reset state
    dreamsList.innerHTML = '';
    
    // Show loading state
    loadingElement.classList.remove('hidden');
    emptyElement.classList.add('hidden');
    loadMoreBtn.classList.add('hidden');

    try {
        // Check if Dreams table exists and create if it doesn't
        try {
            await Backendless.Data.describe('Dreams');
        } catch (error) {
            if (error.message.includes('Table not found')) {
                console.log('Dreams table not found, creating...');
                const initialDream = {
                    content: '',
                    interpretation: '',
                    mood: '',
                    tags: [],
                    created_at: new Date(),
                    updated_at: new Date(),
                    ownerId: '',
                    isPublic: false,
                    ___class: 'Dreams'
                };
                await Backendless.Data.of('Dreams').save(initialDream);
                console.log('Dreams table created successfully');
            }
        }

        const queryBuilder = Backendless.DataQueryBuilder.create()
            .setWhereClause(`ownerId = '${currentUser.objectId}'`)
            .setSortBy(['created_at DESC'])
            .setPageSize(10);

        const dreams = await Backendless.Data.of('Dreams').find(queryBuilder);

        loadingElement.classList.add('hidden');

        if (!dreams || dreams.length === 0) {
            emptyElement.classList.remove('hidden');
        } else {
            dreams.forEach(dream => {
                const dreamElement = createDreamElement(dream);
                dreamsList.appendChild(dreamElement);
            });

            if (dreams.length === 10) {
                loadMoreBtn.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Error loading dreams:', error);
        loadingElement.classList.add('hidden');
        emptyElement.classList.remove('hidden');
        
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 text-sm mt-2';
        errorDiv.textContent = `Error: ${error.message}`;
        emptyElement.appendChild(errorDiv);
    }
}

/**
 * Creates a dream element for display
 * @param {Object} dream - The dream object
 * @param {string} dream.content - The dream content
 * @param {string} dream.mood - The dream mood
 * @param {Array<string>} dream.tags - Array of dream tags
 * @param {string} dream.interpretation - Dream interpretation
 * @param {Date} dream.created_at - Dream creation date
 * @returns {HTMLElement} The created dream element
 */
export function createDreamElement(dream) {
    const div = document.createElement('div');
    div.className = 'mystical-glass p-4 rounded-lg space-y-3';
    
    const dateFormatted = formatDate(dream.created_at);

    div.innerHTML = `
        <div class="flex justify-between items-start">
            <div class="space-y-1">
                <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-400">${dateFormatted}</span>
                    ${dream.mood ? `<span class="px-2 py-1 text-xs rounded-full bg-gray-800 text-gray-300">${dream.mood}</span>` : ''}
                </div>
                <p class="text-white">${dream.content}</p>
                ${dream.interpretation ? `
                    <div class="border-t border-gray-700 pt-3 mt-3">
                        <p class="text-sm text-gray-300">${dream.interpretation}</p>
                    </div>
                ` : ''}
            </div>
            <button class="delete-dream text-gray-400 hover:text-red-400 p-1" data-dream-id="${dream.objectId}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </div>
        ${dream.tags && dream.tags.length > 0 ? `
            <div class="flex flex-wrap gap-2">
                ${dream.tags.map(tag => `
                    <span class="px-2 py-1 text-xs rounded-full bg-blue-900/30 text-blue-300">${tag}</span>
                `).join('')}
            </div>
        ` : ''}
    `;

    // Add delete functionality
    const deleteBtn = div.querySelector('.delete-dream');
    deleteBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this dream?')) {
            try {
                await Backendless.Data.of('Dreams').remove({ objectId: dream.objectId });
                div.remove();
                
                // Show empty state if no more dreams
                const dreamsList = document.getElementById('dreams-list');
                if (dreamsList.children.length === 0) {
                    document.getElementById('dreams-empty').classList.remove('hidden');
                }

                // Refresh journal list since the dream was also saved there
                await initializeJournalList();
            } catch (error) {
                alert('Failed to delete dream: ' + error.message);
            }
        }
    });

    return div;
}

/**
 * Saves a dream to the backend
 * @param {Object} dreamData - The dream data to save
 * @param {string} dreamData.content - The dream content
 * @param {string} dreamData.mood - The dream mood
 * @param {Array<string>} dreamData.tags - Array of dream tags
 * @param {string} dreamData.interpretation - Dream interpretation
 * @returns {Promise<Object>} The saved dream object
 * @throws {Error} If save fails or user is not logged in
 */
export async function saveDream(dreamData) {
    const currentUser = await Backendless.UserService.getCurrentUser();
    if (!currentUser) {
        throw new Error('User must be logged in to save dreams');
    }

    const now = new Date();
    const dream = {
        ...dreamData,
        created_at: now,
        updated_at: now,
        ownerId: currentUser.objectId,
        isPublic: false
    };

    return await Backendless.Data.of('Dreams').save(dream);
}

/**
 * Initializes the journal tabs
 */
export function initJournalTabs() {
    const dreamsTab = document.getElementById('journal-dreams-tab');
    const chatTab = document.getElementById('journal-chat-tab');
    const dreamsContent = document.getElementById('journal-dreams-content');
    const chatContent = document.getElementById('journal-chat-content');

    // Check if all required elements exist
    if (!dreamsTab || !chatTab || !dreamsContent || !chatContent) {
        console.log('Journal tab elements not found, skipping initialization');
        return;
    }

    dreamsTab.addEventListener('click', () => {
        dreamsTab.classList.add('bg-gray-800', 'text-white');
        chatTab.classList.remove('bg-gray-800', 'text-white');
        dreamsContent.classList.remove('hidden');
        chatContent.classList.add('hidden');
    });

    chatTab.addEventListener('click', () => {
        chatTab.classList.add('bg-gray-800', 'text-white');
        dreamsTab.classList.remove('bg-gray-800', 'text-white');
        chatContent.classList.remove('hidden');
        dreamsContent.classList.add('hidden');
    });
} 