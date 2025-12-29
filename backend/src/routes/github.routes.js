/**
 * ============================================
 * GITHUB WEBHOOK ROUTES
 * ============================================
 * 
 * Handles GitHub webhook events (push, etc.)
 */

import express from 'express';
import crypto from 'crypto';
import { Project, Commit, Log } from '../models/index.js';
import { analyzeCommit } from '../services/ai.service.js';

const router = express.Router();

/**
 * Verify GitHub webhook signature
 */
const verifyWebhookSignature = (req, secret) => {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
  
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
};

/**
 * @route   POST /api/github/webhook/:projectId
 * @desc    Receive GitHub webhook events
 * @access  Public (verified by signature)
 */
router.post('/webhook/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const event = req.headers['x-github-event'];
    
    // Find project
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Verify signature (if secret is set)
    if (project.github.webhookSecret) {
      const isValid = verifyWebhookSignature(req, project.github.webhookSecret);
      if (!isValid) {
        await Log.warn('webhook', 'Invalid webhook signature', { project: projectId });
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    // Log the webhook event
    await Log.info('webhook', `Received ${event} event`, {
      project: projectId
    }, {
      event,
      delivery: req.headers['x-github-delivery']
    });
    
    // Handle different event types
    switch (event) {
      case 'push':
        await handlePushEvent(project, req.body);
        break;
      case 'ping':
        return res.json({ message: 'Pong! Webhook configured successfully.' });
      default:
        return res.json({ message: `Event ${event} received but not processed` });
    }
    
    res.json({ message: 'Webhook processed successfully' });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message
    });
  }
});

/**
 * Handle GitHub push event
 */
const handlePushEvent = async (project, payload) => {
  const { commits, repository, pusher, ref } = payload;
  
  // Only process commits to the configured branch
  const branch = ref.replace('refs/heads/', '');
  if (branch !== project.github.branch) {
    await Log.info('webhook', `Skipping push to branch ${branch}`, {
      project: project._id
    });
    return;
  }
  
  // Process each commit
  for (const commitData of commits) {
    try {
      // Check if commit already exists
      const existingCommit = await Commit.findOne({
        project: project._id,
        sha: commitData.id
      });
      
      if (existingCommit) {
        continue; // Skip already processed commits
      }
      
      // Create commit record
      const commit = await Commit.create({
        project: project._id,
        sha: commitData.id,
        shortSha: commitData.id.substring(0, 7),
        message: commitData.message,
        author: {
          name: commitData.author.name,
          email: commitData.author.email,
          username: commitData.author.username
        },
        committedAt: new Date(commitData.timestamp),
        files: commitData.added.map(f => ({ filename: f, status: 'added' }))
          .concat(commitData.removed.map(f => ({ filename: f, status: 'removed' })))
          .concat(commitData.modified.map(f => ({ filename: f, status: 'modified' }))),
        stats: {
          filesChanged: commitData.added.length + commitData.removed.length + commitData.modified.length,
          totalAdditions: 0, // Will be updated with actual diff data
          totalDeletions: 0
        },
        url: commitData.url,
        analysisStatus: 'pending'
      });
      
      // Update project stats
      project.stats.totalCommits += 1;
      project.stats.lastCommitAt = new Date();
      await project.save();
      
      // Log commit creation
      await Log.info('webhook', `Commit ${commit.shortSha} recorded`, {
        project: project._id,
        commit: commit._id
      });
      
      // Trigger analysis if enabled
      if (project.settings.autoAnalyze && project.settings.analyzeOnPush) {
        // Run analysis asynchronously (don't wait)
        analyzeCommit(commit).catch(err => {
          console.error('Auto-analysis failed:', err);
        });
      }
      
    } catch (error) {
      console.error('Error processing commit:', error);
      await Log.error('webhook', `Failed to process commit: ${error.message}`, {
        project: project._id
      });
    }
  }
};

/**
 * @route   POST /api/github/test-webhook/:projectId
 * @desc    Test webhook endpoint (for development)
 * @access  Private (should be protected in production)
 */
router.post('/test-webhook/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Create a mock push event
    const mockPayload = {
      ref: 'refs/heads/main',
      commits: [{
        id: crypto.randomBytes(20).toString('hex'),
        message: 'Test commit from webhook test',
        timestamp: new Date().toISOString(),
        author: {
          name: 'Test User',
          email: 'test@example.com',
          username: 'testuser'
        },
        url: 'https://github.com/test/test/commit/abc123',
        added: ['test-file.js'],
        removed: [],
        modified: []
      }],
      repository: {
        full_name: 'test/test'
      },
      pusher: {
        name: 'Test User'
      }
    };
    
    // Find project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    await handlePushEvent(project, mockPayload);
    
    res.json({
      message: 'Test webhook processed',
      mockCommitId: mockPayload.commits[0].id
    });
    
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({
      error: 'Test webhook failed',
      message: error.message
    });
  }
});

export default router;
