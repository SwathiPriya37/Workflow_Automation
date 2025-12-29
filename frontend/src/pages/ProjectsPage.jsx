/**
 * ============================================
 * PROJECTS PAGE
 * ============================================
 * 
 * Manage GitHub repository connections.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderGit2, 
  Plus, 
  ExternalLink, 
  Settings, 
  Trash2,
  GitBranch,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Loader2
} from 'lucide-react';
import { projectsApi, analysisApi } from '../services/api';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [fetchingCommits, setFetchingCommits] = useState(null);
  const [analyzingProject, setAnalyzingProject] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    github: {
      owner: '',
      repo: '',
      branch: 'main'
    }
  });
  const [repoUrl, setRepoUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Parse GitHub URL to extract owner and repo
  const parseGitHubUrl = (url) => {
    // Match patterns like:
    // https://github.com/owner/repo
    // https://github.com/owner/repo.git
    // git@github.com:owner/repo.git
    // owner/repo
    const patterns = [
      /github\.com[\/:]([^\/]+)\/([^\/\.]+)/,  // https or git@
      /^([^\/]+)\/([^\/]+)$/                     // owner/repo format
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
      }
    }
    return null;
  };

  const handleRepoUrlChange = (url) => {
    setRepoUrl(url);
    const parsed = parseGitHubUrl(url);
    if (parsed) {
      setFormData({
        ...formData,
        name: formData.name || parsed.repo,
        github: { ...formData.github, owner: parsed.owner, repo: parsed.repo }
      });
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectsApi.getAll();
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const response = await projectsApi.create(formData);
      setProjects([response.data.project, ...projects]);
      setShowModal(false);
      setFormData({ name: '', github: { owner: '', repo: '', branch: 'main' } });
      setRepoUrl('');
    } catch (error) {
      setFormError(error.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to archive this project?')) return;

    try {
      await projectsApi.delete(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const copyWebhookUrl = (project) => {
    navigator.clipboard.writeText(project.webhookUrl || `${window.location.origin}/api/github/webhook/${project._id}`);
    setCopiedId(project._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchCommits = async (project) => {
    setFetchingCommits(project._id);
    setActionMessage(null);
    try {
      const response = await projectsApi.syncCommits(project._id);
      setActionMessage({ 
        type: 'success', 
        text: `Fetched ${response.data.newCommits || 0} new commits!` 
      });
      // Refresh projects to update counts
      fetchProjects();
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to fetch commits' 
      });
    } finally {
      setFetchingCommits(null);
    }
  };

  const analyzeProject = async (project) => {
    setAnalyzingProject(project._id);
    setActionMessage(null);
    try {
      const response = await analysisApi.analyzeProject(project._id, 5);
      setActionMessage({ 
        type: 'success', 
        text: `Analysis complete! ${response.data.analyzed || 0} commits analyzed.` 
      });
      // Refresh projects to update counts
      fetchProjects();
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to analyze project' 
      });
    } finally {
      setAnalyzingProject(null);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-2">Manage your connected GitHub repositories</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </button>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          actionMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FolderGit2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Connect your GitHub repository to start monitoring code changes and generating AI-powered reports.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project._id}
              className="bg-white rounded-xl shadow-sm overflow-hidden card-hover"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline flex items-center mt-1"
                    >
                      {project.github?.owner}/{project.github?.repo}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.status === 'active' 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status}
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <GitBranch className="h-4 w-4 mr-1" />
                  <span>{project.github?.branch || 'main'}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-gray-900">
                      {project.stats?.totalCommits || 0}
                    </p>
                    <p className="text-xs text-gray-500">Commits</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-gray-900">
                      {project.stats?.totalAnalyses || 0}
                    </p>
                    <p className="text-xs text-gray-500">Analyses</p>
                  </div>
                </div>

                {/* Webhook URL */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Webhook URL:</p>
                  <div className="flex items-center">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                      /api/github/webhook/{project._id}
                    </code>
                    <button
                      onClick={() => copyWebhookUrl(project)}
                      className="ml-2 p-1 hover:bg-gray-100 rounded"
                    >
                      {copiedId === project._id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => fetchCommits(project)}
                    disabled={fetchingCommits === project._id}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 text-sm font-medium"
                  >
                    {fetchingCommits === project._id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Fetch Commits
                  </button>
                  <button
                    onClick={() => analyzeProject(project)}
                    disabled={analyzingProject === project._id || (project.stats?.totalCommits || 0) === 0}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50 text-sm font-medium"
                  >
                    {analyzingProject === project._id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-1" />
                    )}
                    Analyze
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-3 bg-gray-50 border-t flex justify-between">
                <Link
                  to={`/projects/${project._id}`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View Details
                </Link>
                <div className="flex items-center space-x-2">
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <Settings className="h-4 w-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project._id)}
                    className="p-1 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Project</h2>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Repository URL
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => handleRepoUrlChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://github.com/username/repo or username/repo"
                />
                <p className="text-xs text-gray-500 mt-1">Paste a GitHub URL to auto-fill owner and repo</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="My Awesome Project"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Owner/Organization
                </label>
                <input
                  type="text"
                  value={formData.github.owner}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    github: { ...formData.github, owner: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="username or org-name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={formData.github.repo}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    github: { ...formData.github, repo: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="my-repo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Branch
                </label>
                <input
                  type="text"
                  value={formData.github.branch}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    github: { ...formData.github, branch: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="main"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
