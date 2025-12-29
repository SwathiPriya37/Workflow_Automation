/**
 * ============================================
 * EMAIL SERVICE
 * ============================================
 * 
 * Email automation using NodeMailer.
 * Sends daily reports and notifications.
 */

import nodemailer from 'nodemailer';
import { Log } from '../models/index.js';

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter
 */
const initTransporter = () => {
  if (transporter) return transporter;
  
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  
  return transporter;
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string|Array} options.to - Recipient(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @returns {Promise<Object>} Send result
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transport = initTransporter();
    
    const mailOptions = {
      from: `"Workflow Automation" <${process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };
    
    const result = await transport.sendMail(mailOptions);
    
    await Log.info('email', `Email sent to ${to}`, {}, {
      subject,
      messageId: result.messageId
    });
    
    return {
      success: true,
      messageId: result.messageId
    };
    
  } catch (error) {
    console.error('Email send error:', error);
    
    await Log.error('email', `Failed to send email: ${error.message}`, {}, {
      to,
      subject
    });
    
    throw error;
  }
};

/**
 * Send a daily report email
 * @param {Object} report - Report document
 * @param {Array} recipients - Email recipients
 * @returns {Promise<Object>} Send result
 */
export const sendReportEmail = async (report, recipients) => {
  const subject = `📊 ${report.title} - ${new Date(report.dateRange.start).toLocaleDateString()}`;
  
  const html = generateReportEmailHTML(report);
  
  return sendEmail({
    to: recipients,
    subject,
    html
  });
};

/**
 * Generate HTML for report email
 * @param {Object} report - Report document
 * @returns {string} HTML content
 */
const generateReportEmailHTML = (report) => {
  const riskColor = report.riskSummary.averageRiskScore > 70 ? '#dc3545' :
                    report.riskSummary.averageRiskScore > 40 ? '#ffc107' : '#28a745';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${report.title}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 28px; font-weight: bold; color: #667eea; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .risk-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; font-weight: bold; }
        .summary-box { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
        .improvement-item { padding: 10px 0; border-bottom: 1px solid #eee; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 ${report.title}</h1>
        <p>${new Date(report.dateRange.start).toLocaleDateString()} - ${new Date(report.dateRange.end).toLocaleDateString()}</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${report.statistics.totalCommits}</div>
          <div class="stat-label">Commits</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${report.statistics.totalFilesChanged}</div>
          <div class="stat-label">Files Changed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #28a745;">+${report.statistics.totalAdditions}</div>
          <div class="stat-label">Additions</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #dc3545;">-${report.statistics.totalDeletions}</div>
          <div class="stat-label">Deletions</div>
        </div>
      </div>
      
      <div class="section">
        <h2>📝 Executive Summary</h2>
        <div class="summary-box">
          ${report.executiveSummary}
        </div>
      </div>
      
      <div class="section">
        <h2>⚠️ Risk Analysis</h2>
        <p>
          Average Risk Score: 
          <span class="risk-badge" style="background: ${riskColor};">
            ${report.riskSummary.averageRiskScore}/100
          </span>
        </p>
        ${report.riskSummary.topRisks.length > 0 ? `
          <ul>
            ${report.riskSummary.topRisks.map(risk => `
              <li><strong>${risk.severity}:</strong> ${risk.description}</li>
            `).join('')}
          </ul>
        ` : '<p>No significant risks identified.</p>'}
      </div>
      
      <div class="section">
        <h2>💡 Top Improvements</h2>
        ${report.qualityMetrics.topImprovements.length > 0 ? `
          ${report.qualityMetrics.topImprovements.map(imp => `
            <div class="improvement-item">
              <strong>[${imp.category}]</strong> ${imp.suggestion}
            </div>
          `).join('')}
        ` : '<p>No improvement suggestions at this time.</p>'}
      </div>
      
      <div class="section">
        <h2>🎯 AI Recommendations</h2>
        ${report.aiInsights.recommendations.length > 0 ? `
          <ul>
            ${report.aiInsights.recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        ` : '<p>No specific recommendations.</p>'}
      </div>
      
      <div class="footer">
        <p>Generated by AI Workflow Automation Dashboard</p>
        <p>This is an automated report. Do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send a welcome email
 * @param {Object} user - User document
 * @returns {Promise<Object>} Send result
 */
export const sendWelcomeEmail = async (user) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; }
        .content { padding: 30px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Welcome to Workflow Automation!</h1>
      </div>
      <div class="content">
        <p>Hi ${user.name},</p>
        <p>Thank you for signing up! You're now ready to:</p>
        <ul>
          <li>Connect your GitHub repositories</li>
          <li>Get AI-powered code analysis</li>
          <li>Receive automated daily reports</li>
        </ul>
        <p>Get started by connecting your first repository!</p>
        <p><a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a></p>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: user.email,
    subject: '🎉 Welcome to Workflow Automation!',
    html
  });
};

/**
 * Test email configuration
 * @returns {Promise<boolean>} True if configuration is valid
 */
export const testEmailConfig = async () => {
  try {
    const transport = initTransporter();
    await transport.verify();
    return true;
  } catch (error) {
    console.error('Email config test failed:', error);
    return false;
  }
};

export default {
  sendEmail,
  sendReportEmail,
  sendWelcomeEmail,
  testEmailConfig
};
