// State management
const state = {
    messages: [],
    sidebarOpen: window.innerWidth >= 768,
    chatHistory: [],
    currentTab: 'dream',
    isLoading: false,
    connectionState: 'connected',
    isMobile: window.innerWidth < 768,
    insightsPeriod: 'weekly',
    debugMode: true,
    apiLogs: [],
    suggestionCache: {
        data: null,
        timestamp: null
    }
};

// Helper functions
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    }).format(new Date(date));
}

// Function to get suggested actions from ChatGPT
async function fetchSuggestedActions() {
    console.log('\n=== Starting Suggestion Fetch ===');
    const startTime = Date.now();
    
    try {
        console.log('Making fetch request to /api/generate-suggestions...');
        const response = await fetch('http://localhost:3000/api/generate-suggestions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ timestamp: state.suggestionCache.timestamp })
        });

        console.log('Response received, status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch suggestions: ${response.status}`);
        }

        const data = await response.json();
        console.log('Parsed response data:', data);
        
        // Update cache if response wasn't cached
        if (!data.cached) {
            state.suggestionCache.data = data.suggestions;
            state.suggestionCache.timestamp = Date.now();
        }
        
        const duration = Date.now() - startTime;
        console.log(`Suggestion fetch completed in ${duration}ms`);
        console.log('=== End Suggestion Fetch ===\n');

        return data.suggestions;
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error('\n=== Error Fetching Suggestions ===');
        console.error(`Error occurred after ${duration}ms`);
        console.error('Error details:', error);
        
        // Use cached data if available
        if (state.suggestionCache.data) {
            console.log('Using cached suggestions due to error');
            return state.suggestionCache.data;
        }

        // Fallback suggestions if no cache available
        console.log('Using fallback suggestions');
        return [
            {
                title: "Recent Dream Journey",
                description: "Share your latest dream and let's uncover its hidden meanings together."
            },
            {
                title: "Dream Patterns Revealed",
                description: "Discover recurring themes in your dreams and what they say about you."
            },
            {
                title: "Symbol Mystery",
                description: "Explore the fascinating meanings behind common dream symbols in your sleep."
            },
            {
                title: "Dream Analysis",
                description: "Get personalized insights about your subconscious mind through dream interpretation."
            }
        ];
    }
}

// Pre-fetch suggestions function
async function prefetchSuggestions() {
    console.log('Pre-fetching suggestions in background...');
    try {
        const suggestions = await fetchSuggestedActions();
        state.suggestionCache.data = suggestions;
        state.suggestionCache.timestamp = Date.now();
        console.log('Successfully pre-fetched suggestions');
    } catch (error) {
        console.error('Failed to pre-fetch suggestions:', error);
    }
}

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    console.log('\n=== Page Initialization ===');
    console.log('DOM Content Loaded, initializing app...');
    
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const newChatBtn = document.getElementById('new-chat');
    const messageForm = document.getElementById('message-form');
    const chatHistoryContainer = document.querySelector('.space-y-2');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const currentTabTitle = document.getElementById('current-tab');
    const chatContainer = document.querySelector('.chat-container');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const aside = document.querySelector('aside');
    const suggestedActions = document.querySelectorAll('.suggested-action');

    console.log('DOM elements initialized');

    // Initialize starry background
    console.log('Initializing starry background...');
    initStarryBackground();
    
    // Automatically start new chat on page load
    console.log('Starting initial chat...');
    startNewChat().catch(error => {
        console.error('Error starting initial chat:', error);
    });
    
    console.log('=== End Page Initialization ===\n');

    // Handle window resize
    window.addEventListener('resize', () => {
        state.isMobile = window.innerWidth < 768;
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

    // New chat functionality
    async function startNewChat() {
        console.log('\n=== Starting New Chat ===');
        const startTime = Date.now();

        // Clear messages
        state.messages = [];
        const chatMessages = document.querySelector('.chat-messages');
        
        console.log('Clearing existing messages...');
        while (chatMessages.firstChild) {
            chatMessages.removeChild(chatMessages.firstChild);
        }

        // Show loading state
        console.log('Showing loading state...');
        chatMessages.innerHTML = `
            <div class="empty-state text-center py-8 md:py-12">
                <h3 class="text-xl md:text-2xl font-bold text-white mb-4">Loading suggestions...</h3>
                <div class="loading-spinner"></div>
            </div>
        `;

        // Fetch suggested actions
        console.log('Fetching suggested actions...');
        const suggestions = await fetchSuggestedActions();
        console.log('Received suggestions:', suggestions);

        // Show empty state with dynamic suggestions
        console.log('Rendering suggestions...');
        chatMessages.innerHTML = `
            <div class="empty-state text-center py-8 md:py-12">
                <h3 class="text-xl md:text-2xl font-bold text-white mb-4">Welcome to Dream Catcher</h3>
                <p class="text-gray-400 mb-8">Share your dreams and get insights from our AI</p>
                
                <div class="suggested-actions grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto px-4">
                    ${suggestions.map(suggestion => `
                        <button class="suggested-action mystical-glass p-4 md:p-6 rounded-lg text-left hover:bg-gray-800/50 transition-all">
                            <h4 class="text-white font-semibold mb-2">${suggestion.title}</h4>
                            <p class="text-gray-400 text-sm">${suggestion.description}</p>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Clear input
        const input = messageForm.querySelector('input');
        if (input) {
            input.value = '';
            input.focus();
        }

        console.log('Re-attaching event listeners to suggestion buttons...');
        // Re-attach suggested action listeners
        const newSuggestedActions = document.querySelectorAll('.suggested-action');
        newSuggestedActions.forEach(button => {
            button.addEventListener('click', () => {
                const input = messageForm.querySelector('input');
                const sendButton = messageForm.querySelector('button');
                const action = button.querySelector('h4').textContent;
                console.log('Suggestion clicked:', action);
                input.value = `Tell me about ${action.toLowerCase()}`;
                input.focus();
                // Trigger send button click
                console.log('Triggering send button click...');
                sendButton.click();
            });
        });

        const duration = Date.now() - startTime;
        console.log(`New chat setup completed in ${duration}ms`);
        console.log('=== End New Chat ===\n');
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

    // Add suggested action listeners
    suggestedActions.forEach(button => {
        button.addEventListener('click', () => {
            const input = messageForm.querySelector('input');
            const sendButton = messageForm.querySelector('button');
            const action = button.querySelector('h4').textContent;
            input.value = `Tell me about ${action.toLowerCase()}`;
            input.focus();
            // Trigger send button click
            sendButton.click();
        });
    });

    // New chat button click handler
    newChatBtn.addEventListener('click', startNewChat);

    // Sidebar toggle button
    sidebarToggleBtn.addEventListener('click', () => toggleSidebar());

    // Message handling
    async function sendMessage(content) {
        if (!content.trim()) return;

        const requestStartTime = Date.now();
        console.log('\n=== Starting API Request ===');
        console.log(`[${new Date().toISOString()}] Checking server health...`);

        showStatus(true, 'Connecting to AI...');

        // Check server availability first
        try {
            const serverCheck = await fetch('http://localhost:3000/api/health', { 
                method: 'GET',
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            if (!serverCheck.ok) {
                throw new Error('Server is not responding');
            }
            console.log('Server health check: OK');
            showStatus(true, 'Connected, sending message...');
        } catch (error) {
            console.error('Server health check failed:', error);
            addErrorMessage('Server is not available. Please make sure the server is running.');
            showStatus(false);
            return;
        }

        state.isLoading = true;
        updateLoadingState();

        // Hide empty state if visible
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        const message = {
            id: Date.now(),
            content,
            timestamp: new Date().toISOString(),
            sender: 'user'
        };

        console.log('Sending message:', message);
        addMessageToChat(message);
        addToChatHistory(message);
        
        let controller = new AbortController();
        let timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
            // Show typing indicator
            const typingIndicator = createTypingIndicator();
            document.querySelector('.chat-messages').appendChild(typingIndicator);
            showStatus(true, 'AI is thinking...');

            console.log('Making request to /api/interpret-dream...');
            const response = await fetch('http://localhost:3000/api/interpret-dream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: content,
                    context: state.messages.slice(-5) // Send last 5 messages for context
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            
            // Remove typing indicator
            typingIndicator.remove();

            const requestDuration = Date.now() - requestStartTime;
            console.log(`Request completed in ${requestDuration}ms`);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server returned error:', errorData);
                throw new Error(errorData.error || 'Failed to get response from server');
            }

            const data = await response.json();
            console.log('Received response:', data);
            
            // Validate response data
            if (!data.message) {
                throw new Error('Invalid response format from server');
            }

            // Clean and format the response text
            let cleanedMessage = data.message.trim();
            
            // Format the response with markdown-like syntax
            const formattedContent = formatResponse(cleanedMessage);
            
            const assistantMessage = {
                id: Date.now(),
                content: formattedContent,
                timestamp: new Date().toISOString(),
                sender: 'assistant',
                rawContent: cleanedMessage, // Store raw content for history
                duration: data.duration // Store API response time
            };
            
            console.log('Created assistant message:', assistantMessage);
            
            // Remove any existing typing indicator before adding the message
            const existingTypingIndicator = document.querySelector('.message.typing');
            if (existingTypingIndicator) {
                existingTypingIndicator.remove();
            }
            
            addMessageToChat(assistantMessage);

            // Save to chat history with raw content
            addToChatHistory({
                ...assistantMessage,
                content: cleanedMessage.substring(0, 30) + (cleanedMessage.length > 30 ? '...' : '')
            });

            // Ensure the message is scrolled into view
            const chatMessages = document.querySelector('.chat-messages');
            if (chatMessages) {
                setTimeout(() => {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }, 100);
            }

            console.log('=== Request Complete ===\n');

            // After receiving response
            showStatus(true, 'Response received!');
            setTimeout(() => showStatus(false), 2000); // Hide after 2 seconds

        } catch (error) {
            console.error('\n=== Error in message handling ===');
            console.error('Error details:', error);
            console.error(`Request failed after ${Date.now() - requestStartTime}ms`);
            
            let errorMessage;
            
            if (error.name === 'AbortError') {
                errorMessage = 'Request timed out. Please try again.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Unable to connect to the server. Please check your internet connection.';
            } else {
                errorMessage = 'Failed to get response. Please try again.';
            }
            
            console.error('Error message:', errorMessage);
            console.error('=== End Error ===\n');
            
            addErrorMessage(errorMessage);
            showStatus(true, 'Error occurred');
            setTimeout(() => showStatus(false), 2000);
        } finally {
            clearTimeout(timeoutId);
            state.isLoading = false;
            updateLoadingState();
        }
    }

    // Create typing indicator element
    function createTypingIndicator() {
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

    // Format the response with basic markdown-like syntax
    function formatResponse(text) {
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

    function updateLoadingState() {
        const input = messageForm.querySelector('input');
        const button = messageForm.querySelector('button');
        
        input.disabled = state.isLoading;
        button.disabled = state.isLoading;
        
        if (state.isLoading) {
            button.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
        } else {
            button.textContent = 'Send';
        }
    }

    function addMessageToChat(message) {
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

    function createMessageElement(message) {
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

    function addErrorMessage(errorText) {
        const div = document.createElement('div');
        div.className = 'message error mb-4 p-4 rounded-lg bg-red-500/20 max-w-[80%] mx-auto';
        div.innerHTML = `
            <p class="text-red-400">${errorText}</p>
        `;
        document.querySelector('.chat-messages').appendChild(div);
    }

    function addToChatHistory(message) {
        const historyItem = {
            id: message.id,
            preview: message.content.substring(0, 30) + (message.content.length > 30 ? '...' : ''),
            timestamp: message.timestamp
        };
        
        state.chatHistory.unshift(historyItem);
        updateChatHistoryUI();
    }

    function updateChatHistoryUI() {
        chatHistoryContainer.innerHTML = state.chatHistory
            .map(item => `
                <div class="chat-history-item p-3 hover:bg-gray-800 rounded-lg cursor-pointer mystical-glass">
                    <p class="font-medium text-sm text-gray-300">${item.preview}</p>
                    <span class="text-xs text-gray-500">${formatDate(item.timestamp)}</span>
                </div>
            `)
            .join('');
    }

    // Form submission
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

    // Add insights tab elements
    const insightTabTriggers = document.querySelectorAll('#content-insight .tab-trigger');
    
    // Add insights tab handlers
    function switchInsightsPeriod(period) {
        state.insightsPeriod = period;
        
        // Update tab triggers
        insightTabTriggers.forEach(trigger => {
            const isPeriod = trigger.textContent.toLowerCase() === period;
            trigger.classList.toggle('active', isPeriod);
            trigger.classList.toggle('bg-white/10', isPeriod);
            trigger.classList.toggle('text-white', isPeriod);
            trigger.classList.toggle('text-white/60', !isPeriod);
        });

        // Update content (if needed for different periods)
        // Currently only showing sample data
    }

    // Add click handlers for insight tab triggers
    insightTabTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const period = trigger.textContent.toLowerCase();
            switchInsightsPeriod(period);
        });
    });

    // Add debug panel elements
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

    // Function to add log to debug panel
    function addDebugLog(type, message) {
        const timestamp = new Date().toISOString();
        const log = { timestamp, type, message };
        state.apiLogs.push(log);
        updateDebugPanel();
    }

    // Function to update debug panel
    function updateDebugPanel() {
        const logsContainer = debugPanel.querySelector('.logs-container');
        logsContainer.innerHTML = state.apiLogs.map(log => `
            <div class="log-entry mb-2 ${log.type === 'error' ? 'text-red-400' : 'text-gray-300'}">
                <span class="text-gray-500">[${log.timestamp.split('T')[1].split('.')[0]}]</span>
                <span class="ml-2">${typeof log.message === 'object' ? JSON.stringify(log.message, null, 2) : log.message}</span>
            </div>
        `).join('');
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    // Modify console.log and console.error to also show in debug panel
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = function(...args) {
        originalConsoleLog.apply(console, args);
        if (args[0] && typeof args[0] === 'string' && args[0].includes('===')) {
            addDebugLog('info', args.join(' '));
        }
    };

    console.error = function(...args) {
        originalConsoleError.apply(console, args);
        addDebugLog('error', args.join(' '));
    };

    // Add status indicator element
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'fixed bottom-4 left-0 right-0 mx-auto w-fit px-3 py-1 rounded-full bg-gray-800 text-sm text-gray-300 transition-all duration-300 opacity-0 flex items-center space-x-2';
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

    // Function to show/hide status indicator
    function showStatus(show, message = '') {
        statusIndicator.style.opacity = show ? '1' : '0';
        if (message) {
            statusIndicator.querySelector('.status-text').textContent = message;
        }
    }

    // Pre-fetch suggestions for next time
    prefetchSuggestions();

    // Add periodic pre-fetching every 30 minutes
    setInterval(prefetchSuggestions, 30 * 60 * 1000);
});
