/**
 * ============================================
 * CODE TIMELINE PAGE
 * ============================================
 * 
 * Visual timeline of commits across projects.
 */

import { useState, useEffect } from 'react';
import { 
  GitCommit, 
  User, 
  Calendar,
  FileCode,
  Plus,
  Minus,
  Brain,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { projectsApi } from '../services/api';

const TimelinePage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCommit, setExpandedCommit] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchCommits(selectedProject);
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

  const fetchCommits = async (projectId) => {
    setLoading(true);
    try {
      const response = await projectsApi.getCommits(projectId, { limit: 50 });
      setCommits(response.data.commits || []);
    } catch (error) {
      console.error('Error fetching commits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Code Timeline</h1>
        <p className="text-gray-600 mt-2">Visual history of code changes and analyses</p>
      </div>

      {/* Project Selector */}
      <div className="mb-6">
        <select
          value={selectedProject || ''}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name} ({project.github?.owner}/{project.github?.repo})
            </option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      {commits.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <GitCommit className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No commits yet</h3>
          <p className="text-gray-500">
            Commits will appear here once you configure the GitHub webhook.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          {/* Commits */}
          <div className="space-y-6">
            {commits.map((commit, index) => (
              <div key={commit.id} className="relative pl-20">
                {/* Timeline dot */}
                <div className={`absolute left-6 w-4 h-4 rounded-full border-4 border-white ${
                  commit.analysis ? getRiskColor(commit.analysis.riskLevel) : 'bg-gray-400'
                }`}></div>

                {/* Commit card */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedCommit(expandedCommit === commit.id ? null : commit.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          {expandedCommit === commit.id ? (
                            <ChevronDown className="h-4 w-4 text-gray-400 mr-2" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400 mr-2" />
                          )}
                          <code className="text-sm font-mono text-primary-600 mr-3">
                            {commit.shortSha}
                          </code>
                          <span className="text-gray-900 font-medium truncate">
                            {commit.message}
                          </span>
                        </div>
                        
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <User className="h-4 w-4 mr-1" />
                          <span className="mr-4">{commit.author?.name || 'Unknown'}</span>
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{new Date(commit.committedAt).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center space-x-4 ml-4">
                        <div className="text-center">
                          <div className="flex items-center text-green-600">
                            <Plus className="h-4 w-4" />
                            <span className="font-medium">{commit.stats?.totalAdditions || 0}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center text-red-600">
                            <Minus className="h-4 w-4" />
                            <span className="font-medium">{commit.stats?.totalDeletions || 0}</span>
                          </div>
                        </div>
                        {commit.analysis && (
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            commit.analysis.riskLevel === 'high' || commit.analysis.riskLevel === 'critical'
                              ? 'bg-red-100 text-red-700'
                              : commit.analysis.riskLevel === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                          }`}>
                            Risk: {commit.analysis.riskScore}/100
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {expandedCommit === commit.id && (
                    <div className="border-t bg-gray-50 p-4">
                      {/* Files */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Files Changed ({commit.files?.length || 0})
                        </h4>
                        <div className="space-y-1">
                          {commit.files?.map((file, i) => (
                            <div key={i} className="flex items-center text-sm">
                              <FileCode className="h-4 w-4 text-gray-400 mr-2" />
                              <span className={`${
                                file.status === 'added' ? 'text-green-600' :
                                file.status === 'removed' ? 'text-red-600' :
                                'text-gray-600'
                              }`}>
                                {file.filename}
                              </span>
                              <span className="ml-2 text-xs text-gray-400">
                                +{file.additions} -{file.deletions}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Analysis */}
                      {commit.analysis && (
                        <div className="pt-4 border-t">
                          <div className="flex items-center mb-2">
                            <Brain className="h-4 w-4 text-primary-600 mr-2" />
                            <h4 className="text-sm font-medium text-gray-700">AI Analysis</h4>
                          </div>
                          <p className="text-sm text-gray-600">{commit.analysis.summary}</p>
                        </div>
                      )}

                      {!commit.analysis && (
                        <div className="pt-4 border-t">
                          <span className="text-sm text-gray-500">
                            Analysis pending...
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelinePage;
