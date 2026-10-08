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

// Derived host for uploads & static assets (e.g. http://localhost:5001 or https://choucair-backend.onrender.com)
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

// Create axios instance with default config.
// 30s per attempt: the free Render instance can take ~30-60s to wake from sleep.
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);
const RETRYABLE_STATUS = new Set([408, 425, 429, 502, 503, 504]);
const DEFAULT_RETRIES = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Only idempotent reads are retried, so a slow/failed checkout can never be submitted twice.
const shouldRetry = (error) => {
  const config = error?.config;
  if (!config || axios.isCancel(error)) return false;
  if (!RETRYABLE_METHODS.has((config.method || 'get').toLowerCase())) return false;
  const maxRetries = config.retries ?? DEFAULT_RETRIES;
  if ((config.__retryCount || 0) >= maxRetries) return false;
  if (!error.response) return true; // network error, timeout, server waking up
  return RETRYABLE_STATUS.has(error.response.status);
};

const retryDelay = (error, attempt) => {
  const retryAfter = Number(error.response?.headers?.['retry-after']);
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1000, 10000);
  return Math.min(1000 * 2 ** (attempt - 1), 8000) + Math.floor(Math.random() * 300);
};

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

// Response interceptor: transparent retry for transient failures + global error shaping
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (shouldRetry(error)) {
      const config = error.config;
      config.__retryCount = (config.__retryCount || 0) + 1;
      await sleep(retryDelay(error, config.__retryCount));
      return api(config);
    }

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
