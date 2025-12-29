/**
 * ============================================
 * MAIN ENTRY POINT - Node.js Backend Server
 * ============================================
 * 
 * This file initializes and starts the Express server.
 * It connects to MongoDB, sets up middleware, and mounts all routes.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import routes
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import githubRoutes from './routes/github.routes.js';
import analyzeRoutes from './routes/analyze.routes.js';
import reportRoutes from './routes/report.routes.js';
import emailRoutes from './routes/email.routes.js';
import logRoutes from './routes/log.routes.js';

// Import cron jobs
import { initCronJobs } from './services/cron.service.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// ============================================
// MIDDLEWARE SETUP
// ============================================

// CORS - Allow frontend to make requests
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Parse JSON bodies (for API requests)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (simple logger)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// API ROUTES
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'workflow-automation-backend'
  });
});

// Mount route modules
app.use('/api/auth', authRoutes);       // Authentication routes
app.use('/api/projects', projectRoutes); // Project management
app.use('/api/github', githubRoutes);    // GitHub webhook handling
app.use('/api/analyze', analyzeRoutes);  // AI analysis triggers
app.use('/api/reports', reportRoutes);   // Report management
app.use('/api/email', emailRoutes);      // Email automation
app.use('/api/logs', logRoutes);         // System logs

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler - Route not found
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow_automation')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Initialize cron jobs for scheduled tasks
    initCronJobs();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

export default app;
