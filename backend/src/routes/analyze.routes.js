/**
 * ============================================
 * ANALYZE ROUTES
 * ============================================
 * 
 * Handles AI analysis operations.
 */

import express from 'express';
import { Project, Commit, Analysis, Log } from '../models/index.js';
import { protect } from '../middleware/auth.middleware.js';
import { analyzeCommit, analyzeMultipleCommits, checkHealth } from '../services/ai.service.js';

const router = express.Router();

/**
 * @route   POST /api/analyze/commit/:commitId
 * @desc    Analyze a specific commit
 * @access  Private
 */
router.post('/commit/:commitId', protect, async (req, res) => {
  try {
    const { commitId } = req.params;
    
    // Find commit and verify ownership
    const commit = await Commit.findById(commitId).populate('project');
    
    if (!commit) {
      return res.status(404).json({ error: 'Commit not found' });
    }
    
    // Verify user owns the project
    if (commit.project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Check if already analyzed
    if (commit.analysis) {
      const analysis = await Analysis.findById(commit.analysis);
      return res.json({
        message: 'Commit already analyzed',
        analysis
      });
    }
    
    // Run analysis
    const analysis = await analyzeCommit(commit);
    
    res.json({
      message: 'Analysis completed',
      analysis
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/analyze/project/:projectId
 * @desc    Analyze all pending commits for a project
 * @access  Private
 */
router.post('/project/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 10 } = req.body;
    
    // Find project and verify ownership
    const project = await Project.findOne({
      _id: projectId,
      user: req.user._id
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Find pending commits
    const pendingCommits = await Commit.find({
      project: projectId,
      analysisStatus: 'pending'
    }).limit(parseInt(limit));
    
    if (pendingCommits.length === 0) {
      return res.json({
        message: 'No pending commits to analyze',
        analyzed: 0
      });
    }
    
    // Update status to processing
    await Commit.updateMany(
      { _id: { $in: pendingCommits.map(c => c._id) } },
      { analysisStatus: 'processing' }
    );
    
    // Run analyses
    const results = await analyzeMultipleCommits(pendingCommits);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    // Update project stats
    project.stats.totalAnalyses += successCount;
    project.stats.lastAnalysisAt = new Date();
    await project.save();
    
    res.json({
      message: 'Batch analysis completed',
      analyzed: successCount,
      failed: failCount,
      results
    });
    
  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      error: 'Batch analysis failed',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/analyze/:analysisId
 * @desc    Get analysis details
 * @access  Private
 */
router.get('/:analysisId', protect, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.analysisId)
      .populate('commit')
      .populate('project');
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    // Verify ownership
    if (analysis.project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    res.json({ analysis });
    
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      error: 'Failed to get analysis',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/analyze/project/:projectId/recent
 * @desc    Get recent analyses for a project
 * @access  Private
 */
router.get('/project/:projectId/recent', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Verify project ownership
    const project = await Project.findOne({
      _id: req.params.projectId,
      user: req.user._id
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const analyses = await Analysis.find({ project: project._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('commit', 'shortSha message author committedAt');
    
    res.json({
      count: analyses.length,
      analyses: analyses.map(a => ({
        id: a._id,
        commit: {
          sha: a.commit.shortSha,
          message: a.commit.message,
          author: a.commit.author.name,
          date: a.commit.committedAt
        },
        summary: a.summary,
        riskAnalysis: a.riskAnalysis,
        bugProbability: a.bugProbability,
        improvements: a.improvements.length,
        status: a.status,
        analyzedAt: a.metadata.analyzedAt
      }))
    });
    
  } catch (error) {
    console.error('Get recent analyses error:', error);
    res.status(500).json({
      error: 'Failed to get analyses',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/analyze/health
 * @desc    Check AI service health
 * @access  Private
 */
router.get('/health/status', protect, async (req, res) => {
  try {
    const isHealthy = await checkHealth();
    
    res.json({
      aiService: isHealthy ? 'healthy' : 'unavailable',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.json({
      aiService: 'unavailable',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
