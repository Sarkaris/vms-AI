const express = require('express');
const cors = require('cors');
const path = require('path');
// const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { ensureSchema } = require('./utils/db');
const { demoModeMiddleware, demoDataMiddleware, getDemoStatus, DEMO_MODE } = require('./middleware/demoMode');
const { initDemoDatabase } = require('./utils/demoDatabase');

const app = express();
const server = http.createServer(app);
// CORS configuration - supports both development and production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : (process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'http://localhost:3000']
      : ["http://localhost:3000", "http://localhost:3001"]);

const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  transports: ["websocket", "polling"],
  allowEIO3: true
});

// Make io accessible to routes
app.set('io', io);

// Trust proxy - Fix for X-Forwarded-For header issue
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    const allowed = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : (process.env.NODE_ENV === 'production' 
          ? [process.env.FRONTEND_URL || process.env.DOMAIN || '*']
          : ['http://localhost:3000', 'http://localhost:3001']);
    
    if (allowed.indexOf(origin) !== -1 || allowed.includes('*') || process.env.NODE_ENV !== 'production') {
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

// Demo mode middleware - must be after body parsing but before routes
app.use(demoModeMiddleware);
app.use(demoDataMiddleware);

// Rate limiting - Removed for demo purposes
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100 // limit each IP to 100 requests per windowMs
// });
// app.use(limiter);

// Initialize database based on mode
if (process.env.DEMO_DATABASE === 'sqlite') {
  // Use SQLite for demo mode (no MySQL required)
  initDemoDatabase().then(() => {
    console.log('✅ Demo SQLite database initialized');
  }).catch((err) => {
    console.error('❌ Demo database init error:', err);
  });
} else {
  // Use MySQL for production mode
  ensureSchema().then(() => {
    console.log('✅ MySQL schema ensured');
  }).catch((err) => {
    console.error('❌ MySQL schema init error:', err);
  });
}

// Graceful shutdown - Enhanced for demo stability
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  try {
    // Close server
    // Close server
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
    
    // Force exit after 5 seconds if graceful shutdown fails
    setTimeout(() => {
      console.log('⚠️ Force exiting...');
      process.exit(1);
    }, 5000);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Handle other termination signals
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  try {
    server.close(() => {
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during SIGTERM shutdown:', error);
    process.exit(1);
  }
});

// API Routes
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/emergencies', require('./routes/emergencies'));

// Demo status endpoint - must be before 404 handler
app.get('/api/demo-status', getDemoStatus);

// Health check endpoint with memory monitoring
app.get('/api/health', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    demoMode: DEMO_MODE,
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
    },
    uptime: Math.round(process.uptime()) + ' seconds'
  });
});

// Error handling middleware
app.use(require('./middleware/errorHandler'));

// API 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API route not found'
  });
});

// Serve static files from React build (only if build exists)
const buildPath = path.join(__dirname, '../client/build');
if (require('fs').existsSync(buildPath)) {
  app.use(express.static(buildPath));
  
  // React app catch-all handler
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });
  
  socket.on('visitor-checkin', (data) => {
    io.emit('visitor-update', data);
  });
  
  socket.on('visitor-checkout', (data) => {
    io.emit('visitor-update', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Memory monitoring and cleanup
setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  // Log memory usage every 5 minutes
  console.log(`📊 Memory Usage: ${heapUsedMB} MB`);
  
  // Force garbage collection if memory usage is high
  if (heapUsedMB > 200 && global.gc) {
    console.log('🧹 Running garbage collection...');
    global.gc();
  }
}, 5 * 60 * 1000); // Every 5 minutes

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 VMS Server running on port ${PORT}`);
});