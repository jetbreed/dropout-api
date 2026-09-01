// express-gateway/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://fastapi-backend:8000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@postgres:5432/dropout_db',
});

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(morgan('combined'));
app.use(express.json());

// ============================================
// RATE LIMITING
// ============================================

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: 'Too many requests. Please try again later.' }
});
app.use('/api', limiter);

// ============================================
// AUTHENTICATION
// ============================================

const authenticate = async (req, res, next) => {
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

// Login - checks against PostgreSQL
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        // In production, compare hashed password
        // For demo, accept admin/admin123
        if (username === 'admin' && password === 'admin123') {
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            return res.json({
                message: 'Login successful',
                token,
                user: { id: user.id, username: user.username, role: user.role }
            });
        }

        res.status(401).json({ error: 'Invalid credentials' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// ============================================
// PROXY ROUTES
// ============================================

app.post('/api/predict', authenticate, async (req, res) => {
    try {
        const response = await axios.post(
            `${FASTAPI_URL}/api/v1/predict?user_id=${req.user.id}`,
            req.body,
            { timeout: 10000 }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Prediction error:', error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.detail || 'Prediction service error'
        });
    }
});

app.get('/api/history', authenticate, async (req, res) => {
    try {
        const response = await axios.get(
            `${FASTAPI_URL}/api/v1/history?user_id=${req.user.id}&limit=100`,
            { timeout: 5000 }
        );
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.detail || 'History service error'
        });
    }
});

app.get('/api/stats', authenticate, async (req, res) => {
    try {
        const response = await axios.get(
            `${FASTAPI_URL}/api/v1/stats?user_id=${req.user.id}`,
            { timeout: 5000 }
        );
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.detail || 'Stats service error'
        });
    }
});

app.delete('/api/history/:id', authenticate, async (req, res) => {
    try {
        const response = await axios.delete(
            `${FASTAPI_URL}/api/v1/history/${req.params.id}?user_id=${req.user.id}`,
            { timeout: 5000 }
        );
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.detail || 'Delete service error'
        });
    }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'Gateway running', db: 'connected' });
    } catch (error) {
        res.status(503).json({ status: 'Gateway running', db: 'disconnected' });
    }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('📦 EXPRESS.JS API GATEWAY');
    console.log('='.repeat(60));
    console.log(`✅ Gateway running on port: ${PORT}`);
    console.log(`🔗 FastAPI: ${FASTAPI_URL}`);
    console.log('='.repeat(60));
});