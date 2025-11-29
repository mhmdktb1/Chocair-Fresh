/* eslint-disable react-refresh/only-export-components */
/**
 * ==========================================
 * AUTH CONTEXT - USER AUTHENTICATION
 * ==========================================
 * 
 * Manages user authentication state globally.
 * Provides login, register, logout, and auto-authentication.
 * Persists user data and JWT token in localStorage.
 */

import { createContext, useContext, useState, useEffect } from "react";
import {
  post,
  get,
  put,
  saveAuthData,
  getStoredUser,
  clearAuthData,
  isTokenExpired,
  getToken
} from "../utils/api";

const AuthContext = createContext();

// Dev shortcut: set true to bypass auth completely
const DEV_MODE = true;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    DEV_MODE ? { _id: "dev", name: "Dev Admin", role: "admin" } : getStoredUser()
  );
  const [loading, setLoading] = useState(!DEV_MODE);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (DEV_MODE) {
      setLoading(false);
      console.warn("⚠️ AuthContext in DEV_MODE: authentication bypassed.");
      return;
    }

    const initializeAuth = async () => {
      try {
        const token = getToken();

        if (!token || isTokenExpired(token)) {
          clearAuthData();
          setUser(null);
          return;
        }

        const profile = await get("/users/profile");
        if (profile?.data) {
          saveAuthData(token, profile.data);
          setUser(profile.data);
        }
      } catch (err) {
        clearAuthData();
        setUser(null);
        console.error("Auth initialization failed:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleAuthSuccess = (payload) => {
    if (DEV_MODE) {
      return { success: true, data: user };
    }
    if (payload?.data?.token) {
      saveAuthData(payload.data.token, payload.data);
      setUser(payload.data);
    }
    return payload;
  };

  /**
   * Register new user
   * @param {object} userData - {name, email, password, phone}
   * @returns {Promise} User data with token
   */
  const registerUser = async (userData) => {
    if (DEV_MODE) {
      setUser((prev) => prev ?? { _id: "dev", name: "Dev Admin", role: "admin" });
      return { success: true, data: user };
    }
    setLoading(true);
    setError(null);
    try {
      const response = await post("/users/register", userData);
      return handleAuthSuccess(response);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login existing user
   * @param {object} credentials - {email, password}
   * @param {boolean} rememberMe - Keep session longer
   * @returns {Promise} User data with token
   */
  const loginUser = async (credentials, rememberMe = false) => {
    if (DEV_MODE) {
      setUser({ _id: "dev", name: "Dev Admin", role: "admin" });
      return { success: true, data: { _id: "dev", name: "Dev Admin", role: "admin" } };
    }
    setLoading(true);
    setError(null);
    try {
      const response = await post("/users/login", {
        ...credentials,
        rememberMe
      });
      return handleAuthSuccess(response);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   * Clears localStorage and resets state
   */
  const logoutUser = () => {
    if (DEV_MODE) return;
    clearAuthData();
    setUser(null);
  };

  /**
   * Update user profile
   * @param {object} updates - Profile fields to update
   */
  const updateProfile = async (updates) => {
    if (DEV_MODE) {
      setUser((prev) => ({ ...prev, ...updates }));
      return { success: true, data: { ...user, ...updates } };
    }
    setLoading(true);
    setError(null);
    try {
      const response = await put("/users/profile", updates);
      if (response?.data) {
        saveAuthData(getToken(), response.data);
        setUser(response.data);
      }
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user is admin
   */
  const isAdmin = () => (DEV_MODE ? true : user?.role === "admin");

  /**
   * Clear any auth errors
   */
  const clearError = () => setError(null);

  /**
   * ==========================================
   * PHONE VERIFICATION FUNCTIONS
   * ==========================================
   */

  /**
   * Send OTP to phone number
   * @param {string} phone - Phone number
   * @returns {Promise} OTP data
   */
  const sendPhoneOTP = async (phone) => {
    if (DEV_MODE) return { success: true };
    return post("/users/verify-phone", { phone });
  };

  /**
   * Verify OTP and login/register user
   * @param {string} phone - Phone number
   * @param {string} otp - OTP code
   * @param {string} name - Optional name for new users
   * @returns {Promise} User data with token
   */
  const verifyPhoneOTP = async (payload) => {
    if (DEV_MODE) {
      setUser({ _id: "dev", name: "Dev Admin", role: "admin" });
      return { success: true, data: { _id: "dev", name: "Dev Admin", role: "admin" } };
    }
    const response = await post("/users/login-phone", payload);
    return handleAuthSuccess(response);
  };

  /**
   * Resend OTP to phone number
   * @param {string} phone - Phone number
   * @returns {Promise} Success status
   */
  const resendOTP = async (phone) => {
    if (DEV_MODE) return { success: true };
    return post("/users/resend-otp", { phone });
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: DEV_MODE ? true : !!user,
    isAdmin: isAdmin(),
    registerUser,
    loginUser,
    login: loginUser,
    logoutUser,
    updateProfile,
    clearError,
    sendPhoneOTP,
    verifyPhoneOTP,
    resendOTP,
    authDisabled: DEV_MODE,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use auth context
 * Must be used within AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
