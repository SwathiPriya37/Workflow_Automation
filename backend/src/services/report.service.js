/**
 * ============================================
 * REPORT SERVICE
 * ============================================
 * 
 * Generates daily/weekly technical reports.
 * Aggregates analysis data into comprehensive reports.
 */

import { Report, Commit, Analysis, Project, Log } from '../models/index.js';
import { generateReportSummary } from './ai.service.js';
import { sendReportEmail } from './email.service.js';

/**
 * Generate a daily report for a project
 * @param {ObjectId} projectId - Project ID
 * @returns {Promise<Object>} Generated report
 */
export const generateDailyReport = async (projectId) => {
  try {
    const project = await Project.findById(projectId).populate('user');
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Get date range (last 24 hours)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    // Get commits in range (today first)
    let commits = await Commit.find({
      project: projectId,
      committedAt: { $gte: startDate, $lte: endDate }
    }).populate('analysis');
    
    // If no commits today, get all recent commits (last 30 days or all available)
    if (commits.length === 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      commits = await Commit.find({
        project: projectId
      }).sort({ committedAt: -1 }).limit(50).populate('analysis');
      
      // Update date range for report
      if (commits.length > 0) {
        startDate.setTime(commits[commits.length - 1].committedAt.getTime());
      }
    }
    
    // If still no commits, skip report generation
    if (commits.length === 0) {
      await Log.info('report', 'No commits found for daily report', { project: projectId });
      return null;
    }
    
    // Get analyses
    const analyses = commits
      .filter(c => c.analysis)
      .map(c => c.analysis);
    
    // Calculate statistics
    const stats = calculateStatistics(commits);
    const riskSummary = calculateRiskSummary(analyses);
    const qualityMetrics = calculateQualityMetrics(analyses);
    
    // Prepare data for AI summary generation
    const reportData = {
      project_name: project.name,
      repo: `${project.github.owner}/${project.github.repo}`,
      date_range: { start: startDate.toISOString(), end: endDate.toISOString() },
      commits: commits.map(c => ({
        sha: c.shortSha,
        message: c.message,
        author: c.author.name,
        files_changed: c.stats.filesChanged,
        additions: c.stats.totalAdditions,
        deletions: c.stats.totalDeletions
      })),
      analyses: analyses.map(a => ({
        summary: a.summary,
        risk_level: a.riskAnalysis.level,
        risk_score: a.riskAnalysis.score,
        bug_probability: a.bugProbability.score,
        improvements: a.improvements.map(i => i.suggestion)
      })),
      statistics: stats,
      risk_summary: riskSummary
    };
    
    // Generate AI summary
    let aiSummary;
    try {
      aiSummary = await generateReportSummary(reportData);
    } catch (error) {
      console.error('AI summary generation failed:', error);
      aiSummary = {
        executive_summary: generateFallbackSummary(stats, riskSummary),
        recommendations: [],
        trends: [],
        focus_areas: []
      };
    }
    
    // Create report
    const report = await Report.create({
      project: projectId,
      user: project.user._id,
      type: 'daily',
      title: `Daily Report - ${project.name}`,
      dateRange: { start: startDate, end: endDate },
      executiveSummary: aiSummary.executive_summary,
      commits: commits.map(c => c._id),
      analyses: analyses.map(a => a._id),
      statistics: stats,
      riskSummary,
      qualityMetrics,
      productivity: {
        estimatedReviewTime: analyses.reduce((sum, a) => 
          sum + (a.productivityInsights.estimatedTimeToReview || 10), 0
        ),
        highlights: aiSummary.highlights || [],
        concerns: aiSummary.concerns || []
      },
      aiInsights: {
        trends: aiSummary.trends || [],
        recommendations: aiSummary.recommendations || [],
        focusAreas: aiSummary.focus_areas || []
      },
      status: 'completed'
    });
    
    // Send email if enabled
    if (project.settings.dailyReportEnabled && project.user.emailSettings.dailyReport) {
      try {
        await sendReportEmail(report, [project.user.email]);
        report.emailDelivery = {
          sent: true,
          sentAt: new Date(),
          recipients: [project.user.email]
        };
        await report.save();
      } catch (emailError) {
        console.error('Failed to send report email:', emailError);
        report.emailDelivery = {
          sent: false,
          error: emailError.message
        };
        await report.save();
      }
    }
    
    await Log.info('report', `Daily report generated for ${project.name}`, {
      project: projectId,
      report: report._id
    });
    
    return report;
    
  } catch (error) {
    console.error('Report generation error:', error);
    await Log.error('report', `Report generation failed: ${error.message}`, {
      project: projectId
    });
    throw error;
  }
};

/**
 * Calculate statistics from commits
 */
const calculateStatistics = (commits) => {
  const contributors = {};
  
  commits.forEach(commit => {
    const author = commit.author.name || commit.author.email;
    contributors[author] = (contributors[author] || 0) + 1;
  });
  
  return {
    totalCommits: commits.length,
    totalFilesChanged: commits.reduce((sum, c) => sum + c.stats.filesChanged, 0),
    totalAdditions: commits.reduce((sum, c) => sum + c.stats.totalAdditions, 0),
    totalDeletions: commits.reduce((sum, c) => sum + c.stats.totalDeletions, 0),
    uniqueContributors: Object.keys(contributors).length,
    contributors: Object.entries(contributors).map(([name, count]) => ({ name, commits: count }))
  };
};

/**
 * Calculate risk summary from analyses
 */
const calculateRiskSummary = (analyses) => {
  if (analyses.length === 0) {
    return {
      averageRiskScore: 0,
      highRiskCommits: 0,
      criticalIssues: 0,
      topRisks: []
    };
  }
  
  const avgScore = analyses.reduce((sum, a) => sum + a.riskAnalysis.score, 0) / analyses.length;
  const highRisk = analyses.filter(a => a.riskAnalysis.level === 'high' || a.riskAnalysis.level === 'critical');
  
  // Collect all risk factors
  const allRisks = analyses.flatMap(a => a.riskAnalysis.factors || []);
  const topRisks = allRisks.slice(0, 5).map(r => ({
    description: r.description,
    severity: r.severity
  }));
  
  return {
    averageRiskScore: Math.round(avgScore),
    highRiskCommits: highRisk.length,
    criticalIssues: analyses.filter(a => a.riskAnalysis.level === 'critical').length,
    topRisks
  };
};

/**
 * Calculate quality metrics from analyses
 */
const calculateQualityMetrics = (analyses) => {
  if (analyses.length === 0) {
    return {
      averageCodeQuality: 0,
      averageBugProbability: 0,
      improvementsCount: 0,
      topImprovements: []
    };
  }
  
  const avgQuality = analyses.reduce((sum, a) => 
    sum + (a.productivityInsights.codeQualityScore || 70), 0
  ) / analyses.length;
  
  const avgBugProb = analyses.reduce((sum, a) => 
    sum + a.bugProbability.score, 0
  ) / analyses.length;
  
  // Collect improvements
  const allImprovements = analyses.flatMap(a => a.improvements || []);
  const topImprovements = allImprovements.slice(0, 5).map(i => ({
    suggestion: i.suggestion,
    category: i.category
  }));
  
  return {
    averageCodeQuality: Math.round(avgQuality),
    averageBugProbability: Math.round(avgBugProb),
    improvementsCount: allImprovements.length,
    topImprovements
  };
};

/**
 * Generate fallback summary when AI is unavailable
 */
const generateFallbackSummary = (stats, riskSummary) => {
  return `Today's activity: ${stats.totalCommits} commits from ${stats.uniqueContributors} contributor(s). ` +
    `${stats.totalFilesChanged} files changed with +${stats.totalAdditions}/-${stats.totalDeletions} lines. ` +
    `Average risk score: ${riskSummary.averageRiskScore}/100. ` +
    `${riskSummary.highRiskCommits > 0 ? `⚠️ ${riskSummary.highRiskCommits} high-risk commit(s) detected.` : 'No high-risk changes detected.'}`;
};

/**
 * Get reports for a user
 */
export const getUserReports = async (userId, options = {}) => {
  const { page = 1, limit = 10, type, projectId } = options;
  
  const query = { user: userId };
  if (type) query.type = type;
  if (projectId) query.project = projectId;
  
  const reports = await Report.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('project', 'name github.owner github.repo');
  
  const total = await Report.countDocuments(query);
  
  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export default {
  generateDailyReport,
  getUserReports
};
