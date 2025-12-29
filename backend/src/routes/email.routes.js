/**
 * ============================================
 * EMAIL ROUTES
 * ============================================
 * 
 * Handles email automation and settings.
 */

import express from 'express';
import { Report, User, Log } from '../models/index.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateEmailSend, validateEmailSchedule } from '../middleware/validation.middleware.js';
import { sendReportEmail, sendEmail, testEmailConfig } from '../services/email.service.js';

const router = express.Router();

/**
 * @route   POST /api/email/send
 * @desc    Send a report email
 * @access  Private
 */
router.post('/send', protect, validateEmailSend, async (req, res) => {
  try {
    const { reportId, recipients } = req.body;
    
    // Find the report
    const report = await Report.findOne({
      _id: reportId,
      user: req.user._id
    }).populate('project');
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Determine recipients
    const emailRecipients = recipients && recipients.length > 0
      ? recipients
      : [req.user.email];
    
    // Send the email
    const result = await sendReportEmail(report, emailRecipients);
    
    // Update report delivery status
    report.emailDelivery = {
      sent: true,
      sentAt: new Date(),
      recipients: emailRecipients
    };
    await report.save();
    
    await Log.info('email', `Report email sent to ${emailRecipients.length} recipients`, {
      user: req.user._id,
      report: report._id
    });
    
    res.json({
      message: 'Email sent successfully',
      messageId: result.messageId,
      recipients: emailRecipients
    });
    
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/email/test
 * @desc    Send a test email
 * @access  Private
 */
router.post('/test', protect, async (req, res) => {
  try {
    const { email } = req.body;
    const recipient = email || req.user.email;
    
    await sendEmail({
      to: recipient,
      subject: '🧪 Test Email - Workflow Automation',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .box { background: #f0f0f0; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>✅ Email Configuration Working!</h2>
            <p>Hi ${req.user.name},</p>
            <p>This is a test email from your Workflow Automation Dashboard.</p>
            <p>If you received this, your email configuration is correct!</p>
            <hr>
            <p><small>Sent at: ${new Date().toISOString()}</small></p>
          </div>
        </body>
        </html>
      `
    });
    
    res.json({
      message: 'Test email sent',
      recipient
    });
    
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      error: 'Failed to send test email',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/email/settings
 * @desc    Get email settings for current user
 * @access  Private
 */
router.get('/settings', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      settings: user.emailSettings
    });
    
  } catch (error) {
    console.error('Get email settings error:', error);
    res.status(500).json({
      error: 'Failed to get settings',
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/email/schedule
 * @desc    Update email schedule settings
 * @access  Private
 */
router.put('/schedule', protect, validateEmailSchedule, async (req, res) => {
  try {
    const { enabled, dailyReport, weeklyReport, reportTime, timezone } = req.body;
    
    const updates = {};
    if (typeof enabled !== 'undefined') updates['emailSettings.enabled'] = enabled;
    if (typeof dailyReport !== 'undefined') updates['emailSettings.dailyReport'] = dailyReport;
    if (typeof weeklyReport !== 'undefined') updates['emailSettings.weeklyReport'] = weeklyReport;
    if (reportTime) updates['emailSettings.reportTime'] = reportTime;
    if (timezone) updates['emailSettings.timezone'] = timezone;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    );
    
    await Log.info('email', 'Email schedule updated', {
      user: req.user._id
    }, updates);
    
    res.json({
      message: 'Email schedule updated',
      settings: user.emailSettings
    });
    
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      error: 'Failed to update schedule',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/email/health
 * @desc    Check email configuration
 * @access  Private
 */
router.get('/health', protect, async (req, res) => {
  try {
    const isConfigured = await testEmailConfig();
    
    res.json({
      configured: isConfigured,
      smtpHost: process.env.SMTP_HOST || 'not set',
      message: isConfigured 
        ? 'Email configuration is valid'
        : 'Email configuration is invalid or SMTP server is unreachable'
    });
    
  } catch (error) {
    res.json({
      configured: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/email/history
 * @desc    Get email delivery history
 * @access  Private
 */
router.get('/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Get reports with email delivery info
    const reports = await Report.find({
      user: req.user._id,
      'emailDelivery.sent': true
    })
      .select('title dateRange emailDelivery project')
      .populate('project', 'name')
      .sort({ 'emailDelivery.sentAt': -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Report.countDocuments({
      user: req.user._id,
      'emailDelivery.sent': true
    });
    
    res.json({
      history: reports.map(r => ({
        reportId: r._id,
        reportTitle: r.title,
        projectName: r.project?.name,
        sentAt: r.emailDelivery.sentAt,
        recipients: r.emailDelivery.recipients
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get email history error:', error);
    res.status(500).json({
      error: 'Failed to get history',
      message: error.message
    });
  }
});

export default router;
