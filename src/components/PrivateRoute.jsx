/**
 * ==========================================
 * PRIVATE ROUTE - PROTECTED ROUTE WRAPPER
 * ==========================================
 * 
 * Wraps routes that require authentication.
 * Redirects to login if user is not authenticated.
 * Preserves intended destination for post-login redirect.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// TEMP DEV MODE: bypass all route guards
const DEV_MODE = true;

/**
 * PrivateRoute Component
 * 
 * Usage:
 * <Route path="/account" element={<PrivateRoute><AccountPage /></PrivateRoute>} />
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Component to render if authenticated
 * @returns {React.ReactNode} Protected component or redirect to login
 */
export default function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (DEV_MODE) return children;

  // Show loading indicator while checking auth status
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  // Pass current location to redirect back after login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render protected component
  return children;
}

/**
 * Admin Route - Requires admin role
 * 
 * Usage:
 * <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
 */
export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (DEV_MODE) return children;

  // Show loading indicator
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to home if not admin
  if (!isAdmin) {
    return (
      <Navigate 
        to="/" 
        state={{ 
          message: 'You do not have permission to access this page.' 
        }} 
        replace 
      />
    );
  }

  // Render admin component
  return children;
}

/**
 * Guest Route - Only accessible when NOT authenticated
 * 
 * Usage:
 * <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
 */
export function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (DEV_MODE) return children;

  // Show loading indicator
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to home if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Render guest-only component (login, register, etc.)
  return children;
}
