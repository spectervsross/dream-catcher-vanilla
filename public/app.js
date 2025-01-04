// Import modules
import { state, updateCurrentSession } from './state.js';
import { formatDate, formatResponse, showStatus } from './utils.js';
import { 
    createChatSession, 
    saveJournalEntry, 
    getConversationHistory,
    getChatSessions,
    deleteChatSession 
} from './api.js';
import { addDebugLog, updateDebugPanel } from './utils.js';
import { login, logout, checkLoginStatus, updateUIAfterLogin, updateUIAfterLogout } from './auth.js';
import { sendMessage, startNewChat, addMessageToChat } from './chat.js';
import { initDreamJournal, initJournalTabs } from './dreamJournal.js';

// Function to wait for Backendless to be available
function waitForBackendless(maxAttempts = 50) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const check = () => {
            if (typeof Backendless !== 'undefined') {
                console.log('Backendless SDK loaded successfully');
                resolve();
            } else if (attempts >= maxAttempts) {
                reject(new Error('Backendless SDK failed to load'));
            } else {
                attempts++;
                setTimeout(check, 100);
            }
        };
        check();
    });
}

// DOM Elements
document.addEventListener('DOMContentLoaded', async () => {
    console.log('\n=== Page Initialization ===');
    console.log('DOM Content Loaded, initializing app...');
    
    try {
        // Wait for Backendless to be available
        await waitForBackendless();
        
        // Initialize Backendless
        Backendless.initApp('4DD34E37-20BB-4318-8FDB-81318F096BAD', '8945F044-0E41-4CD1-94F3-2403FE5CC316');
        console.log('Backendless SDK initialized successfully');
        
        const sidebarToggleBtn = document.getElementById('sidebar-toggle');
        const newChatBtn = document.getElementById('new-chat');
        const messageForm = document.getElementById('message-form');
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        const currentTabTitle = document.getElementById('current-tab');
        const chatContainer = document.querySelector('.chat-container');
        const mobileOverlay = document.getElementById('mobile-overlay');
        const aside = document.querySelector('aside');

        // Initialize starry background
        console.log('Initializing starry background...');
        initStarryBackground();
        
        // Automatically start new chat on page load
        console.log('Starting initial chat...');
        startNewChat().catch(error => {
            console.error('Error starting initial chat:', error);
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            updateMobileState();
            if (!state.isMobile && !state.sidebarOpen) {
                toggleSidebar(true);
            }
        });

        function initStarryBackground() {
            const starryBg = document.createElement('div');
            starryBg.className = 'starry-background';
            
            // Create stars
            for (let i = 0; i < 50; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.top = `${Math.random() * 100}%`;
                star.style.left = `${Math.random() * 100}%`;
                star.style.animationDelay = `${Math.random() * 2}s`;
                starryBg.appendChild(star);
            }
            
            chatContainer.insertBefore(starryBg, chatContainer.firstChild);
        }

        // Mobile overlay handling
        function toggleMobileOverlay(show) {
            mobileOverlay.classList.toggle('hidden', !show);
            mobileOverlay.classList.toggle('active', show);
            document.body.style.overflow = show ? 'hidden' : '';
        }

        // Sidebar toggle with mobile support
        function toggleSidebar(show = !state.sidebarOpen) {
            state.sidebarOpen = show;
            aside.style.transform = show ? 'translateX(0)' : 'translateX(-100%)';
            
            if (state.isMobile) {
                toggleMobileOverlay(show);
            }
        }

        // Mobile overlay click handler
        mobileOverlay.addEventListener('click', () => {
            toggleSidebar(false);
        });

        // Tab switching with mobile support
        function switchTab(tabId) {
            // Update tab buttons
            tabButtons.forEach(button => {
                const isActive = button.id === `tab-${tabId}`;
                button.classList.toggle('active', isActive);
                button.classList.toggle('text-white', isActive);
                button.classList.toggle('text-gray-400', !isActive);
            });

            // Update tab contents
            tabContents.forEach(content => {
                content.classList.toggle('hidden', content.id !== `content-${tabId}`);
                content.classList.toggle('active', content.id === `content-${tabId}`);
            });

            // Update header title
            currentTabTitle.textContent = tabId.charAt(0).toUpperCase() + tabId.slice(1);
            
            state.currentTab = tabId;

            // Close sidebar on mobile after tab switch
            if (state.isMobile) {
                toggleSidebar(false);
            }
        }

        // Add tab click listeners
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.id.replace('tab-', '');
                switchTab(tabId);
            });
        });

        // New chat button click handler
        newChatBtn.addEventListener('click', startNewChat);

        // Sidebar toggle button
        sidebarToggleBtn.addEventListener('click', () => toggleSidebar());

        // Message form handling
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = messageForm.querySelector('input');
            const content = input.value;
            if (content.trim() && !state.isLoading) {
                sendMessage(content);
                input.value = '';
                input.focus();
            }
        });

        try {
            // Initialize debug panel
            console.log('Initializing debug panel...');
            initDebugPanel();

            // Initialize auth state
            console.log('Checking login status...');
            await checkLoginStatus();

            // Initialize journal features
            console.log('Initializing journal features...');
            try {
                console.log('Initializing journal tabs...');
                initJournalTabs();
            } catch (error) {
                console.warn('Failed to initialize journal tabs:', error);
            }

            try {
                console.log('Initializing dream journal...');
                initDreamJournal();
            } catch (error) {
                console.warn('Failed to initialize dream journal:', error);
            }

            // Add journal sign-in button handler
            const journalSignInBtn = document.getElementById('journal-signin-btn');
            if (journalSignInBtn) {
                journalSignInBtn.addEventListener('click', () => {
                    // Show login form in sidebar
                    const showLoginBtn = document.getElementById('show-login');
                    if (showLoginBtn) {
                        showLoginBtn.click();
                    }
                    // Open sidebar on mobile if needed
                    if (state.isMobile && !state.sidebarOpen) {
                        toggleSidebar(true);
                    }
                });
            }
        } catch (error) {
            console.error('Error initializing features:', error);
            // Continue app execution even if some features fail to initialize
        }
    } catch (error) {
        console.error('Critical initialization error:', error);
        // Show user-friendly error message
        document.body.innerHTML = `
            <div class="error-message">
                Failed to initialize application. Please refresh the page or try again later.
            </div>
        `;
    }
});

// Initialize debug panel
function initDebugPanel() {
    // Create debug panel
    const debugPanel = document.createElement('div');
    debugPanel.className = 'debug-panel hidden fixed bottom-0 right-0 w-96 h-64 bg-gray-900 border border-gray-700 rounded-tl-lg overflow-hidden z-50';
    debugPanel.innerHTML = `
        <div class="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
            <span class="text-sm text-gray-300">API Debug Logs</span>
            <button class="clear-logs-btn text-xs text-gray-400 hover:text-white px-2 py-1 rounded">Clear</button>
        </div>
        <div class="logs-container h-full overflow-y-auto p-2 text-xs font-mono"></div>
    `;
    document.body.appendChild(debugPanel);

    // Add debug toggle button
    const debugToggle = document.createElement('button');
    debugToggle.className = 'fixed bottom-4 right-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full p-2 shadow-lg z-50';
    debugToggle.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>';
    document.body.appendChild(debugToggle);

    // Debug panel event listeners
    debugToggle.addEventListener('click', () => {
        state.debugMode = !state.debugMode;
        debugPanel.classList.toggle('hidden', !state.debugMode);
    });

    debugPanel.querySelector('.clear-logs-btn').addEventListener('click', () => {
        state.apiLogs = [];
        updateDebugPanel();
    });
}

// Add status indicator
const statusIndicator = document.createElement('div');
statusIndicator.className = 'status-indicator fixed bottom-4 left-0 right-0 mx-auto w-fit px-3 py-1 rounded-full bg-gray-800 text-sm text-gray-300 transition-all duration-300 opacity-0 flex items-center space-x-2';
statusIndicator.innerHTML = `
    <div class="loading-dot w-2 h-2 rounded-full bg-blue-500"></div>
    <span class="status-text">Connecting to AI...</span>
`;
document.body.appendChild(statusIndicator);

// Add CSS for loading animation
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { opacity: 0.4; }
        50% { opacity: 1; }
        100% { opacity: 0.4; }
    }
    .loading-dot {
        animation: pulse 1.5s infinite;
    }
`;
document.head.appendChild(style);

