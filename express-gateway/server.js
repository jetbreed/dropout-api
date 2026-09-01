// express-gateway/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

// ============================================
// MIDDLEWARE
// ============================================

// Security
app.use(helmet());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// RATE LIMITING
// ============================================

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: {
        error: 'Too many requests. Please try again later.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api', limiter);

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-please-change-in-production';

// Mock user database (in production, use a real database)
const users = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
    { id: 2, username: 'school', password: 'school123', role: 'school' }
];

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Verify JWT token middleware
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// ============================================
// ROUTES
// ============================================

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'Gateway running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        fastapi_url: FASTAPI_URL
    });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username, role: user.role }
    });
});

// Protected prediction endpoint
app.post('/api/predict', authenticate, async (req, res) => {
    try {
        const response = await axios.post(
            `${FASTAPI_URL}/api/v1/predict`,
            req.body,
            {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        // Log prediction
        console.log(`[${new Date().toISOString()}] Prediction for user: ${req.user.username}`);

        res.json(response.data);
    } catch (error) {
        console.error('Error calling FastAPI:', error.message);

        if (error.response) {
            // FastAPI returned an error
            res.status(error.response.status).json({
                error: error.response.data.detail || 'Prediction service error'
            });
        } else if (error.code === 'ECONNREFUSED') {
            res.status(503).json({ error: 'Prediction service unavailable' });
        } else {
            res.status(500).json({ error: 'Internal gateway error' });
        }
    }
});

// Protected health check for FastAPI (via gateway)
app.get('/api/health', authenticate, async (req, res) => {
    try {
        const response = await axios.get(`${FASTAPI_URL}/health`, { timeout: 5000 });
        res.json({
            gateway: 'healthy',
            fastapi: response.data
        });
    } catch (error) {
        res.status(503).json({
            gateway: 'healthy',
            fastapi: 'unavailable',
            error: error.message
        });
    }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Gateway error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('📦 EXPRESS.JS API GATEWAY');
    console.log('='.repeat(60));
    console.log(`✅ Gateway running on port: ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Login: POST http://localhost:${PORT}/api/auth/login`);
    console.log(`🔗 Prediction: POST http://localhost:${PORT}/api/predict`);
    console.log(`🔗 FastAPI backend: ${FASTAPI_URL}`);
    console.log('='.repeat(60));
});