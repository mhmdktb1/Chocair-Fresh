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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = getStoredUser();
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      setUser(storedUser);
      // Validate with backend to refresh latest data & admin permissions
      api.get('/users/profile')
        .then((res) => {
          if (res.data) {
            const freshUser = { ...storedUser, ...res.data };
            saveAuthData(token, freshUser);
            setUser(freshUser);
          }
        })
        .catch(() => {
          // Token expired or invalidated
          clearAuthData();
          setUser(null);
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
    // Clear localStorage immediately
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Update state
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
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
