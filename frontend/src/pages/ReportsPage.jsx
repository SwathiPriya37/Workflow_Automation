/**
 * ============================================
 * REPORTS PAGE
 * ============================================
 * 
 * View and manage daily reports.
 */

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Mail, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { projectsApi, reportsApi, emailApi } from '../services/api';

const ReportsPage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchReports();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchReports();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await projectsApi.getAll();
      const projectList = response.data.projects || [];
      setProjects(projectList);
      if (projectList.length > 0) {
        setSelectedProject(projectList[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = selectedProject ? { projectId: selectedProject } : {};
      const response = await reportsApi.getAll(params);
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedProject) return;
    setGenerating(true);
    try {
      const response = await reportsApi.generate(selectedProject);
      if (response.data.report) {
        setReports([response.data.report, ...reports]);
        setSelectedReport(response.data.report);
      }
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  const sendReportEmail = async (reportId) => {
    setSending(true);
    try {
      await emailApi.send(reportId);
      alert('Report sent successfully!');
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const viewReport = async (reportId) => {
    try {
      const response = await reportsApi.getById(reportId);
      setSelectedReport(response.data.report);
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  };

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-2">View and generate daily technical reports</p>
        </div>
        <button
          onClick={generateReport}
          disabled={generating || !selectedProject}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {generating ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Project Selector */}
      <div className="mb-6">
        <select
          value={selectedProject || ''}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Report History</h3>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {reports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No reports yet</p>
                <p className="text-sm mt-1">Generate your first report</p>
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report._id}
                  onClick={() => viewReport(report._id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedReport?._id === report._id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{report.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {report.project?.name || 'Unknown Project'}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-400">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      report.type === 'daily' ? 'bg-blue-100 text-blue-700' :
                      report.type === 'weekly' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {report.type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Report Detail */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <div className="bg-white rounded-xl shadow-sm">
              {/* Report Header */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedReport.title}</h2>
                    <p className="text-gray-500 mt-1">
                      {new Date(selectedReport.dateRange?.start).toLocaleDateString()} - 
                      {new Date(selectedReport.dateRange?.end).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => sendReportEmail(selectedReport._id)}
                      disabled={sending}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {sending ? 'Sending...' : 'Email'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="p-6 border-b bg-gray-50">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedReport.statistics?.totalCommits || 0}
                    </p>
                    <p className="text-sm text-gray-500">Commits</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedReport.statistics?.totalFilesChanged || 0}
                    </p>
                    <p className="text-sm text-gray-500">Files Changed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      +{selectedReport.statistics?.totalAdditions || 0}
                    </p>
                    <p className="text-sm text-gray-500">Additions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      -{selectedReport.statistics?.totalDeletions || 0}
                    </p>
                    <p className="text-sm text-gray-500">Deletions</p>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-6 border-b">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary-600" />
                  Executive Summary
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {selectedReport.executiveSummary}
                </p>
              </div>

              {/* Risk Summary */}
              <div className="p-6 border-b">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                  Risk Summary
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold">{selectedReport.riskSummary?.averageRiskScore || 0}</p>
                    <p className="text-xs text-gray-500">Avg Risk Score</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-orange-600">
                      {selectedReport.riskSummary?.highRiskCommits || 0}
                    </p>
                    <p className="text-xs text-gray-500">High Risk</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-red-600">
                      {selectedReport.riskSummary?.criticalIssues || 0}
                    </p>
                    <p className="text-xs text-gray-500">Critical</p>
                  </div>
                </div>
                {selectedReport.riskSummary?.topRisks?.length > 0 && (
                  <ul className="space-y-2">
                    {selectedReport.riskSummary.topRisks.map((risk, i) => (
                      <li key={i} className="flex items-start text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs mr-2 ${
                          risk.severity === 'high' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {risk.severity}
                        </span>
                        {risk.description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* AI Recommendations */}
              {selectedReport.aiInsights?.recommendations?.length > 0 && (
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                    AI Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {selectedReport.aiInsights.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start text-gray-700">
                        <span className="text-green-500 mr-2">✓</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Report</h3>
              <p className="text-gray-500">
                Click on a report from the list to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
