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

// Response endpoint for n8n
app.post('/api/response', (req, res) => {
    const { sessionId, message } = req.body;
    if (sessionId && message) {
        responses.set(sessionId, message);
        res.status(200).json({ success: true });
    } else {
        res.status(400).json({ error: 'sessionId and message required' });
    }
});

// Get response endpoint for client polling
app.get('/api/response', (req, res) => {
    const { sessionId } = req.query;
    const message = responses.get(sessionId);
    if (message) {
        responses.delete(sessionId); // Remove after sending
        res.json({ message });
    } else {
        res.json({ message: null });
    }
});

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