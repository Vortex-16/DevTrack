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
const taskRoutes = require('./routes/taskRoutes');
const bookmarksRoutes = require('./routes/bookmarksRoutes');
const projectIdeasRoutes = require('./routes/projectIdeasRoutes');
const savedIdeasRoutes = require('./routes/savedIdeasRoutes');
const showcaseRoutes = require('./routes/showcaseRoutes');
const readmeRoutes = require('./routes/readmeRoutes');
const leetCodeRoutes = require('./routes/leetCodeRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust proxy for Render and other reverse proxies
// Required for express-rate-limit to work correctly
app.set('trust proxy', 1);

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

// CORS Configuration - Support multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CORS_ORIGIN,
  'https://devtrack-pwkj.onrender.com',
  'https://devtrack.onrender.com',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow anyway for now, log for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
app.use('/api/tasks', taskRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/project-ideas', projectIdeasRoutes);
app.use('/api/saved-ideas', savedIdeasRoutes);
app.use('/api/showcase', showcaseRoutes);
app.use('/api/readme', readmeRoutes);
app.use('/api/leetcode', leetCodeRoutes);
app.use('/api/challenges', require('./routes/challengeRoutes'));

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
