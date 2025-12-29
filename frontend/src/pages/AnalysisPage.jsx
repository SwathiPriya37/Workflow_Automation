/**
 * ============================================
 * AI ANALYSIS PAGE
 * ============================================
 * 
 * View and trigger AI analyses.
 */

import { useState, useEffect } from 'react';
import { 
  Brain, 
  AlertTriangle, 
  Bug, 
  Lightbulb,
  Gauge,
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-react';
import { projectsApi, analysisApi } from '../services/api';

const AnalysisPage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiHealthy, setAiHealthy] = useState(true);

  useEffect(() => {
    fetchProjects();
    checkAiHealth();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchAnalyses(selectedProject);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyses = async (projectId) => {
    try {
      const response = await analysisApi.getRecent(projectId, 20);
      setAnalyses(response.data.analyses || []);
      if (response.data.analyses?.length > 0) {
        setSelectedAnalysis(response.data.analyses[0]);
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
    }
  };

  const checkAiHealth = async () => {
    try {
      const response = await analysisApi.checkHealth();
      setAiHealthy(response.data.aiService === 'healthy');
    } catch {
      setAiHealthy(false);
    }
  };

  const triggerAnalysis = async () => {
    if (!selectedProject) return;
    setAnalyzing(true);
    try {
      await analysisApi.analyzeProject(selectedProject, 5);
      fetchAnalyses(selectedProject);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 75) return 'text-red-600';
    if (score >= 50) return 'text-orange-600';
    if (score >= 25) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">AI Analysis</h1>
          <p className="text-gray-600 mt-2">View code analysis results powered by Gemini</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* AI Status */}
          <div className={`flex items-center px-3 py-1 rounded-full ${
            aiHealthy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              aiHealthy ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm">AI Service {aiHealthy ? 'Online' : 'Offline'}</span>
          </div>
          
          <button
            onClick={triggerAnalysis}
            disabled={analyzing || !aiHealthy}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {analyzing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            {analyzing ? 'Analyzing...' : 'Analyze Pending'}
          </button>
        </div>
      </div>

      {/* Project Selector */}
      <div className="mb-6">
        <select
          value={selectedProject || ''}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analyses List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Recent Analyses</h3>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {analyses.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No analyses yet</p>
              </div>
            ) : (
              analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  onClick={() => setSelectedAnalysis(analysis)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedAnalysis?.id === analysis.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <code className="text-sm font-mono text-primary-600">
                        {analysis.commit?.sha}
                      </code>
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {analysis.commit?.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(analysis.analyzedAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`text-sm font-medium ${getRiskColor(analysis.riskAnalysis?.score || 0)}`}>
                      {analysis.riskAnalysis?.score || 0}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Analysis Detail */}
        <div className="lg:col-span-2">
          {selectedAnalysis ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <code className="text-lg font-mono text-primary-600">
                    {selectedAnalysis.commit?.sha}
                  </code>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedAnalysis.riskAnalysis?.level === 'high' || selectedAnalysis.riskAnalysis?.level === 'critical'
                      ? 'bg-red-100 text-red-700'
                      : selectedAnalysis.riskAnalysis?.level === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                  }`}>
                    {selectedAnalysis.riskAnalysis?.level?.toUpperCase()} RISK
                  </span>
                </div>
                <p className="text-gray-600 mt-2">{selectedAnalysis.commit?.message}</p>
                <p className="text-sm text-gray-400 mt-1">
                  by {selectedAnalysis.commit?.author} • {new Date(selectedAnalysis.commit?.date).toLocaleString()}
                </p>
              </div>

              {/* Summary */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-primary-600" />
                  Summary
                </h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {selectedAnalysis.summary}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <AlertTriangle className={`h-6 w-6 mx-auto mb-2 ${getRiskColor(selectedAnalysis.riskAnalysis?.score || 0)}`} />
                  <p className="text-2xl font-bold">{selectedAnalysis.riskAnalysis?.score || 0}</p>
                  <p className="text-xs text-gray-500">Risk Score</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Bug className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold">{selectedAnalysis.bugProbability?.score || 0}%</p>
                  <p className="text-xs text-gray-500">Bug Probability</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Lightbulb className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">{selectedAnalysis.improvements || 0}</p>
                  <p className="text-xs text-gray-500">Improvements</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Gauge className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{selectedAnalysis.riskAnalysis?.score || 0}</p>
                  <p className="text-xs text-gray-500">Quality</p>
                </div>
              </div>

              {/* Risk Factors */}
              {selectedAnalysis.riskAnalysis?.factors?.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                    Risk Factors
                  </h4>
                  <div className="space-y-2">
                    {selectedAnalysis.riskAnalysis.factors.map((factor, i) => (
                      <div key={i} className="flex items-start p-3 bg-orange-50 rounded-lg">
                        <span className={`px-2 py-1 rounded text-xs font-medium mr-3 ${
                          factor.severity === 'high' ? 'bg-red-200 text-red-800' :
                          factor.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {factor.severity}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{factor.factor}</p>
                          <p className="text-sm text-gray-600">{factor.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center text-sm text-gray-500">
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  Analysis completed
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date(selectedAnalysis.analyzedAt).toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Analysis</h3>
              <p className="text-gray-500">
                Click on an analysis from the list to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
