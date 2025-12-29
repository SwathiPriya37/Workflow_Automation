/**
 * ============================================
 * DASHBOARD PAGE
 * ============================================
 * 
 * Main dashboard with overview statistics.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  GitCommit, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Clock,
  Plus
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { StatCard } from '../components';
import { projectsApi, reportsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [projectsRes, statsRes] = await Promise.all([
        projectsApi.getAll().catch(() => ({ data: { projects: [] } })),
        reportsApi.getStats(30).catch(() => ({ data: { summary: {}, chartData: [] } }))
      ]);
      
      setProjects(projectsRes.data?.projects || []);
      setStats(statsRes.data?.summary || {});
      setChartData(statsRes.data?.chartData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Projects"
          value={projects.length}
          icon={GitCommit}
          color="primary"
        />
        <StatCard
          title="Total Reports"
          value={stats?.totalReports || 0}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Avg Risk Score"
          value={`${stats?.averageRiskScore || 0}/100`}
          icon={AlertTriangle}
          color={stats?.averageRiskScore > 50 ? 'red' : 'green'}
        />
        <StatCard
          title="Code Quality"
          value={`${stats?.averageCodeQuality || 0}%`}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Commits Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Commit Activity (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="commits" 
                stroke="#667eea" 
                strokeWidth={2}
                dot={{ fill: '#667eea', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Score Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Risk Score Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip />
              <Bar 
                dataKey="avgRiskScore" 
                fill="#667eea"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Your Projects</h3>
          <Link
            to="/projects"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <GitCommit className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h4>
            <p className="text-gray-500 mb-4">
              Connect your first GitHub repository to get started
            </p>
            <Link
              to="/projects"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{project.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {project.github?.owner}/{project.github?.repo}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.status === 'active' 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <div className="flex items-center mt-4 text-sm text-gray-500">
                  <GitCommit className="h-4 w-4 mr-1" />
                  <span>{project.stats?.totalCommits || 0} commits</span>
                  <Clock className="h-4 w-4 ml-4 mr-1" />
                  <span>
                    {project.stats?.lastCommitAt 
                      ? new Date(project.stats.lastCommitAt).toLocaleDateString()
                      : 'No commits'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
