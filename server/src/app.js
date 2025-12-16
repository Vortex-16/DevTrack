/**
 * DevTrack Server - Main Application
 * Express app with security middleware stack
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/authRoutes');
const githubRoutes = require('./routes/githubRoutes');
const geminiRoutes = require('./routes/geminiRoutes');
const logsRoutes = require('./routes/logsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const projectRoutes = require('./routes/projectRoutes');
const preferencesRoutes = require('./routes/preferencesRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ======================
// SECURITY MIDDLEWARE
// ======================

// Helmet - Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting - 500 requests per 15 minutes (increased for dev with React StrictMode)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Limit each IP to 2000 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development', // Skip rate limit in dev
});
app.use('/api/', limiter);

// Stricter rate limit for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 AI requests per 15 minutes
  message: {
    success: false,
    error: 'AI rate limit exceeded. Please wait before making more requests.',
  },
  skip: (req) => process.env.NODE_ENV === 'development', // Skip rate limit in dev
});
app.use('/api/gemini/', aiLimiter);

// ======================
// BODY PARSING
// ======================
app.use(express.json({ limit: '5mb' })); // Increased for large GitHub repo data
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ======================
// LOGGING
// ======================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ======================
// HEALTH CHECK
// ======================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DevTrack API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ======================
// API ROUTES
// ======================
app.use('/api/auth', authRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/preferences', preferencesRoutes);

// ======================
// 404 HANDLER
// ======================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// ======================
// ERROR HANDLER
// ======================
app.use(errorHandler);

module.exports = app;
