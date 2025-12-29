/**
 * ============================================
 * COMMIT MODEL
 * ============================================
 * 
 * MongoDB schema for tracking GitHub commits.
 * Stores commit details and links to analysis.
 */

import mongoose from 'mongoose';

const commitSchema = new mongoose.Schema({
  // Reference to the project
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  
  // GitHub commit details
  sha: {
    type: String,
    required: true,
    index: true
  },
  
  shortSha: {
    type: String,
    required: true
  },
  
  message: {
    type: String,
    required: true
  },
  
  // Commit author info
  author: {
    name: { type: String },
    email: { type: String },
    username: { type: String },
    avatarUrl: { type: String }
  },
  
  // Commit timestamp from GitHub
  committedAt: {
    type: Date,
    required: true
  },
  
  // Files changed in this commit
  files: [{
    filename: { type: String },
    status: { 
      type: String,
      enum: ['added', 'removed', 'modified', 'renamed']
    },
    additions: { type: Number, default: 0 },
    deletions: { type: Number, default: 0 },
    patch: { type: String } // The diff/patch content
  }],
  
  // Summary statistics
  stats: {
    totalAdditions: { type: Number, default: 0 },
    totalDeletions: { type: Number, default: 0 },
    filesChanged: { type: Number, default: 0 }
  },
  
  // GitHub URLs
  url: {
    type: String
  },
  
  compareUrl: {
    type: String
  },
  
  // Analysis status
  analysisStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  
  // Reference to analysis result
  analysis: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analysis'
  }
  
}, {
  timestamps: true
});

// ============================================
// INDEXES
// ============================================

// Index for finding commits by project
commitSchema.index({ project: 1, committedAt: -1 });

// Unique index for commit SHA within a project
commitSchema.index({ project: 1, sha: 1 }, { unique: true });

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get recent commits for a project
 * @param {ObjectId} projectId 
 * @param {Number} limit 
 * @returns {Promise<Array>}
 */
commitSchema.statics.getRecentCommits = function(projectId, limit = 10) {
  return this.find({ project: projectId })
    .sort({ committedAt: -1 })
    .limit(limit)
    .populate('analysis');
};

/**
 * Get commits within a date range
 * @param {ObjectId} projectId 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Promise<Array>}
 */
commitSchema.statics.getCommitsInRange = function(projectId, startDate, endDate) {
  return this.find({
    project: projectId,
    committedAt: { $gte: startDate, $lte: endDate }
  }).sort({ committedAt: -1 });
};

const Commit = mongoose.model('Commit', commitSchema);

export default Commit;
