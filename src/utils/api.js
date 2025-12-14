/**
 * ==========================================
 * API UTILITY - CENTRALIZED API HANDLER
 * ==========================================
 * 
 * Connects to the clean backend.
 * Handles authentication tokens automatically.
 */

const API_BASE_URL = 'http://localhost:5000/api';

// --- Auth Helpers ---

export const getToken = () => localStorage.getItem('token');

export const saveAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const payload = JSON.parse(jsonPayload);
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
};

/**
 * Main API request handler
 */
export const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle 401 Unauthorized (Token expired/invalid)
      if (response.status === 401) {
        clearAuthData();
        // Optional: Redirect to login or trigger an event
        // window.location.href = '/login'; 
      }
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Helper methods
export const get = (endpoint) => apiRequest(endpoint, { method: 'GET' });
export const post = (endpoint, body) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) });
export const put = (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) });
export const del = (endpoint) => apiRequest(endpoint, { method: 'DELETE' });

export { API_BASE_URL };
