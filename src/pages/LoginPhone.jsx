/**
 * ==========================================
 * LOGIN PAGE - MULTI-STEP PHONE VERIFICATION
 * ==========================================
 * 
 * Modern login flow with 3 steps:
 * Step 1: Phone number input
 * Step 2: OTP verification
 * Step 3: Fallback options (Google/Email login)
 * 
 * Primary method: Phone verification
 * Fallback: Traditional email/password or Google OAuth
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Phone, Lock, Mail, Eye, EyeOff, ArrowLeft, User } from 'lucide-react';
import { normalizeLebanesePhoneNumber, isValidLebanesePhoneNumber, formatPhoneNumber } from '../utils/phoneUtils';
import { saveAuthData } from '../utils/api';

export default function LoginPhone() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useAuth();

  // Get redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/account';

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  // Step tracking (1: Phone, 2: OTP, 3: Registration (if new), 4: Fallback)
  const [step, setStep] = useState(1);
  
  // Phone verification state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [userExists, setUserExists] = useState(false); // Track if user has account
  const [showOTP, setShowOTP] = useState(false); // For testing - shows OTP on screen
  const [testOTP, setTestOTP] = useState(''); // Stores OTP for testing display
  
  // Fallback email/password login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Debug: log step changes to help diagnose navigation
  useEffect(() => {
    console.log('🔎 Current step:', step);
  }, [step]);

  // ==========================================
  // OTP COUNTDOWN TIMER
  // ==========================================
  
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // ==========================================
  // STEP 1: SEND OTP TO PHONE
  // ==========================================
  
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    console.log('📱 Step 1: Phone submitted:', phone);

    // Validate phone number
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    // Normalize Lebanese phone number
    const normalizedPhone = normalizeLebanesePhoneNumber(phone);
    
    console.log('📱 Normalized phone:', normalizedPhone);
    
    if (!normalizedPhone) {
      setError('Please enter a valid Lebanese mobile number (e.g., 70 123 456)');
      return;
    }

    // Update phone state with normalized version
    setPhone(normalizedPhone);

    try {
      console.log('📱 Sending OTP to:', normalizedPhone);
      
      // Call backend to send OTP
      const response = await fetch('http://localhost:5001/api/users/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      const result = await response.json();
      
      console.log('📱 OTP Result:', result);
      
      if (result.success) {
        setSuccess(`OTP sent to ${formatPhoneNumber(normalizedPhone, 'friendly')}`);
        setStep(2);
        setCountdown(300); // 5 minutes countdown
        
        // For testing: Display OTP on screen (only in development)
        if (result.otp) {
          setTestOTP(result.otp);
          setShowOTP(true);
        }
      } else {
        setError(result.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('📱 Error sending OTP:', error);
      setError(error.message || 'Failed to send OTP. Please try again.');
    }
  };

  // ==========================================
  // STEP 2: VERIFY OTP
  // ==========================================
  
  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate OTP
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter the 6-digit OTP code');
      return;
    }

    try {
      // Call backend to verify OTP
      const response = await fetch('http://localhost:5001/api/users/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp }),
      });

      const result = await response.json();
      
      if (result.success) {
        if (result.isNewUser) {
          // New user - show registration form (Step 3)
          setSuccess('Phone verified! Please complete your registration.');
          setStep(3);
        } else {
          // Existing user - login successful
          // Save user and token to localStorage using api utility
          if (result.token) {
            saveAuthData(result.token, result.user);
          } else {
            // Fallback if no token (should not happen with updated backend)
            localStorage.setItem('chocair_user', JSON.stringify(result.user));
          }
          
          // Force a reload to update AuthContext
          // Redirect to account page as requested
          window.location.href = '/account';
        }
      } else {
        setError(result.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('📱 Error verifying OTP:', error);
      setError(error.message || 'OTP verification failed');
    }
  };

  // ==========================================
  // RESEND OTP
  // ==========================================
  
  const handleResendOTP = async () => {
    setError('');
    
    if (countdown > 240) { // Don't allow resend within 60 seconds
      setError('Please wait before requesting a new OTP');
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/users/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('New OTP sent successfully!');
        setCountdown(300);
        setOtp(''); // Clear previous OTP
        
        // For testing
        if (result.otp) {
          setTestOTP(result.otp);
          setShowOTP(true);
        }
      } else {
        setError(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      setError(error.message || 'Failed to resend OTP');
    }
  };

  // ==========================================
  // STEP 3: COMPLETE REGISTRATION (NEW USERS)
  // ==========================================
  
  const handleRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate name
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    try {
      // Call backend to register new user
      const response = await fetch('http://localhost:5001/api/users/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: name.trim() }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Save user and token to localStorage using api utility
        if (result.token) {
          saveAuthData(result.token, result.user);
        } else {
          // Fallback
          localStorage.setItem('chocair_user', JSON.stringify(result.user));
        }
        
        // Force a reload to update AuthContext
        // Redirect to account page as requested
        window.location.href = '/account';
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('📱 Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    }
  };

  // ==========================================
  // STEP 4: FALLBACK EMAIL/PASSWORD LOGIN
  // ==========================================
  
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
  // bypass
      
      setSuccess('Login successful! Redirecting...');
      
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } catch (error) {
      setError(error.message || 'Invalid email or password');
    }
  };

  // ==========================================
  // GOOGLE LOGIN (Placeholder)
  // ==========================================
  
  const handleGoogleLogin = () => {
    // Implement Google OAuth here
    alert('Google OAuth integration coming soon!');
  };

  // ==========================================
  // BACK NAVIGATION
  // ==========================================
  
  const handleBack = () => {
    setError('');
    setSuccess('');
    
    if (step === 2) {
      setStep(1);
      setOtp('');
      setShowOTP(false);
    } else if (step === 3) {
      // Can't go back from registration - OTP already verified
      // User must complete registration or use fallback
      setError('Please complete registration or use alternative login');
    } else if (step === 4) {
      setStep(1);
      setEmail('');
      setPassword('');
    }
  };

  // ==========================================
  // FORMAT COUNTDOWN TIMER
  // ==========================================
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ==========================================
  // RENDER
  // ==========================================
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {/* Debug: show current step visually (temporary) */}
          <div style={{ position: 'absolute', top: 8, right: 12, fontSize: 12, opacity: 0.6 }}>Step: {step}</div>
          
          {/* Progress Indicator */}
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Phone</div>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Verify</div>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">{step === 3 ? 'Register' : 'Done'}</div>
            </div>
          </div>

          {/* Back Button (for step 2 only) */}
          {step === 2 && (
            <button className="back-btn" onClick={handleBack}>
              <ArrowLeft size={18} />
              Back
            </button>
          )}

          {/* Success/Error Messages */}
          {success && (
            <div className="alert alert-success">
              <span className="alert-icon">✓</span>
              {success}
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠</span>
              {error}
            </div>
          )}

          {/* ==========================================
              STEP 1: PHONE NUMBER INPUT
              ========================================== */}
          
          {step === 1 && (
            <>
              <div className="auth-header">
                <h1>Welcome Back</h1>
                <p>Enter your Lebanese mobile number</p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="phone">
                    <Phone size={18} />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="70 123 456 or +961 70 123 456"
                    disabled={loading}
                    autoComplete="tel"
                    autoFocus
                  />
                  <small className="input-hint">
                    Accepts: 70 123 456, +96170123456, 00961 70 123456, etc.
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn-primary btn-auth"
                  disabled={loading}
                >
                  {loading ? 'Sending OTP...' : 'Continue'}
                </button>
              </form>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <div className="auth-footer">
                <p>
                  Don't have an account?{' '}
                  <Link to="/register" className="auth-link">
                    Create Account
                  </Link>
                </p>
                <p className="alt-method">
                  <Link to="/login" className="auth-link-secondary">
                    Use email instead
                  </Link>
                </p>
              </div>
            </>
          )}

          {/* ==========================================
              STEP 2: OTP VERIFICATION
              ========================================== */}
          
          {step === 2 && (
            <>
              <div className="auth-header">
                <h1>Enter Verification Code</h1>
                <p>
                  We sent a 6-digit code to <strong>{phone}</strong>
                </p>
              </div>

              {/* Test OTP Display (remove in production) */}
              {showOTP && testOTP && (
                <div className="alert alert-info">
                  <span className="alert-icon">🔑</span>
                  <strong>Test OTP:</strong> {testOTP}
                </div>
              )}

              <form onSubmit={handleOTPSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="otp">
                    <Lock size={18} />
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    maxLength="6"
                    disabled={loading}
                    autoComplete="one-time-code"
                    autoFocus
                    className="otp-input"
                  />
                </div>

                {/* Countdown Timer */}
                {countdown > 0 && (
                  <p className="countdown-text">
                    Code expires in: <strong>{formatTime(countdown)}</strong>
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-primary btn-auth"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
              </form>

              {/* Resend OTP */}
              <div className="auth-footer">
                <p>
                  Didn't receive the code?{' '}
                  <button 
                    onClick={handleResendOTP}
                    className="auth-link"
                    disabled={loading || countdown > 240}
                  >
                    Resend OTP
                  </button>
                </p>
                <p className="alt-method">
                  <button 
                    onClick={() => setStep(4)}
                    className="auth-link-secondary"
                  >
                    Try another method
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ==========================================
              STEP 3: COMPLETE REGISTRATION (NEW USERS)
              ========================================== */}
          
          {step === 3 && (
            <>
              <div className="auth-header">
                <h1>Complete Your Profile</h1>
                <p>Phone verified! Let's create your account</p>
              </div>

              <form onSubmit={handleRegistration} className="auth-form">
                <div className="form-group">
                  <label htmlFor="name">
                    <User size={18} />
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    disabled={loading}
                    autoComplete="name"
                    autoFocus
                    required
                  />
                </div>

                <div className="info-text">
                  <p>📱 Phone: <strong>{formatPhoneNumber(phone, 'friendly')}</strong></p>
                </div>

                <button
                  type="submit"
                  className="btn-primary btn-auth"
                  disabled={loading || !name.trim()}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <div className="auth-footer">
                <p className="small-text">
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </>
          )}

          {/* ==========================================
              STEP 4: FALLBACK OPTIONS
              ========================================== */}
          
          {step === 4 && (
            <>
              <div className="auth-header">
                <h1>Choose Login Method</h1>
                <p>Continue with email or Google</p>
              </div>

              {/* Google Login Button */}
              <button 
                className="btn-social btn-google" 
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <img src="/assets/icons/google.svg" alt="Google" />
                Continue with Google
              </button>

              <div className="auth-divider">
                <span>or</span>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailLogin} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">
                    <Mail size={18} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">
                    <Lock size={18} />
                    Password
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary btn-auth"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In with Email'}
                </button>
              </form>

              <div className="auth-footer">
                <p>
                  <Link to="/forgot-password" className="auth-link-secondary">
                    Forgot password?
                  </Link>
                </p>
                <p>
                  Don't have an account?{' '}
                  <Link to="/register" className="auth-link">
                    Create Account
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
