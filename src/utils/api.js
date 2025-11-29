/**
 * ==========================================
 * API UTILITY - CENTRALIZED API HANDLER
 * ==========================================
 * 
 * Provides a reusable fetch wrapper for all API calls.
 * Automatically includes Authorization headers when token exists.
 * Handles errors consistently across the application.
 */

// Base API URL
const API_BASE_URL = 'http://localhost:5000/api';

// TEMP DEV MODE: disable token storage/header injection
// Set to true when testing without real authentication
const DEV_MODE = true;

/**
 * Get JWT token from localStorage
 */
export const getToken = () => {
  if (DEV_MODE) return null;
  return localStorage.getItem('chocairToken');
};

/**
 * Main API request handler
 * @param {string} endpoint - API endpoint (e.g., '/users/login')
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise} Response data or throws error
 */
export const apiRequest = async (endpoint, options = {}) => {
  try {
    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add Authorization header if token exists
    if (!DEV_MODE) {
      const token = getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    // Build full URL
    const url = `${API_BASE_URL}${endpoint}`;

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Server returned non-JSON: ${text || response.statusText}`);
    }

    // Handle non-2xx responses
    if (!response.ok) {
      throw new Error(data.message || data.error || `API Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    // Provide clearer error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Cannot connect to backend server. Make sure the backend is running on http://localhost:5000');
    }
    // Re-throw with clearer error message
    throw new Error(error.message || 'Network error. Please try again.');
  }
};

/**
 * Convenience method for GET requests
 */
export const get = (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'GET',
  });
};

/**
 * Convenience method for POST requests
 */
export const post = (endpoint, body, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
};

/**
 * Convenience method for PUT requests
 */
export const put = (endpoint, body, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

/**
 * Convenience method for DELETE requests
 */
export const del = (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'DELETE',
  });
};

/**
 * Check if token is expired (basic check)
 * JWT tokens contain expiration info in the payload
 */
export const isTokenExpired = (token) => {
  if (DEV_MODE) return false;
  if (!token) return true;

  try {
    // Decode JWT payload (base64)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check expiration (exp is in seconds, Date.now() is in milliseconds)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return true;
    }
    
    return false;
  } catch (error) {
    // If token is malformed, consider it expired
    return true;
  }
};

/**
 * Clear authentication data from localStorage
 */
export const clearAuthData = () => {
  if (DEV_MODE) return;
  localStorage.removeItem('chocairToken');
  localStorage.removeItem('chocairUser');
};

/**
 * Save authentication data to localStorage
 */
export const saveAuthData = (token, user) => {
  if (DEV_MODE) return;
  localStorage.setItem('chocairToken', token);
  localStorage.setItem('chocairUser', JSON.stringify(user));
};

/**
 * Get user data from localStorage
 */
export const getStoredUser = () => {
  if (DEV_MODE) return { name: 'Developer Admin', role: 'admin', _id: 'dev' };
  const userStr = localStorage.getItem('chocairUser');
  return userStr ? JSON.parse(userStr) : null;
};

// Export API_BASE_URL for direct use if needed
export { API_BASE_URL };
