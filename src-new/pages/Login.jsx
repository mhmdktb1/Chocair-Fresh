import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Phone, ArrowRight, ArrowLeft, CheckCircle, Loader2, User, 
  MapPin, Mail, Calendar, ShieldCheck, Sparkles, Lock, MessageSquare, AlertCircle
} from 'lucide-react';
import { normalizeLebanesePhoneNumber, formatPhoneNumber } from '../utils/phoneUtils';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import LocationPicker from '../components/common/LocationPicker';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { auth, provider, signInWithPopup } from '../config/firebase';
import { toast } from 'react-toastify';
import './Login.css';

const ADMIN_ACCESS_KEYS = ['tookm', 'admin-access', 'mhmd382'];

const isAdminAccessKey = (value) => {
  if (!import.meta.env.DEV) return false;
  const input = (value || '').trim().toLowerCase();
  return ADMIN_ACCESS_KEYS.includes(input);
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('PHONE'); // PHONE, OTP, REGISTER
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Registration State
  const [regData, setRegData] = useState({
    name: '',
    location: '',
    email: '',
    age: '',
    gender: 'select'
  });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let normalizedPhone;
      if (isAdminAccessKey(phoneNumber)) {
        normalizedPhone = phoneNumber.trim().toLowerCase();
      } else {
        normalizedPhone = normalizeLebanesePhoneNumber(phoneNumber);
        if (!normalizedPhone) {
          throw new Error('Please enter a valid Lebanese phone number (e.g., 70 123 456 or 03 123 456).');
        }
      }

      // Call Backend API
      const response = await api.post('/users/auth/send-otp', { phone: normalizedPhone });
      
      if (response.data.success) {
        // Check for direct login (Dev Bypass)
        if (response.data.token) {
          login(response.data.token, response.data.user);
          navigate('/admin');
          return;
        }

        // Show testing OTP banner/toast
        if (response.data.otp) {
          console.log('TEST OTP CODE:', response.data.otp);
          toast.success(`Verification Code: ${response.data.otp}`, { autoClose: 15000 });
          // Autofill OTP for super fast testing
          setOtp(response.data.otp);
        }
        setStep('OTP');
      } else {
        throw new Error(response.data.message || 'Failed to send verification code');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please check your phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const response = await api.post('/users/auth/google', {
        googleId: googleUser.uid,
        email: googleUser.email,
        name: googleUser.displayName || googleUser.email?.split('@')[0],
        avatar: googleUser.photoURL,
      });

      if (response.data.success) {
        login(response.data.token, response.data.user);
        navigate('/');
      } else {
        throw new Error(response.data.message || 'Google authentication failed');
      }
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      setError(
        err.response?.data?.message || err.message || 'Google Sign-In failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedPhone = normalizeLebanesePhoneNumber(phoneNumber);
      const response = await api.post('/users/auth/verify-otp', { 
        phone: normalizedPhone,
        code: otp 
      });

      if (response.data.success) {
        if (response.data.isNewUser) {
          setStep('REGISTER');
        } else {
          login(response.data.token, response.data.user);
          navigate('/');
        }
      } else {
        throw new Error(response.data.message || 'Invalid verification code');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (locationData) => {
    const address = typeof locationData === 'string' ? locationData : locationData.address;
    setRegData(prev => ({
      ...prev,
      location: address
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!regData.name || !regData.location) {
        throw new Error('Name and Delivery Location are required');
      }

      const normalizedPhone = normalizeLebanesePhoneNumber(phoneNumber);
      const response = await api.post('/users/auth/register', {
        phone: normalizedPhone,
        name: regData.name,
        location: regData.location,
        email: regData.email || undefined,
        age: regData.age || undefined,
        gender: regData.gender === 'select' ? undefined : regData.gender.toLowerCase()
      });

      if (response.data.success) {
        login(response.data.token, response.data.user);
        window.location.href = '/profile';
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      setError(msg);
      
      if (msg.includes('User already exists')) {
        setTimeout(() => {
          if (window.confirm("It looks like this account was already created. Would you like to log in now?")) {
            setStep('PHONE');
            setError('');
          }
        }, 500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Desktop Navigation */}
      <div className="login-desktop-nav">
        <Navbar />
      </div>

      {/* Mobile Streamlined Top Header */}
      <header className="login-mobile-header">
        <button 
          type="button" 
          className="login-mobile-back-btn" 
          onClick={() => {
            if (step === 'OTP' || step === 'REGISTER') setStep('PHONE');
            else navigate(-1);
          }}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="login-mobile-title-wrap">
          <span className="login-mobile-brand">Chocair Fresh</span>
        </div>
        <div style={{ width: 36 }} />
      </header>

      <div className="container login-container">
        <div className={`login-card ${step === 'REGISTER' ? 'wide-card' : ''}`}>
          
          {/* Brand Logo & Header */}
          <div className="login-header">
            <div className="login-brand-avatar">
              <span className="brand-leaf-icon">🌱</span>
            </div>
            
            <h1 className="login-title">
              {step === 'PHONE' && 'Welcome to Freshness'}
              {step === 'OTP' && 'Verify Your Phone'}
              {step === 'REGISTER' && 'Complete Your Profile'}
            </h1>
            <p className="login-subtitle">
              {step === 'PHONE' && 'Login or register in seconds with your WhatsApp number'}
              {step === 'OTP' && `Enter the 6-digit WhatsApp code sent to ${formatPhoneNumber(normalizeLebanesePhoneNumber(phoneNumber)) || phoneNumber}`}
              {step === 'REGISTER' && 'Set up your delivery details for 1-tap ordering'}
            </p>
          </div>

          {error && (
            <div className="login-alert-error">
              <AlertCircle size={16} className="alert-error-icon" />
              <span>{error}</span>
            </div>
          )}

          {step === 'PHONE' && (
            <div className="login-body-flow">
              <form onSubmit={handleSendOtp} className="login-form">
                <div className="form-group">
                  <label className="login-input-label">Phone Number (WhatsApp)</label>
                  <div className="modern-phone-wrapper">
                    <div className="phone-country-pill">
                      <span className="flag-emoji">🇱🇧</span>
                      <span className="country-code">+961</span>
                    </div>
                    <input
                      type="tel"
                      placeholder="70 123 456"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={loading}
                      autoFocus
                      className="modern-phone-input"
                    />
                  </div>
                  <span className="login-input-hint">
                    Instant login without passwords via WhatsApp OTP
                  </span>
                </div>

                <Button variant="primary" type="submit" className="login-submit-btn" disabled={loading || !phoneNumber.trim()}>
                  {loading ? (
                    <><Loader2 className="animate-spin" size={18} /> Sending Code...</>
                  ) : (
                    <>Continue with WhatsApp <ArrowRight size={18} style={{ marginLeft: 6 }} /></>
                  )}
                </Button>
              </form>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="modern-google-btn"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="google-icon" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.97 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                Continue with Google
              </button>

              {/* Trust Footer Badges */}
              <div className="login-trust-footer">
                <span className="trust-pill"><ShieldCheck size={14} /> 100% Secure</span>
                <span className="trust-pill"><Sparkles size={14} /> Direct Farm Access</span>
              </div>
            </div>
          )}

          {step === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="login-form otp-form-flow">
              {/* Testing Mode Banner */}
              {otp && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  color: '#15803d',
                  fontWeight: '600'
                }}>
                  <span>🧪 Testing Code: </span>
                  <strong style={{ fontSize: '1.1rem', letterSpacing: '2px', color: '#166534' }}>{otp}</strong>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#16a34a', marginTop: '2px' }}>
                    (WhatsApp simulation mode active)
                  </div>
                </div>
              )}

              <div className="otp-input-box">
                <label className="login-input-label centered">Enter 6-Digit WhatsApp Code</label>
                <input
                  type="text"
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="modern-otp-input"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <Button variant="primary" type="submit" className="login-submit-btn" disabled={loading || otp.length < 4}>
                {loading ? (
                  <><Loader2 className="animate-spin" size={18} /> Verifying...</>
                ) : (
                  'Verify & Continue'
                )}
              </Button>

              <div className="otp-actions-row">
                <button 
                  type="button" 
                  className="login-text-btn" 
                  onClick={() => setStep('PHONE')}
                  disabled={loading}
                >
                  Change Number
                </button>
                <button 
                  type="button" 
                  className="login-text-btn resend" 
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}

          {step === 'REGISTER' && (
            <form onSubmit={handleRegister} className="login-form register-form-flow animate-fade-in">
              <div className="register-sections-wrap">
                {/* 1. Personal Info Card */}
                <div className="register-sub-card">
                  <h3 className="sub-card-title"><User size={16} /> Personal Information</h3>
                  
                  <div className="form-group">
                    <label className="login-input-label">Full Name <span className="req-star">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={regData.name}
                      onChange={(e) => setRegData({...regData, name: e.target.value})}
                      required
                      className="modern-text-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="login-input-label">Email Address <span className="opt-tag">(Optional)</span></label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={regData.email}
                      onChange={(e) => setRegData({...regData, email: e.target.value})}
                      className="modern-text-input"
                    />
                  </div>

                  <div className="form-grid-two">
                    <div className="form-group">
                      <label className="login-input-label">Age <span className="opt-tag">(Optional)</span></label>
                      <input
                        type="number"
                        placeholder="25"
                        value={regData.age}
                        onChange={(e) => setRegData({...regData, age: e.target.value})}
                        min="13"
                        max="120"
                        className="modern-text-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="login-input-label">Gender <span className="opt-tag">(Optional)</span></label>
                      <select
                        value={regData.gender}
                        onChange={(e) => setRegData({...regData, gender: e.target.value})}
                        className="modern-text-input select-input"
                      >
                        <option value="select" disabled>Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Delivery Location Card (Toters Style) */}
                <div className="register-sub-card">
                  <h3 className="sub-card-title"><MapPin size={16} /> Default Delivery Location</h3>
                  <LocationPicker onLocationSelect={handleLocationSelect} initialLocation={regData.location} />
                </div>
              </div>

              <div className="register-submit-actions">
                <Button variant="primary" type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? <><Loader2 className="animate-spin" size={18} /> Setting up account...</> : 'Complete Profile & Start Shopping'}
                </Button>
                
                <button 
                  type="button" 
                  className="login-text-btn cancel-btn" 
                  onClick={() => setStep('PHONE')}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
