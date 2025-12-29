/**
 * ============================================
 * LOG MODEL
 * ============================================
 * 
 * MongoDB schema for system logs.
 * Tracks all system activities for monitoring.
 */

import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  // Log level
  level: {
    type: String,
    enum: ['info', 'warning', 'error', 'debug'],
    default: 'info'
  },
  
  // Category of the log
  category: {
    type: String,
    enum: ['auth', 'webhook', 'analysis', 'report', 'email', 'system', 'api', 'sync'],
    required: true
  },
  
  // Log message
  message: {
    type: String,
    required: true
  },
  
  // Associated entities
  references: {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    commit: { type: mongoose.Schema.Types.ObjectId, ref: 'Commit' },
    analysis: { type: mongoose.Schema.Types.ObjectId, ref: 'Analysis' },
    report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' }
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // IP address (for API logs)
  ip: {
    type: String
  },
  
  // User agent
  userAgent: {
    type: String
  }
  
}, {
  timestamps: true
});

// ============================================
// INDEXES
// ============================================

logSchema.index({ createdAt: -1 });
logSchema.index({ level: 1, category: 1 });
logSchema.index({ 'references.project': 1 });

// Auto-delete logs older than 30 days
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// ============================================
// STATIC METHODS
// ============================================

/**
 * Create a log entry
 */
logSchema.statics.log = function(level, category, message, references = {}, metadata = {}) {
  return this.create({
    level,
    category,
    message,
    references,
    metadata
  });
};

/**
 * Quick log methods
 */
logSchema.statics.info = function(category, message, refs, meta) {
  return this.log('info', category, message, refs, meta);
};

logSchema.statics.warn = function(category, message, refs, meta) {
  return this.log('warning', category, message, refs, meta);
};

logSchema.statics.error = function(category, message, refs, meta) {
  return this.log('error', category, message, refs, meta);
};

const Log = mongoose.model('Log', logSchema);

export default Log;
