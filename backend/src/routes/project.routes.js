/**
 * ============================================
 * PROJECT ROUTES
 * ============================================
 * 
 * Manages GitHub projects/repositories.
 */

import express from 'express';
import crypto from 'crypto';
import { Project, Commit, Analysis, Log } from '../models/index.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateProject, validateProjectId } from '../middleware/validation.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/projects
 * @desc    Create a new project (connect GitHub repo)
 * @access  Private
 */
router.post('/', protect, validateProject, async (req, res) => {
  try {
    const { name, github, settings } = req.body;
    
    // Check if project already exists for this user
    const existing = await Project.findOne({
      user: req.user._id,
      'github.owner': github.owner,
      'github.repo': github.repo
    });
    
    if (existing) {
      return res.status(400).json({
        error: 'Project exists',
        message: 'This repository is already connected'
      });
    }
    
    // Generate webhook secret
    const webhookSecret = crypto.randomBytes(32).toString('hex');
    
    // Create project
    const project = await Project.create({
      user: req.user._id,
      name,
      github: {
        ...github,
        branch: github.branch || 'main',
        webhookSecret
      },
      settings: settings || {}
    });
    
    // Log creation
    await Log.info('webhook', `Project created: ${name}`, {
      user: req.user._id,
      project: project._id
    });
    
    res.status(201).json({
      message: 'Project created successfully',
      project: {
        id: project._id,
        name: project.name,
        github: {
          owner: project.github.owner,
          repo: project.github.repo,
          branch: project.github.branch
        },
        webhookUrl: `${process.env.FRONTEND_URL}/api/github/webhook/${project._id}`,
        webhookSecret,
        settings: project.settings,
        createdAt: project.createdAt
      }
    });
    
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      error: 'Failed to create project',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/projects
 * @desc    Get all projects for current user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({ 
      user: req.user._id,
      status: { $ne: 'archived' }
    }).sort({ createdAt: -1 });
    
    res.json({
      count: projects.length,
      projects: projects.map(p => ({
        _id: p._id,
        id: p._id,
        name: p.name,
        github: {
          owner: p.github.owner,
          repo: p.github.repo,
          branch: p.github.branch
        },
        repoUrl: p.repoUrl,
        stats: p.stats,
        status: p.status,
        createdAt: p.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      error: 'Failed to get projects',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/projects/:id
 * @desc    Get project details
 * @access  Private
 */
router.get('/:id', protect, validateProjectId, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }
    
    // Get recent commits
    const recentCommits = await Commit.find({ project: project._id })
      .sort({ committedAt: -1 })
      .limit(10)
      .populate('analysis');
    
    // Get metrics
    const metrics = await Analysis.getProjectMetrics(project._id, 7);
    
    res.json({
      project: {
        id: project._id,
        name: project.name,
        github: {
          owner: project.github.owner,
          repo: project.github.repo,
          branch: project.github.branch
        },
        repoUrl: project.repoUrl,
        webhookUrl: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/github/webhook/${project._id}`,
        settings: project.settings,
        stats: project.stats,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      recentCommits: recentCommits.map(c => ({
        id: c._id,
        sha: c.shortSha,
        message: c.message,
        author: c.author,
        committedAt: c.committedAt,
        stats: c.stats,
        analysisStatus: c.analysisStatus,
        analysis: c.analysis ? {
          summary: c.analysis.summary,
          riskLevel: c.analysis.riskAnalysis.level,
          riskScore: c.analysis.riskAnalysis.score
        } : null
      })),
      metrics
    });
    
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      error: 'Failed to get project',
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project settings
 * @access  Private
 */
router.put('/:id', protect, validateProjectId, async (req, res) => {
  try {
    const { name, settings } = req.body;
    
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }
    
    if (name) project.name = name;
    if (settings) project.settings = { ...project.settings, ...settings };
    
    await project.save();
    
    res.json({
      message: 'Project updated',
      project: {
        id: project._id,
        name: project.name,
        settings: project.settings
      }
    });
    
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      error: 'Failed to update project',
      message: error.message
    });
  }
});

/**
 * @route   DELETE /api/projects/:id
 * @desc    Archive/delete project
 * @access  Private
 */
router.delete('/:id', protect, validateProjectId, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }
    
    // Soft delete - archive the project
    project.status = 'archived';
    await project.save();
    
    await Log.info('webhook', `Project archived: ${project.name}`, {
      user: req.user._id,
      project: project._id
    });
    
    res.json({
      message: 'Project archived successfully'
    });
    
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      error: 'Failed to delete project',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/projects/:id/commits
 * @desc    Get all commits for a project
 * @access  Private
 */
router.get('/:id/commits', protect, validateProjectId, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }
    
    const commits = await Commit.find({ project: project._id })
      .sort({ committedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('analysis');
    
    const total = await Commit.countDocuments({ project: project._id });
    
    res.json({
      commits: commits.map(c => ({
        id: c._id,
        sha: c.sha,
        shortSha: c.shortSha,
        message: c.message,
        author: c.author,
        committedAt: c.committedAt,
        stats: c.stats,
        files: c.files.map(f => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions
        })),
        url: c.url,
        analysisStatus: c.analysisStatus,
        analysis: c.analysis ? {
          id: c.analysis._id,
          summary: c.analysis.summary,
          riskLevel: c.analysis.riskAnalysis.level,
          riskScore: c.analysis.riskAnalysis.score,
          bugProbability: c.analysis.bugProbability.score
        } : null
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get commits error:', error);
    res.status(500).json({
      error: 'Failed to get commits',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/projects/:id/sync
 * @desc    Sync/fetch commits from GitHub
 * @access  Private
 */
router.post('/:id/sync', protect, validateProjectId, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    // Fetch commits from GitHub API
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return res.status(500).json({
        error: 'GitHub token not configured'
      });
    }

    const { owner, repo, branch } = project.github;
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=30`,
      {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'WorkflowAI-Bot'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({
        error: 'GitHub API error',
        message: error.message || 'Failed to fetch commits from GitHub'
      });
    }

    const commits = await response.json();
    let newCommits = 0;

    for (const commit of commits) {
      // Check if commit already exists
      const existing = await Commit.findOne({
        project: project._id,
        sha: commit.sha
      });

      if (!existing) {
        // Fetch detailed commit info
        const detailResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`,
          {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'WorkflowAI-Bot'
            }
          }
        );

        const detail = await detailResponse.json();

        // Create commit record
        await Commit.create({
          project: project._id,
          sha: commit.sha,
          shortSha: commit.sha.substring(0, 7),
          message: commit.commit.message,
          author: {
            name: commit.commit.author.name,
            email: commit.commit.author.email,
            username: commit.author?.login || ''
          },
          committedAt: new Date(commit.commit.author.date),
          url: commit.html_url,
          stats: {
            additions: detail.stats?.additions || 0,
            deletions: detail.stats?.deletions || 0,
            total: detail.stats?.total || 0
          },
          files: (detail.files || []).slice(0, 20).map(f => ({
            filename: f.filename,
            status: f.status,
            additions: f.additions,
            deletions: f.deletions,
            patch: f.patch?.substring(0, 5000) || ''
          }))
        });

        newCommits++;
      }
    }

    // Update project stats
    const totalCommits = await Commit.countDocuments({ project: project._id });
    project.stats.totalCommits = totalCommits;
    project.stats.lastSync = new Date();
    await project.save();

    await Log.info('sync', `Synced ${newCommits} new commits for ${project.name}`, {
      user: req.user._id,
      project: project._id
    });

    res.json({
      message: `Synced successfully`,
      newCommits,
      totalCommits
    });

  } catch (error) {
    console.error('Sync commits error:', error);
    res.status(500).json({
      error: 'Failed to sync commits',
      message: error.message
    });
  }
});

export default router;
