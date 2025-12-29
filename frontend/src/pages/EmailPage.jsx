/**
 * ============================================
 * EMAIL SETTINGS PAGE
 * ============================================
 * 
 * Configure email automation settings.
 */

import { useState, useEffect } from 'react';
import { 
  Mail, 
  Bell, 
  Clock, 
  Globe,
  Send,
  CheckCircle,
  AlertCircle,
  History
} from 'lucide-react';
import { emailApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EmailPage = () => {
  const { user, updateUser } = useAuth();
  const [settings, setSettings] = useState({
    enabled: true,
    dailyReport: true,
    weeklyReport: false,
    reportTime: '09:00',
    timezone: 'UTC'
  });
  const [emailHealth, setEmailHealth] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSettings();
    checkEmailHealth();
    fetchHistory();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await emailApi.getSettings();
      setSettings(response.data.settings || settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEmailHealth = async () => {
    try {
      const response = await emailApi.checkHealth();
      setEmailHealth(response.data);
    } catch (error) {
      setEmailHealth({ configured: false, error: 'Failed to check email configuration' });
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await emailApi.getHistory({ limit: 10 });
      setHistory(response.data.history || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await emailApi.updateSchedule(settings);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      // Update user context
      updateUser({ ...user, emailSettings: settings });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    setSendingTest(true);
    setMessage(null);
    try {
      await emailApi.test(testEmail || user?.email);
      setMessage({ type: 'success', text: 'Test email sent successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send test email' });
    } finally {
      setSendingTest(false);
    }
  };

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Email Settings</h1>
        <p className="text-gray-600 mt-2">Configure automated email report delivery</p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-primary-600" />
            Notification Settings
          </h3>

          {/* Enable/Disable */}
          <div className="mb-6">
            <label className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">Enable Email Notifications</span>
                <p className="text-sm text-gray-500">Receive automated report emails</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enabled ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </label>
          </div>

          {/* Report Types */}
          <div className="mb-6 space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.dailyReport}
                onChange={(e) => setSettings({ ...settings, dailyReport: e.target.checked })}
                className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="ml-3">
                <span className="font-medium text-gray-900">Daily Reports</span>
                <p className="text-sm text-gray-500">Receive a summary every day</p>
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.weeklyReport}
                onChange={(e) => setSettings({ ...settings, weeklyReport: e.target.checked })}
                className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="ml-3">
                <span className="font-medium text-gray-900">Weekly Reports</span>
                <p className="text-sm text-gray-500">Receive a weekly digest</p>
              </span>
            </label>
          </div>

          {/* Time Settings */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              Report Delivery Time
            </label>
            <input
              type="time"
              value={settings.reportTime}
              onChange={(e) => setSettings({ ...settings, reportTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Timezone */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="h-4 w-4 inline mr-1" />
              Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Test Email & Status */}
        <div className="space-y-6">
          {/* Email Status */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-primary-600" />
              Email Service Status
            </h3>
            
            <div className={`p-4 rounded-lg ${
              emailHealth?.configured ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="flex items-center">
                {emailHealth?.configured ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                )}
                <span className={emailHealth?.configured ? 'text-green-700' : 'text-red-700'}>
                  {emailHealth?.configured ? 'Email service configured and ready' : 'Email service not configured'}
                </span>
              </div>
              {emailHealth?.smtpHost && (
                <p className="text-sm mt-2 text-gray-600">
                  SMTP Host: {emailHealth.smtpHost}
                </p>
              )}
            </div>
          </div>

          {/* Test Email */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Send className="h-5 w-5 mr-2 text-primary-600" />
              Send Test Email
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder={user?.email || 'your@email.com'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              onClick={sendTestEmail}
              disabled={sendingTest || !emailHealth?.configured}
              className="w-full py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 disabled:opacity-50"
            >
              {sendingTest ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>

          {/* Email History */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <History className="h-5 w-5 mr-2 text-primary-600" />
              Recent Emails
            </h3>
            
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No emails sent yet</p>
            ) : (
              <div className="space-y-3">
                {history.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{item.reportTitle}</p>
                      <p className="text-gray-500">{item.projectName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">
                        {new Date(item.sentAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.recipients?.length || 1} recipient(s)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPage;
