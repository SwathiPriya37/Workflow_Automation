/**
 * ============================================
 * REPORT ROUTES
 * ============================================
 * 
 * Handles report viewing and generation.
 */

import express from 'express';
import { Report, Project, Log } from '../models/index.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateReportId } from '../middleware/validation.middleware.js';
import { generateDailyReport, getUserReports } from '../services/report.service.js';

const router = express.Router();

/**
 * @route   GET /api/reports
 * @desc    Get all reports for current user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, projectId } = req.query;
    
    const result = await getUserReports(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      projectId
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      error: 'Failed to get reports',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/reports/stats/summary
 * @desc    Get summary statistics for all reports
 * @access  Private
 */
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const reports = await Report.find({
      user: req.user._id,
      createdAt: { $gte: startDate }
    });
    
    // Calculate aggregate stats
    const totalReports = reports.length;
    const totalCommits = reports.reduce((sum, r) => sum + (r.statistics?.totalCommits || 0), 0);
    const avgRiskScore = reports.length > 0
      ? reports.reduce((sum, r) => sum + (r.riskSummary?.averageRiskScore || 0), 0) / reports.length
      : 0;
    const avgQuality = reports.length > 0
      ? reports.reduce((sum, r) => sum + (r.qualityMetrics?.averageCodeQuality || 0), 0) / reports.length
      : 0;
    
    // Get reports by day for chart
    const reportsByDay = reports.reduce((acc, r) => {
      const date = r.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { commits: 0, riskScore: 0, count: 0 };
      }
      acc[date].commits += (r.statistics?.totalCommits || 0);
      acc[date].riskScore += (r.riskSummary?.averageRiskScore || 0);
      acc[date].count += 1;
      return acc;
    }, {});
    
    const chartData = Object.entries(reportsByDay).map(([date, data]) => ({
      date,
      commits: data.commits,
      avgRiskScore: Math.round(data.riskScore / data.count)
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    res.json({
      summary: {
        totalReports,
        totalCommits,
        averageRiskScore: Math.round(avgRiskScore),
        averageCodeQuality: Math.round(avgQuality)
      },
      chartData
    });
    
  } catch (error) {
    console.error('Get report stats error:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/reports/today
 * @desc    Get today's report for a project
 * @access  Private
 */
router.get('/today', protect, async (req, res) => {
  try {
    const { projectId } = req.query;
    
    if (!projectId) {
      return res.status(400).json({
        error: 'Project ID required',
        message: 'Please specify a project ID'
      });
    }
    
    // Verify project ownership
    const project = await Project.findOne({
      _id: projectId,
      user: req.user._id
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const report = await Report.getTodaysReport(projectId);
    
    if (!report) {
      return res.json({
        message: 'No report generated for today yet',
        report: null
      });
    }
    
    res.json({ report });
    
  } catch (error) {
    console.error('Get today report error:', error);
    res.status(500).json({
      error: 'Failed to get report',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/reports/:id
 * @desc    Get a specific report
 * @access  Private
 */
router.get('/:id', protect, validateReportId, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('project', 'name github.owner github.repo')
      .populate('commits', 'shortSha message author committedAt stats')
      .populate('analyses', 'summary riskAnalysis bugProbability');
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ report });
    
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      error: 'Failed to get report',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/reports/generate
 * @desc    Manually generate a daily report
 * @access  Private
 */
router.post('/generate', protect, async (req, res) => {
  try {
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({
        error: 'Project ID required'
      });
    }
    
    // Verify project ownership
    const project = await Project.findOne({
      _id: projectId,
      user: req.user._id
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    await Log.info('report', `Manual report generation triggered`, {
      user: req.user._id,
      project: projectId
    });
    
    const report = await generateDailyReport(projectId);
    
    if (!report) {
      return res.json({
        message: 'No commits found for report generation',
        report: null
      });
    }
    
    res.json({
      message: 'Report generated successfully',
      report
    });
    
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      error: 'Failed to generate report',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/reports/:id
 * @desc    Get a specific report
 * @access  Private
 */
router.get('/:id', protect, validateReportId, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('project', 'name github.owner github.repo')
      .populate('commits', 'shortSha message author committedAt stats')
      .populate('analyses', 'summary riskAnalysis bugProbability');
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ report });
    
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      error: 'Failed to get report',
      message: error.message
    });
  }
});

export default router;
