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
const publicRoutes = require('./routes/publicRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const goalRoutes = require('./routes/goalRoutes');
const socialRoutes = require('./routes/socialRoutes');
const reportRoutes = require('./routes/reportRoutes');
const insightsRoutes = require('./routes/insightsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Import middleware & controllers
const errorHandler = require('./middleware/errorHandler');
const modernApiUI = require('./middleware/modernApiUI');
const correlationId = require('./middleware/correlationId');
const { sanitizeRequest } = require('./middleware/sanitize');
const paymentController = require('./controllers/paymentController');

const app = express();

// Trust proxy for Render and other reverse proxies
// Required for express-rate-limit to work correctly behind Render's load balancer
app.set('trust proxy', 1);

// Attach unique request ID for log & response tracing
app.use(correlationId);

// Mount Modern UI Middleware early so it captures JSON responses for all subsequent handlers
app.use(modernApiUI);

// ======================
// SECURITY MIDDLEWARE
// ======================

// Helmet — Security headers (tightened CSP — no unsafe-inline on scripts)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],      // needed for modernApiUI inline styles
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS Configuration — strict allowlist (no wildcard in production)
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://devtrackweb.xyz',
  'https://www.devtrackweb.xyz',
  'https://devtrak-pwkj.onrender.com',
  'https://devtrack.onrender.com',
  process.env.CORS_ORIGIN,
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // In development: warn but allow unknown origins for easier local debugging
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[CORS] Unknown origin in dev (allowed): ${origin}`);
      return callback(null, true);
    }

    // In production: reject unauthorized origins
    console.warn(`[CORS] Blocked unauthorized origin: ${origin}`);
    return callback(new Error(`CORS policy: origin '${origin}' is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
}));

// ======================
// RATE LIMITING
// ======================

// General API — 2000 req/15min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
});
app.use('/api/', limiter);

// AI endpoints — 100 req/15min (expensive Groq/Gemini calls)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'AI rate limit exceeded. Please wait before making more requests.' },
  skip: (req) => process.env.NODE_ENV === 'development',
});
app.use('/api/gemini/', aiLimiter);
app.use('/api/insights/', aiLimiter);

// Auth sync/renew — 120 req/15min (prevent token-refresh abuse)
const authSyncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: { success: false, error: 'Too many authentication sync requests. Please wait and try again.' },
  skip: (req) => process.env.NODE_ENV === 'development',
});
app.use('/api/auth/sync', authSyncLimiter);
app.use('/api/auth/renew-github-access', authSyncLimiter);

// GitHub expensive operations — 240 req/15min
const githubLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 240,
  message: { success: false, error: 'GitHub API rate limit reached for this session. Please retry shortly.' },
  skip: (req) => process.env.NODE_ENV === 'development',
});
app.use('/api/github/repo', githubLimiter);
app.use('/api/github/repos', githubLimiter);

// ======================
// STRIPE WEBHOOK (Must be before express.json parsing)
// ======================
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// ======================
// BODY PARSING
// ======================
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ======================
// INPUT SANITIZATION
// ======================
// Strips XSS payloads and dangerous HTML from all incoming request body/query/params
app.use(sanitizeRequest);

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
    version: process.env.npm_package_version || '1.0.0',
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
app.use('/api/public', publicRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/payments', paymentRoutes);

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
