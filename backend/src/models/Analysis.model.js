/**
 * ============================================
 * ANALYSIS MODEL
 * ============================================
 * 
 * MongoDB schema for AI analysis results.
 * Stores Gemini's analysis of code changes.
 */

import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema({
  // Reference to the commit being analyzed
  commit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commit',
    required: true
  },
  
  // Reference to the project
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  
  // AI-generated summary of changes
  summary: {
    type: String,
    required: true
  },
  
  // Detailed analysis sections
  details: {
    // What changed - high-level overview
    changesOverview: { type: String },
    
    // Technical breakdown by file/component
    technicalBreakdown: [{
      file: { type: String },
      changes: { type: String },
      impact: { type: String }
    }]
  },
  
  // Risk analysis
  riskAnalysis: {
    level: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    factors: [{
      factor: { type: String },
      description: { type: String },
      severity: { type: String }
    }]
  },
  
  // Bug probability assessment
  bugProbability: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    potentialIssues: [{
      type: { type: String },
      description: { type: String },
      location: { type: String },
      suggestion: { type: String }
    }]
  },
  
  // Suggested improvements
  improvements: [{
    category: {
      type: String,
      enum: ['performance', 'security', 'readability', 'maintainability', 'testing', 'documentation', 'accessibility', 'best-practices', 'error-handling', 'other']
    },
    suggestion: { type: String },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    codeSnippet: { type: String }
  }],
  
  // Productivity insights
  productivityInsights: {
    estimatedComplexity: {
      type: String,
      enum: ['trivial', 'simple', 'moderate', 'complex', 'very-complex']
    },
    estimatedTimeToReview: { type: Number }, // minutes
    codeQualityScore: {
      type: Number,
      min: 0,
      max: 100
    },
    comments: { type: String }
  },
  
  // Analysis metadata
  metadata: {
    modelUsed: { type: String, default: 'gemini-1.5-flash' },
    tokensUsed: { type: Number },
    processingTime: { type: Number }, // milliseconds
    analyzedAt: { type: Date, default: Date.now }
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  
  // Error info if analysis failed
  error: {
    message: { type: String },
    code: { type: String }
  }
  
}, {
  timestamps: true
});

// ============================================
// INDEXES
// ============================================

analysisSchema.index({ project: 1, createdAt: -1 });
analysisSchema.index({ commit: 1 }, { unique: true });

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get today's analyses for a project
 */
analysisSchema.statics.getTodaysAnalyses = function(projectId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  return this.find({
    project: projectId,
    createdAt: { $gte: startOfDay }
  }).populate('commit');
};

/**
 * Calculate average metrics for a project
 */
analysisSchema.statics.getProjectMetrics = async function(projectId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const analyses = await this.find({
    project: projectId,
    createdAt: { $gte: startDate },
    status: 'completed'
  });
  
  if (analyses.length === 0) {
    return null;
  }
  
  const avgRiskScore = analyses.reduce((sum, a) => sum + a.riskAnalysis.score, 0) / analyses.length;
  const avgBugProb = analyses.reduce((sum, a) => sum + a.bugProbability.score, 0) / analyses.length;
  const avgQuality = analyses.reduce((sum, a) => sum + (a.productivityInsights.codeQualityScore || 0), 0) / analyses.length;
  
  return {
    totalAnalyses: analyses.length,
    averageRiskScore: Math.round(avgRiskScore),
    averageBugProbability: Math.round(avgBugProb),
    averageCodeQuality: Math.round(avgQuality)
  };
};

const Analysis = mongoose.model('Analysis', analysisSchema);

export default Analysis;
