/**
 * ============================================
 * CRON SERVICE
 * ============================================
 * 
 * Scheduled tasks for automated operations.
 * Handles daily report generation and cleanup.
 */

import cron from 'node-cron';
import { Project, Log } from '../models/index.js';
import { generateDailyReport } from './report.service.js';

/**
 * Initialize all cron jobs
 */
export const initCronJobs = () => {
  console.log('🕐 Initializing cron jobs...');
  
  // Daily report generation - runs at 9:00 AM every day
  cron.schedule('0 9 * * *', async () => {
    console.log('📊 Starting daily report generation...');
    await generateAllDailyReports();
  }, {
    timezone: 'UTC'
  });
  
  // Cleanup old logs - runs at 2:00 AM every day
  cron.schedule('0 2 * * *', async () => {
    console.log('🧹 Starting log cleanup...');
    await cleanupOldLogs();
  }, {
    timezone: 'UTC'
  });
  
  // Health check - runs every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await performHealthCheck();
  });
  
  console.log('✅ Cron jobs initialized');
};

/**
 * Generate daily reports for all active projects
 */
const generateAllDailyReports = async () => {
  try {
    // Find all active projects with daily reports enabled
    const projects = await Project.find({
      status: 'active',
      'settings.dailyReportEnabled': true
    });
    
    await Log.info('system', `Starting daily report generation for ${projects.length} projects`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const project of projects) {
      try {
        const report = await generateDailyReport(project._id);
        if (report) {
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to generate report for project ${project._id}:`, error);
        failCount++;
      }
    }
    
    await Log.info('system', `Daily report generation complete: ${successCount} success, ${failCount} failed`);
    
  } catch (error) {
    console.error('Daily report generation error:', error);
    await Log.error('system', `Daily report generation failed: ${error.message}`);
  }
};

/**
 * Clean up old log entries
 */
const cleanupOldLogs = async () => {
  try {
    // Logs older than 30 days should be auto-deleted by TTL index
    // This is a manual cleanup for any that might have been missed
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await Log.deleteMany({
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    console.log(`Cleaned up ${result.deletedCount} old log entries`);
    
  } catch (error) {
    console.error('Log cleanup error:', error);
  }
};

/**
 * Perform system health check
 */
const performHealthCheck = async () => {
  try {
    // Check database connection
    const mongoose = await import('mongoose');
    if (mongoose.default.connection.readyState !== 1) {
      await Log.warn('system', 'Database connection issue detected');
    }
    
  } catch (error) {
    console.error('Health check error:', error);
  }
};

/**
 * Manually trigger daily report for a specific project
 */
export const triggerDailyReport = async (projectId) => {
  await Log.info('system', `Manual daily report triggered for project ${projectId}`);
  return generateDailyReport(projectId);
};

export default {
  initCronJobs,
  triggerDailyReport
};
