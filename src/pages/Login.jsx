/**
 * ==========================================
 * LOGIN PAGE - USER AUTHENTICATION
 * ==========================================
 * 
 * Email/password login with JWT authentication.
 * Includes remember me option and error handling.
 * Redirects to homepage or intended route on success.
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, loginUser, error: authError, clearError, authDisabled } = useAuth();

  // Get redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/';

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /**
   * Handle input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    setError('');
    if (authError) clearError();
  };

  /**
   * Validate form inputs
   */
  const validateForm = () => {
    const { email, password } = formData;

    if (!email.trim()) {
      setError('Please enter your email');
      return false;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!password) {
      setError('Please enter your password');
      return false;
    }

    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate inputs
    if (!validateForm()) {
      return;
    }

    try {
      // Call loginUser from AuthContext
      await loginUser(formData, rememberMe);

      // Show success message
      setSuccess('Login successful! Redirecting...');

      // Redirect after short delay
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } catch (error) {
      setError(error.message || 'Invalid email or password.');
    }
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  if (authDisabled) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h1>Authentication Disabled</h1>
              <p>Login is bypassed in the current development build. You already have access.</p>
              <Link to="/" className="btn primary" style={{ marginTop: '1rem' }}>
                Go to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Welcome back</h1>
            <p>Sign in to manage your account and orders.</p>
          </div>

          {(error || authError) && (
            <div className="auth-alert error">
              {error || authError}
            </div>
          )}

          {success && (
            <div className="auth-alert success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="email">Email address</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <label htmlFor="password">Password</label>
            <div className="input-with-icon password-field">
              <Lock size={18} />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="icon-button"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="auth-options">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <Link to="/login-phone" className="link">
                Login via phone
              </Link>
            </div>

            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="spin" size={16} /> Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don&apos;t have an account?{' '}
              <Link to="/register" className="link">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
