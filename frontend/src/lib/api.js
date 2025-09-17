import axios from 'axios';

// Dynamic API base URL for different environments
const getApiBaseUrl = () => {
  // Check if we're in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  
  // Production configuration for Formonex domain (HTTPS-ready)
  if (window.location.hostname === 'ems.formonex.in') {
    // For HTTPS frontend, we need HTTPS API to avoid mixed content
    // Use environment variable or fallback to HTTPS production endpoint
    const httpsApiUrl = import.meta.env.VITE_API_BASE_URL?.replace('http://', 'https://') || 'https://65.0.94.0:8000/api';
    return httpsApiUrl;
  }
  
  // For other production environments, match the protocol of the page
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // If page is served over HTTPS, use HTTPS for API
  if (protocol === 'https:') {
    return import.meta.env.VITE_API_BASE_URL?.replace('http://', 'https://') || `https://${hostname}:8000/api`;
  }
  
  // For HTTP pages, use HTTP API
  const port = window.location.port === '80' || window.location.port === '443' || !window.location.port ? '' : ':8000';
  return `${protocol}//${hostname}${port}/api`;
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Only redirect to login on 401 if it's not the auth verification endpoint
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/me')) {
      // Token expired or invalid for regular API calls
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if we're not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
