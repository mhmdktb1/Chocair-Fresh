import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { getStoredUser, saveAuthData, clearAuthData } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('token');
      const stored = getStoredUser();
      return token && stored ? stored : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = getStoredUser();
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      setUser(storedUser);
      // Validate with backend in background to refresh latest data & permissions
      api.get('/users/profile')
        .then((res) => {
          if (res.data) {
            const freshUser = { ...storedUser, ...res.data };
            saveAuthData(token, freshUser);
            setUser(freshUser);
          }
        })
        .catch((err) => {
          // Only invalidate and clear session if server explicitly returns 401 or 403
          const status = err.response?.status;
          if (status === 401 || status === 403) {
            clearAuthData();
            setUser(null);
          } else {
            // Keep user session active on network timeouts or server cold starts
            console.warn('Backend profile verification unavailable; preserving stored session:', err?.message || err);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // If either is missing, ensure we start clean
      clearAuthData();
      setUser(null);
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    saveAuthData(token, userData);
    setUser(userData);
  };

  const logout = () => {
    clearAuthData();
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const newUser = { ...(prev || {}), ...updatedData };
      const token = localStorage.getItem('token');
      if (token) {
        saveAuthData(token, newUser);
      } else {
        localStorage.setItem('user', JSON.stringify(newUser));
      }
      return newUser;
    });
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user && (user.isAdmin === true || user.isAdmin === 'true') // Handle string/boolean mismatch
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
