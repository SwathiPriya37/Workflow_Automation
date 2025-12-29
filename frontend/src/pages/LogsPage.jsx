/**
 * ============================================
 * LOGS PAGE
 * ============================================
 * 
 * System logs viewer with filtering and search.
 */

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Filter, 
  Search, 
  AlertCircle, 
  CheckCircle,
  Clock,
  RefreshCw,
  Download
} from 'lucide-react';
import api from '../services/api';

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    level: 'all',
    action: 'all',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        ...(filters.level !== 'all' && { level: filters.level }),
        ...(filters.action !== 'all' && { action: filters.action }),
        ...(filters.search && { search: filters.search }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      };
      
      const response = await api.get('/logs', { params });
      setLogs(response.data.logs || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching logs:', error);
      // Mock data for demo
      setLogs([
        { _id: 1, level: 'info', action: 'user_login', message: 'User logged in successfully', createdAt: new Date().toISOString(), userId: { name: 'John Doe' } },
        { _id: 2, level: 'info', action: 'commit_received', message: 'New commit received from webhook', createdAt: new Date(Date.now() - 3600000).toISOString(), projectId: { name: 'main-app' } },
        { _id: 3, level: 'info', action: 'analysis_complete', message: 'AI analysis completed', createdAt: new Date(Date.now() - 7200000).toISOString(), projectId: { name: 'main-app' } },
        { _id: 4, level: 'warning', action: 'rate_limit', message: 'API rate limit approaching', createdAt: new Date(Date.now() - 10800000).toISOString() },
        { _id: 5, level: 'error', action: 'analysis_failed', message: 'AI service timeout', createdAt: new Date(Date.now() - 14400000).toISOString(), projectId: { name: 'api-service' } },
        { _id: 6, level: 'info', action: 'report_generated', message: 'Daily report generated', createdAt: new Date(Date.now() - 18000000).toISOString() },
        { _id: 7, level: 'info', action: 'email_sent', message: 'Report email sent successfully', createdAt: new Date(Date.now() - 21600000).toISOString() },
        { _id: 8, level: 'info', action: 'project_created', message: 'New project created', createdAt: new Date(Date.now() - 25200000).toISOString(), projectId: { name: 'new-service' } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Level', 'Action', 'Message'].join(','),
      ...logs.map(log => [
        new Date(log.createdAt).toISOString(),
        log.level,
        log.action,
        `"${log.message}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getLevelStyles = (level) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'debug':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const actionTypes = [
    'all',
    'user_login',
    'user_logout',
    'commit_received',
    'analysis_started',
    'analysis_complete',
    'analysis_failed',
    'report_generated',
    'email_sent',
    'project_created',
    'project_deleted',
    'rate_limit'
  ];

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600 mt-2">Monitor system activity and events</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center ${
              showFilters ? 'bg-primary-50 border-primary-600 text-primary-600' : 'border-gray-300 text-gray-700'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={fetchLogs}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg flex items-center hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={exportLogs}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center hover:bg-primary-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search logs..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
              <select
                value={filters.level}
                onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Levels</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {actionTypes.map((action) => (
                  <option key={action} value={action}>
                    {action === 'all' ? 'All Actions' : action.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({ level: 'all', action: 'all', search: '', startDate: '', endDate: '' })}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No logs found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Context
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelStyles(log.level)}`}>
                        {getLevelIcon(log.level)}
                        <span className="ml-1">{log.level}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.action?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                      {log.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.userId?.name && (
                        <span className="text-primary-600">{log.userId.name}</span>
                      )}
                      {log.projectId?.name && (
                        <span className="text-secondary-600">{log.projectId.name}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Info</p>
              <p className="text-lg font-semibold text-gray-900">
                {logs.filter(l => l.level === 'info').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Warnings</p>
              <p className="text-lg font-semibold text-gray-900">
                {logs.filter(l => l.level === 'warning').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Errors</p>
              <p className="text-lg font-semibold text-gray-900">
                {logs.filter(l => l.level === 'error').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-lg font-semibold text-gray-900">{logs.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogsPage;
