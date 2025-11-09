// Vercel Serverless Function - Main API Handler
// This wraps the Express app for Vercel deployment

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import routes
const authRoutes = require('../server/routes/auth');
const visitorRoutes = require('../server/routes/visitors');
const analyticsRoutes = require('../server/routes/analytics');
const adminRoutes = require('../server/routes/admin');
const emergencyRoutes = require('../server/routes/emergencies');

// Handle route exports (some export router, some export directly)
const getRouter = (routeModule) => {
  return routeModule.router || routeModule.default || routeModule;
};
const { demoModeMiddleware, demoDataMiddleware, getDemoStatus } = require('../server/middleware/demoMode');
const { ensureSchema } = require('../server/utils/db');
const { initDemoDatabase } = require('../server/utils/demoDatabase');

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false
}));

// CORS configuration for Vercel
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : (process.env.VERCEL_URL 
          ? [`https://${process.env.VERCEL_URL}`, `https://${process.env.VERCEL_URL.replace('https://', '')}`]
          : ['*']);
    
    if (allowed.includes('*') || allowed.some(allowedOrigin => origin.includes(allowedOrigin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Demo mode middleware
app.use(demoModeMiddleware);
app.use(demoDataMiddleware);

// Initialize database (only on first request)
let dbInitialized = false;
const initDatabase = async () => {
  if (dbInitialized) return;
  
  try {
    // Check for Turso (SQLite Cloud) - Best for Vercel
    if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
      await initDemoDatabase(); // Uses Turso via databaseWrapper
      console.log('✅ Turso (SQLite Cloud) database initialized');
    } else if (process.env.DEMO_DATABASE === 'sqlite') {
      await initDemoDatabase();
      console.log('✅ Demo SQLite database initialized');
    } else if (process.env.DB_HOST || process.env.MYSQL_URI || process.env.DATABASE_URL) {
      await ensureSchema();
      console.log('✅ MySQL schema ensured');
    } else {
      // Fallback to SQLite
      await initDemoDatabase();
      console.log('✅ SQLite database initialized (fallback)');
    }
    dbInitialized = true;
  } catch (err) {
    console.error('❌ Database init error:', err);
  }
};

// API Routes
app.use('/api/auth', getRouter(authRoutes));
app.use('/api/visitors', getRouter(visitorRoutes));
app.use('/api/analytics', getRouter(analyticsRoutes));
app.use('/api/admin', getRouter(adminRoutes));
app.use('/api/emergencies', getRouter(emergencyRoutes));

// Demo status endpoint
app.get('/api/demo-status', getDemoStatus);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  await initDatabase();
  const memUsage = process.memoryUsage();
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    demoMode: process.env.DEMO_MODE === 'true',
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB'
    },
    platform: 'vercel'
  });
});

// Error handling middleware
app.use(require('../server/middleware/errorHandler'));

// API 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API route not found'
  });
});

// Vercel serverless function handler
module.exports = async (req, res) => {
  // Initialize database on first request
  await initDatabase();
  
  // Handle the request
  return app(req, res);
};

