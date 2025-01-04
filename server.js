import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import cookieParser from 'cookie-parser';
import Backendless from 'backendless';

dotenv.config();

// Initialize Backendless
Backendless.initApp('4DD34E37-20BB-4318-8FDB-81318F096BAD', '8945F044-0E41-4CD1-94F3-2403FE5CC316');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Set correct MIME types
express.static.mime.define({'text/javascript': ['js']});

// Serve node_modules directory
app.use('/node_modules', express.static('node_modules', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'text/javascript');
        }
    }
}));

// Serve public directory
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'text/javascript');
        }
    }
}));

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const requestId = Math.random().toString(36).substring(7);
    
    console.log('\n=== Incoming Request ===');
    console.log(`[${timestamp}] RequestID: ${requestId}`);
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }

    res.setHeader('X-Request-ID', requestId);

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

// Authentication middleware
const requireAuth = async (req, res, next) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] Checking authentication`);

    try {
        const currentUser = await Backendless.UserService.getCurrentUser();
        if (!currentUser) {
            return res.status(401).json({
                status: 'error',
                error: 'Authentication required',
                requestId
            });
        }
        req.user = currentUser;
        next();
    } catch (error) {
        console.error(`[${requestId}] Auth error:`, error);
        res.status(401).json({
            status: 'error',
            error: 'Authentication failed',
            requestId
        });
    }
};

// Unified error response middleware
const errorHandler = (err, req, res, next) => {
    const timestamp = new Date().toISOString();
    const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(7);
    
    console.error('\n=== Error ===');
    console.error(`[${timestamp}] RequestID: ${requestId}`);
    console.error(`[${timestamp}] Error in ${req.method} ${req.url}`);
    console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
    });
    console.error('=== End Error ===\n');

    // Determine status code based on error type
    let statusCode = 500;
    if (err.name === 'ValidationError') statusCode = 400;
    else if (err.name === 'UnauthorizedError') statusCode = 401;
    else if (err.name === 'NotFoundError') statusCode = 404;

    res.status(statusCode).json({
        status: 'error',
        error: err.message || 'Internal server error',
        requestId,
        timestamp
    });
};

// Apply auth middleware to protected routes
app.use([
    '/api/chat-sessions',
    '/api/journal-entries'
], requireAuth);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Dream interpretation endpoint
app.post('/api/interpret-dream', async (req, res, next) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ 
                error: 'Message is required',
                status: 'error'
            });
        }

        console.log(`[${requestId}] Processing dream interpretation request`);
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
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
        console.log(`[${requestId}] OpenAI response received in ${duration}ms`);

        res.json({ 
            message: completion.choices[0].message.content,
            status: 'success',
            duration: duration
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[${requestId}] Error processing dream interpretation:`, error);
        next(error);
    }
});

// Chat Session Endpoints
app.post('/api/chat-sessions', async (req, res, next) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] Creating new chat session`);
    
    try {
        const { title, symbol = '💭', mood = '', note = '' } = req.body;
        
        if (!title) {
            throw Object.assign(new Error('Title is required'), { name: 'ValidationError' });
        }

        const session = {
            title,
            symbol,
            mood,
            note,
            created: new Date(),
            updated: new Date()
        };

        const savedSession = await Backendless.Data.of('ChatSession').save(session);
        console.log(`[${requestId}] Chat session created: ${savedSession.objectId}`);
        
        res.json({
            status: 'success',
            data: savedSession,
            requestId
        });
    } catch (error) {
        next(error);
    }
});

app.get('/api/chat-sessions', async (req, res, next) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] Fetching chat sessions`);
    
    try {
        const page = parseInt(req.query.page) || 0;
        const pageSize = parseInt(req.query.pageSize) || 10;
        
        const queryBuilder = Backendless.DataQueryBuilder.create()
            .setSortBy(['created DESC'])
            .setPageSize(pageSize)
            .setOffset(page * pageSize);
        
        const [sessions, totalCount] = await Promise.all([
            Backendless.Data.of('ChatSession').find(queryBuilder),
            Backendless.Data.of('ChatSession').getObjectCount()
        ]);

        console.log(`[${requestId}] Found ${sessions.length} sessions (total: ${totalCount})`);
        
        res.json({
            status: 'success',
            data: {
                sessions,
                pagination: {
                    page,
                    pageSize,
                    totalCount,
                    totalPages: Math.ceil(totalCount / pageSize),
                    hasMore: (page + 1) * pageSize < totalCount
                }
            },
            requestId
        });
    } catch (error) {
        next(error);
    }
});

app.delete('/api/chat-sessions/:sessionId', async (req, res, next) => {
    const requestId = Math.random().toString(36).substring(7);
    const { sessionId } = req.params;
    
    console.log(`[${requestId}] Deleting chat session: ${sessionId}`);
    
    try {
        // Delete related journal entries first
        const journalQuery = Backendless.DataQueryBuilder.create()
            .setWhereClause(`chatSessionId = '${sessionId}'`);
        const entries = await Backendless.Data.of('Journal').find(journalQuery);
        
        for (const entry of entries) {
            await Backendless.Data.of('Journal').remove(entry.objectId);
        }

        // Then delete the chat session
        await Backendless.Data.of('ChatSession').remove(sessionId);
        
        console.log(`[${requestId}] Deleted chat session and ${entries.length} entries`);
        res.json({ success: true });
    } catch (error) {
        console.error(`[${requestId}] Error deleting chat session:`, error);
        next(error);
    }
});

// Journal Endpoints
app.post('/api/journal-entries', async (req, res, next) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] Creating new journal entry`);
    
    try {
        const { message, chatSessionId, role = 'user' } = req.body;
        
        const entry = {
            message,
            chatSessionId,
            role,
            created: new Date(),
            updated: new Date()
        };

        const savedEntry = await Backendless.Data.of('Journal').save(entry);
        console.log(`[${requestId}] Journal entry created: ${savedEntry.objectId}`);
        
        res.json(savedEntry);
    } catch (error) {
        console.error(`[${requestId}] Error creating journal entry:`, error);
        next(error);
    }
});

app.get('/api/journal-entries/:chatSessionId', async (req, res, next) => {
    const requestId = Math.random().toString(36).substring(7);
    const { chatSessionId } = req.params;
    
    console.log(`[${requestId}] Fetching journal entries for session: ${chatSessionId}`);
    
    try {
        const page = parseInt(req.query.page) || 0;
        const pageSize = parseInt(req.query.pageSize) || 20;
        
        const queryBuilder = Backendless.DataQueryBuilder.create()
            .setWhereClause(`chatSessionId = '${chatSessionId}'`)
            .setSortBy(['created ASC'])
            .setPageSize(pageSize)
            .setOffset(page * pageSize);
        
        const [entries, totalCount] = await Promise.all([
            Backendless.Data.of('Journal').find(queryBuilder),
            Backendless.Data.of('Journal').getObjectCount(queryBuilder)
        ]);

        console.log(`[${requestId}] Found ${entries.length} entries (total: ${totalCount})`);
        
        res.json({
            status: 'success',
            data: {
                entries,
                pagination: {
                    page,
                    pageSize,
                    totalCount,
                    totalPages: Math.ceil(totalCount / pageSize),
                    hasMore: (page + 1) * pageSize < totalCount
                }
            },
            requestId
        });
    } catch (error) {
        next(error);
    }
});

// Add chat session update endpoint
app.put('/api/chat-sessions/:sessionId', async (req, res, next) => {
    const requestId = Math.random().toString(36).substring(7);
    const { sessionId } = req.params;
    
    console.log(`[${requestId}] Updating chat session: ${sessionId}`);
    
    try {
        const { title, symbol, mood, note } = req.body;
        
        // Validate input
        if (!title && !symbol && !mood && !note) {
            throw Object.assign(new Error('No update data provided'), { name: 'ValidationError' });
        }

        // Get existing session
        const existingSession = await Backendless.Data.of('ChatSession').findById(sessionId);
        if (!existingSession) {
            throw Object.assign(new Error('Chat session not found'), { name: 'NotFoundError' });
        }

        // Prepare update data
        const updateData = {
            objectId: sessionId,
            ...existingSession,
            ...(title && { title }),
            ...(symbol && { symbol }),
            ...(mood && { mood }),
            ...(note && { note }),
            updated: new Date()
        };

        // Save updates
        const updatedSession = await Backendless.Data.of('ChatSession').save(updateData);
        console.log(`[${requestId}] Chat session updated: ${sessionId}`);
        
        res.json({
            status: 'success',
            data: updatedSession,
            requestId
        });
    } catch (error) {
        next(error);
    }
});

// Add error handler middleware last
app.use(errorHandler);

// Start server
app.listen(port, () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Server running at http://localhost:${port}`);
}); 