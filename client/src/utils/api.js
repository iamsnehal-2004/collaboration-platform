import axios from 'axios';

/**
 * API Utility
 * Centralized API client with authentication and error handling
 */

// Base API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
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

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      // Return error message from server
      return Promise.reject(data.message || 'An error occurred');
    } else if (error.request) {
      // Request made but no response
      return Promise.reject('Network error. Please check your connection.');
    } else {
      // Something else happened
      return Promise.reject(error.message || 'An error occurred');
    }
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
};

// Workspace API
export const workspaceAPI = {
  getAll: () => api.get('/workspace'),
  getById: (id) => api.get(`/workspace/${id}`),
  create: (data) => api.post('/workspace', data),
  update: (id, data) => api.put(`/workspace/${id}`, data),
  join: (inviteCode) => api.post('/workspace/join', { inviteCode }),
  leave: (id) => api.delete(`/workspace/${id}/leave`),
  updateDocument: (id, content) => api.put(`/workspace/${id}/document`, { content }),
};

// Message API
export const messageAPI = {
  getMessages: (workspaceId, params) => api.get(`/message/${workspaceId}`, { params }),
  sendMessage: (workspaceId, data) => api.post(`/message/${workspaceId}`, data),
  editMessage: (messageId, content) => api.put(`/message/${messageId}`, { content }),
  deleteMessage: (messageId) => api.delete(`/message/${messageId}`),
  markAsRead: (messageId) => api.post(`/message/${messageId}/read`),
};

export default api;

// Made with Bob
