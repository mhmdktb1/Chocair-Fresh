import axios from 'axios';

/**
 * ==========================================
 * API UTILITY - CENTRALIZED API HANDLER
 * ==========================================
 * 
 * Connects to the clean backend.
 * Handles authentication tokens automatically.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Derived host for uploads & static assets (e.g. http://localhost:5001 or https://chocair-backend.onrender.com)
export const API_HOST = API_BASE_URL.replace(/\/api\/?$/, '');

export const getAssetUrl = (url) => {
  if (!url) return '';
  if (
    url.startsWith('http://') || 
    url.startsWith('https://') || 
    url.startsWith('data:') || 
    url.startsWith('blob:')
  ) {
    return url;
  }
  if (url.startsWith('/assets/') || url.startsWith('assets/')) {
    return url.startsWith('/') ? url : `/${url}`;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_HOST}${cleanPath}`;
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject({ ...error, message });
  }
);

// --- Auth Helpers ---

export const getToken = () => localStorage.getItem('token');

export const saveAuthData = (token, user) => {
  if (token) {
    localStorage.setItem('token', token);
  }
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (err) {
    console.error('Error parsing stored user data:', err);
    return null;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export default api;
