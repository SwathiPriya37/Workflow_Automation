/**
 * ============================================
 * PROJECT MODEL
 * ============================================
 * 
 * MongoDB schema for projects (GitHub repositories).
 * Stores repository info and analysis settings.
 */

import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  // Project owner (reference to User)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Project name (display name)
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  
  // GitHub repository details
  github: {
    owner: {
      type: String,
      required: true
    },
    repo: {
      type: String,
      required: true
    },
    branch: {
      type: String,
      default: 'main'
    },
    webhookId: {
      type: String
    },
    webhookSecret: {
      type: String
    },
    accessToken: {
      type: String,
      select: false // Don't return in queries
    }
  },
  
  // Analysis settings
  settings: {
    autoAnalyze: {
      type: Boolean,
      default: true
    },
    analyzeOnPush: {
      type: Boolean,
      default: true
    },
    dailyReportEnabled: {
      type: Boolean,
      default: true
    },
    excludePaths: [{
      type: String
    }],
    includePaths: [{
      type: String
    }]
  },
  
  // Statistics
  stats: {
    totalCommits: { type: Number, default: 0 },
    totalAnalyses: { type: Number, default: 0 },
    lastCommitAt: { type: Date },
    lastAnalysisAt: { type: Date }
  },
  
  // Project status
  status: {
    type: String,
    enum: ['active', 'paused', 'archived'],
    default: 'active'
  }
  
}, {
  timestamps: true
});

// ============================================
// INDEXES for faster queries
// ============================================

// Compound index for finding user's projects
projectSchema.index({ user: 1, status: 1 });

// Index for webhook lookups
projectSchema.index({ 'github.owner': 1, 'github.repo': 1 });

// ============================================
// VIRTUAL PROPERTIES
// ============================================

// Full repository name (owner/repo)
projectSchema.virtual('fullRepoName').get(function() {
  return `${this.github.owner}/${this.github.repo}`;
});

// GitHub repository URL
projectSchema.virtual('repoUrl').get(function() {
  return `https://github.com/${this.github.owner}/${this.github.repo}`;
});

// Ensure virtuals are included in JSON output
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

const Project = mongoose.model('Project', projectSchema);

export default Project;
