/**
 * ============================================
 * API SERVICE
 * ============================================
 * 
 * Axios configuration for API calls.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data)
};

// ============================================
// PROJECTS API
// ============================================

export const projectsApi = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getCommits: (id, params) => api.get(`/projects/${id}/commits`, { params }),
  syncCommits: (id) => api.post(`/projects/${id}/sync`)
};

// ============================================
// ANALYSIS API
// ============================================

export const analysisApi = {
  analyzeCommit: (commitId) => api.post(`/analyze/commit/${commitId}`),
  analyzeProject: (projectId, limit) => api.post(`/analyze/project/${projectId}`, { limit }),
  getAnalysis: (id) => api.get(`/analyze/${id}`),
  getRecent: (projectId, limit) => api.get(`/analyze/project/${projectId}/recent`, { params: { limit } }),
  checkHealth: () => api.get('/analyze/health/status')
};

// ============================================
// REPORTS API
// ============================================

export const reportsApi = {
  getAll: (params) => api.get('/reports', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  getToday: (projectId) => api.get('/reports/today', { params: { projectId } }),
  generate: (projectId) => api.post('/reports/generate', { projectId }),
  getStats: (days) => api.get('/reports/stats/summary', { params: { days } })
};

// ============================================
// EMAIL API
// ============================================

export const emailApi = {
  send: (reportId, recipients) => api.post('/email/send', { reportId, recipients }),
  test: (email) => api.post('/email/test', { email }),
  getSettings: () => api.get('/email/settings'),
  updateSchedule: (data) => api.put('/email/schedule', data),
  checkHealth: () => api.get('/email/health'),
  getHistory: (params) => api.get('/email/history', { params })
};

export default api;
