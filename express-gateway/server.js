// express-gateway/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const qs = require('qs');

const app = express();
const PORT = process.env.PORT || 3001;
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://fastapi-backend:8000';

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
    res.json({
        status: 'Gateway running',
        timestamp: new Date().toISOString(),
        fastapi_url: FASTAPI_URL
    });
});

// ============================================
// PROXY ALL API REQUESTS TO FASTAPI
// ============================================

app.use('/api', async (req, res) => {
    try {
        const targetUrl = `${FASTAPI_URL}/api/v1${req.path}`;
        
        console.log(`[Gateway] Proxying ${req.method} ${req.path} -> ${targetUrl}`);
        console.log(`[Gateway] Content-Type: ${req.headers['content-type']}`);
        console.log(`[Gateway] Body:`, req.body);

        // Prepare headers
        const headers = {
            'Authorization': req.headers.authorization || ''
        };

        let requestData = req.body;
        let contentType = req.headers['content-type'] || 'application/json';

        // Handle form-urlencoded for login
        if (req.path === '/auth/login' || req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
            contentType = 'application/x-www-form-urlencoded';
            // Convert body to URLSearchParams for form-urlencoded
            if (req.body && typeof req.body === 'object') {
                requestData = qs.stringify(req.body);
            }
        } else {
            contentType = 'application/json';
        }

        headers['Content-Type'] = contentType;

        console.log(`[Gateway] Forwarding with Content-Type: ${contentType}`);

        const response = await axios({
            method: req.method,
            url: targetUrl,
            data: requestData,
            headers: headers,
            timeout: 30000,
            validateStatus: () => true
        });

        console.log(`[Gateway] Response: ${response.status} for ${req.path}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error(`[Gateway] Error proxying ${req.path}:`, error.message);
        
        if (error.code === 'ECONNREFUSED') {
            res.status(503).json({ 
                detail: 'FastAPI service unavailable. Please check if it is running.'
            });
        } else {
            res.status(500).json({ 
                detail: error.response?.data?.detail || error.message || 'Gateway error'
            });
        }
    }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

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
    console.log(`🔗 Health: http://localhost:${PORT}/health`);
    console.log(`🔗 Proxying to FastAPI: ${FASTAPI_URL}`);
    console.log('='.repeat(60));
});