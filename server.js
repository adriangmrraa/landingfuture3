const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'self'", "https://www.youtube.com"],
        },
    },
}));

app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:8080',
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '200kb' }));

// Serve static files
app.use(express.static('public'));
app.use('/src', express.static('src'));

// Health check
app.get('/health', (req, res) => {
    res.status(200).send('ok');
});

// Store responses by sessionId
const responses = new Map();

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { sessionId, message, name, phone, page, utm } = req.body;

        // Validation
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (message.length > 1000) {
            return res.status(400).json({ error: 'Message too long' });
        }

        // Sanitization
        const sanitizedData = {
            sessionId: sessionId || '',
            message: message.trim(),
            name: name ? name.trim() : '',
            phone: phone ? phone.trim() : '',
            page: page || '',
            utm: utm || {},
        };

        // Forward to webhook with retries
        const webhookUrl = process.env.WEBHOOK_URL;
        if (!webhookUrl) {
            console.error('WEBHOOK_URL not configured');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        let response;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sanitizedData),
                    signal: AbortSignal.timeout(10000), // 10 second timeout
                });

                if (response.ok) {
                    break;
                }
            } catch (error) {
                console.error(`Attempt ${attempts + 1} failed:`, error.message);
            }

            attempts++;
            if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Exponential backoff
            }
        }

        if (!response || !response.ok) {
            return res.status(502).json({ error: 'Failed to forward message' });
        }

        // Log success without sensitive data
        console.log(`Message forwarded successfully for session ${sessionId}`);

        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Server error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Callback endpoint for n8n responses (POST)
app.post('/api/callback', (req, res) => {
    try {
        const { sessionId, response } = req.body;

        if (!sessionId || !response) {
            return res.status(400).json({ error: 'sessionId and response required' });
        }

        // Store response for the session
        responses.set(sessionId, {
            response,
            timestamp: Date.now()
        });

        console.log(`Response stored for session ${sessionId}: ${response}`);
        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Callback error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET version for testing (optional)
app.get('/api/callback', (req, res) => {
    try {
        const { sessionId, response } = req.query;

        if (!sessionId || !response) {
            return res.status(400).json({ error: 'sessionId and response required as query params' });
        }

        // Store response for the session
        responses.set(sessionId, {
            response,
            timestamp: Date.now()
        });

        console.log(`GET Response stored for session ${sessionId}: ${response}`);
        res.status(200).json({ success: true });

    } catch (error) {
        console.error('GET Callback error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Poll endpoint for client to get responses
app.get('/api/response', (req, res) => {
    const { sessionId } = req.query;
    const response = responses.get(sessionId);

    if (response) {
        // Remove response after sending (one-time)
        responses.delete(sessionId);
        res.json({ message: response.response });
    } else {
        res.json({ message: null });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});