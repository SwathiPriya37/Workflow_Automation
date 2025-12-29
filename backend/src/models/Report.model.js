/**
 * ============================================
 * REPORT MODEL
 * ============================================
 * 
 * MongoDB schema for daily/weekly technical reports.
 * Aggregates analysis data into comprehensive reports.
 */

import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  // Reference to the project
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  
  // Reference to the user
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Report type
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    default: 'daily'
  },
  
  // Report title
  title: {
    type: String,
    required: true
  },
  
  // Date range covered
  dateRange: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  
  // Executive summary
  executiveSummary: {
    type: String,
    required: true
  },
  
  // Commits included in this report
  commits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commit'
  }],
  
  // Analyses included
  analyses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analysis'
  }],
  
  // Aggregated statistics
  statistics: {
    totalCommits: { type: Number, default: 0 },
    totalFilesChanged: { type: Number, default: 0 },
    totalAdditions: { type: Number, default: 0 },
    totalDeletions: { type: Number, default: 0 },
    uniqueContributors: { type: Number, default: 0 },
    contributors: [{ 
      name: { type: String },
      commits: { type: Number }
    }]
  },
  
  // Risk summary
  riskSummary: {
    averageRiskScore: { type: Number, default: 0 },
    highRiskCommits: { type: Number, default: 0 },
    criticalIssues: { type: Number, default: 0 },
    topRisks: [{
      description: { type: String },
      severity: { type: String }
    }]
  },
  
  // Quality metrics
  qualityMetrics: {
    averageCodeQuality: { type: Number, default: 0 },
    averageBugProbability: { type: Number, default: 0 },
    improvementsCount: { type: Number, default: 0 },
    topImprovements: [{
      suggestion: { type: String },
      category: { type: String }
    }]
  },
  
  // Productivity insights
  productivity: {
    averageComplexity: { type: String },
    estimatedReviewTime: { type: Number }, // total minutes
    highlights: [{ type: String }],
    concerns: [{ type: String }]
  },
  
  // Detailed sections (for full report)
  sections: [{
    title: { type: String },
    content: { type: String },
    order: { type: Number }
  }],
  
  // AI-generated insights and recommendations
  aiInsights: {
    trends: [{ type: String }],
    recommendations: [{ type: String }],
    focusAreas: [{ type: String }]
  },
  
  // Email delivery status
  emailDelivery: {
    sent: { type: Boolean, default: false },
    sentAt: { type: Date },
    recipients: [{ type: String }],
    error: { type: String }
  },
  
  // Report status
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating'
  }
  
}, {
  timestamps: true
});

// ============================================
// INDEXES
// ============================================

reportSchema.index({ project: 1, createdAt: -1 });
reportSchema.index({ user: 1, type: 1 });
reportSchema.index({ 'dateRange.start': 1, 'dateRange.end': 1 });

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get today's report for a project
 */
reportSchema.statics.getTodaysReport = function(projectId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  return this.findOne({
    project: projectId,
    type: 'daily',
    'dateRange.start': { $gte: startOfDay }
  }).populate('commits analyses');
};

/**
 * Get reports for a project within a date range
 */
reportSchema.statics.getReportsInRange = function(projectId, startDate, endDate) {
  return this.find({
    project: projectId,
    'dateRange.start': { $gte: startDate },
    'dateRange.end': { $lte: endDate }
  }).sort({ createdAt: -1 });
};

const Report = mongoose.model('Report', reportSchema);

export default Report;
