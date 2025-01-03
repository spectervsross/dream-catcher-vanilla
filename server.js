require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Add cache at the top of the file, after requires
const suggestionCache = {
    data: null,
    timestamp: null,
    CACHE_DURATION: 1000 * 60 * 60 // 1 hour cache
};

// Optimized prompt for faster response
const SUGGESTION_PROMPT = {
    role: "system",
    content: "You are a dream interpretation assistant. Generate 4 dream conversation starters. Return ONLY a JSON array with this exact format, nothing else: [{\"title\": \"2-3 words\", \"description\": \"10-15 words\"}]. Focus on: dreams, symbols, analysis, patterns."
};

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const requestId = Math.random().toString(36).substring(7);
    
    // Log request
    console.log('\n=== Incoming Request ===');
    console.log(`[${timestamp}] RequestID: ${requestId}`);
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }

    // Add request ID to response header
    res.setHeader('X-Request-ID', requestId);

    // Capture response
    const oldSend = res.send;
    res.send = function(data) {
        console.log('\n=== Outgoing Response ===');
        console.log(`[${timestamp}] RequestID: ${requestId}`);
        console.log('Status:', res.statusCode);
        console.log('Response:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
        console.log('=== End ===\n');
        oldSend.apply(res, arguments);
    };

    next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    const timestamp = new Date().toISOString();
    console.error('\n=== Error ===');
    console.error(`[${timestamp}] Error in ${req.method} ${req.url}`);
    console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
    });
    console.error('=== End Error ===\n');

    res.status(500).json({ 
        error: err.message || 'Internal server error',
        status: 'error'
    });
});

// Dream interpretation endpoint
app.post('/api/interpret-dream', async (req, res, next) => {
    const startTime = Date.now();
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ 
                error: 'Message is required',
                status: 'error'
            });
        }

        console.log('\n=== OpenAI API Request ===');
        console.log('Sending request to OpenAI...');
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are Dream Catcher, an AI dream interpreter. Help users understand their dreams with empathy and insight. Provide interpretations that are meaningful and relate to the user's subconscious mind. Include possible symbolic meanings and how they might relate to the user's waking life."
                },
                {
                    role: "user",
                    content: message
                }
            ],
            temperature: 0.7,
            max_tokens: 200
        });

        const duration = Date.now() - startTime;
        console.log(`OpenAI API response received in ${duration}ms`);
        console.log('Response:', JSON.stringify(completion.choices[0].message, null, 2));
        console.log('=== End OpenAI API Request ===\n');

        res.json({ 
            message: completion.choices[0].message.content,
            status: 'success',
            duration: duration
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error('\n=== OpenAI API Error ===');
        console.error(`Error occurred after ${duration}ms`);
        console.error('Error details:', error);
        console.error('=== End OpenAI API Error ===\n');

        // Check for specific OpenAI API errors
        if (error.response) {
            const status = error.response.status || 500;
            const message = error.response.data?.error?.message || 'OpenAI API error';
            res.status(status).json({ 
                error: message,
                status: 'error',
                duration: duration
            });
        } else {
            next(error); // Pass to error handling middleware
        }
    }
});

// Endpoint to generate suggestions using ChatGPT
app.post('/api/generate-suggestions', async (req, res) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    console.log('\n=== Starting Suggestion Generation ===');
    console.log(`[${new Date().toISOString()}] RequestID: ${requestId}`);
    
    try {
        // Check cache first
        if (suggestionCache.data && 
            suggestionCache.timestamp && 
            (Date.now() - suggestionCache.timestamp) < suggestionCache.CACHE_DURATION) {
            console.log(`[${requestId}] Returning cached suggestions`);
            return res.json({
                requestId,
                suggestions: suggestionCache.data,
                cached: true,
                timestamp: new Date().toISOString()
            });
        }

        console.log(`[${requestId}] Cache miss, making request to OpenAI...`);
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                SUGGESTION_PROMPT,
                { role: "user", content: "generate" }
            ],
            temperature: 0.7,
            max_tokens: 200,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        });

        console.log(`[${requestId}] Received response from OpenAI`);
        const suggestionsText = completion.choices[0].message.content;
        
        console.log(`[${requestId}] Parsing JSON response...`);
        const suggestions = JSON.parse(suggestionsText);

        // Update cache
        suggestionCache.data = suggestions;
        suggestionCache.timestamp = Date.now();

        const duration = Date.now() - startTime;
        console.log(`[${requestId}] Request completed in ${duration}ms`);
        console.log('=== End Suggestion Generation ===\n');

        res.json({ 
            requestId,
            suggestions,
            cached: false,
            duration,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`\n=== Error in Suggestion Generation (${requestId}) ===`);
        console.error(`[${requestId}] Error occurred after ${duration}ms`);
        console.error(`[${requestId}] Error details:`, error);

        // If cache exists but is expired, use it as fallback
        if (suggestionCache.data) {
            console.log(`[${requestId}] Using expired cache as fallback`);
            return res.json({
                requestId,
                suggestions: suggestionCache.data,
                cached: true,
                fallback: true,
                timestamp: new Date().toISOString()
            });
        }

        res.status(500).json({ 
            requestId,
            error: 'Failed to generate suggestions',
            errorMessage: error.message,
            duration,
            timestamp: new Date().toISOString()
        });
    }
});

// Start server
app.listen(port, () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Server running at http://localhost:${port}`);
}); 