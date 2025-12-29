/**
 * ============================================
 * AI SERVICE
 * ============================================
 * 
 * Communicates with the Python AI microservice.
 * Sends code diffs for analysis using Gemini.
 */

import axios from 'axios';
import { Analysis, Commit, Log } from '../models/index.js';

// Python AI service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Analyze a commit using the AI service
 * @param {Object} commit - Commit document from MongoDB
 * @returns {Promise<Object>} Analysis result
 */
export const analyzeCommit = async (commit) => {
  const startTime = Date.now();
  
  try {
    // Log the analysis start
    await Log.info('analysis', `Starting analysis for commit ${commit.shortSha}`, {
      commit: commit._id,
      project: commit.project
    });
    
    // Prepare the diff data for the AI service
    const diffData = {
      commit_sha: commit.sha,
      commit_message: commit.message,
      author: commit.author,
      files: commit.files.map(f => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch || ''
      })),
      stats: commit.stats
    };
    
    // Send to Python AI service
    const response = await axios.post(`${AI_SERVICE_URL}/analyze`, diffData, {
      timeout: 60000, // 60 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const analysisResult = response.data;
    const processingTime = Date.now() - startTime;
    
    // Create analysis document
    const analysis = await Analysis.create({
      commit: commit._id,
      project: commit.project,
      summary: analysisResult.summary,
      details: {
        changesOverview: analysisResult.changes_overview,
        technicalBreakdown: analysisResult.technical_breakdown
      },
      riskAnalysis: {
        level: analysisResult.risk_analysis?.level || 'low',
        score: analysisResult.risk_analysis?.score || 0,
        factors: analysisResult.risk_analysis?.factors || []
      },
      bugProbability: {
        score: analysisResult.bug_probability?.score || 0,
        potentialIssues: analysisResult.bug_probability?.issues || []
      },
      improvements: analysisResult.improvements || [],
      productivityInsights: {
        estimatedComplexity: analysisResult.productivity?.complexity || 'moderate',
        estimatedTimeToReview: analysisResult.productivity?.review_time || 10,
        codeQualityScore: analysisResult.productivity?.quality_score || 70,
        comments: analysisResult.productivity?.comments || ''
      },
      metadata: {
        modelUsed: analysisResult.model_used || 'gemini-1.5-flash',
        tokensUsed: analysisResult.tokens_used || 0,
        processingTime,
        analyzedAt: new Date()
      },
      status: 'completed'
    });
    
    // Update commit with analysis reference
    await Commit.findByIdAndUpdate(commit._id, {
      analysis: analysis._id,
      analysisStatus: 'completed'
    });
    
    // Log success
    await Log.info('analysis', `Analysis completed for commit ${commit.shortSha}`, {
      commit: commit._id,
      analysis: analysis._id
    }, { processingTime });
    
    return analysis;
    
  } catch (error) {
    console.error('AI Analysis error:', error.message);
    
    // Update commit status
    await Commit.findByIdAndUpdate(commit._id, {
      analysisStatus: 'failed'
    });
    
    // Log error
    await Log.error('analysis', `Analysis failed for commit ${commit.shortSha}: ${error.message}`, {
      commit: commit._id
    });
    
    throw error;
  }
};

/**
 * Analyze multiple commits
 * @param {Array} commits - Array of commit documents
 * @returns {Promise<Array>} Array of analysis results
 */
export const analyzeMultipleCommits = async (commits) => {
  const results = [];
  
  for (const commit of commits) {
    try {
      const analysis = await analyzeCommit(commit);
      results.push({ commit: commit._id, analysis, success: true });
    } catch (error) {
      results.push({ commit: commit._id, error: error.message, success: false });
    }
  }
  
  return results;
};

/**
 * Generate a daily report summary using AI
 * @param {Object} data - Aggregated data for the report
 * @returns {Promise<Object>} Report content
 */
export const generateReportSummary = async (data) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/generate-report`, data, {
      timeout: 120000, // 2 minute timeout for report generation
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
    
  } catch (error) {
    console.error('Report generation error:', error.message);
    throw error;
  }
};

/**
 * Check AI service health
 * @returns {Promise<boolean>} True if service is healthy
 */
export const checkHealth = async () => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000
    });
    return response.data.status === 'healthy';
  } catch (error) {
    return false;
  }
};

export default {
  analyzeCommit,
  analyzeMultipleCommits,
  generateReportSummary,
  checkHealth
};
