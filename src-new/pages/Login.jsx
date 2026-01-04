import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, CheckCircle, Loader2, User, MapPin, Mail, Calendar } from 'lucide-react';
import { normalizeLebanesePhoneNumber, formatPhoneNumber } from '../utils/phoneUtils';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import LocationPicker from '../components/common/LocationPicker';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

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
      
      // Dev Bypass Check
      if (phoneNumber === 'mhmd382') {
        normalizedPhone = 'mhmd382';
      } else {
        normalizedPhone = normalizeLebanesePhoneNumber(phoneNumber);
        if (!normalizedPhone) {
          throw new Error('Invalid phone number format. Please use a valid Lebanese number (e.g., 70 123 456 or 03 123 456).');
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

        // In development, the OTP might be returned in the response for testing
        if (response.data.otp) {
          console.log('DEV OTP:', response.data.otp);
          alert(`DEV MODE: Your OTP is ${response.data.otp}`);
        }
        setStep('OTP');
      } else {
        throw new Error(response.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please check your number.');
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
          // Login success
          login(response.data.token, response.data.user);
          navigate('/');
        }
      } else {
        throw new Error(response.data.message || 'Invalid verification code');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid OTP. Please try again.');
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
        throw new Error('Name and Location are required');
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
        // Login first and save to localStorage
        login(response.data.token, response.data.user);
        
        // Force page reload to ensure fresh state
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
            if(window.confirm("It looks like this account was just created. Would you like to log in now?")) {
                setStep('PHONE');
                setPhoneNumber(phoneNumber); 
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
      <Navbar />
      <div className="container login-container">
        <div className={`login-card ${step === 'REGISTER' ? 'wide-card' : ''}`}>
          <div className="login-header">
            <h1 className="login-title">
              {step === 'PHONE' && 'Welcome Back'}
              {step === 'OTP' && 'Verify Phone'}
              {step === 'REGISTER' && 'Complete Profile'}
            </h1>
            <p className="login-subtitle">
              {step === 'PHONE' && 'Enter your phone number to continue'}
              {step === 'OTP' && `Enter the code sent to ${formatPhoneNumber(normalizeLebanesePhoneNumber(phoneNumber))}`}
              {step === 'REGISTER' && 'Tell us a bit about yourself'}
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {step === 'PHONE' && (
            <form onSubmit={handleSendOtp} className="login-form">
              <div className="form-group">
                <label>Phone Number</label>
                <div className="phone-input-wrapper">
                  <Phone size={20} className="input-icon" />
                  <input
                    type="tel"
                    placeholder="70 123 456"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <p className="input-hint">Accepted formats: 70123456, 03123456, 01 123 456</p>
              </div>
              <Button variant="primary" type="submit" className="login-btn" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <>Send Code <ArrowRight size={20} /></>}
              </Button>
            </form>
          )}

          {step === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="login-form">
              <div className="form-group">
                <label>Verification Code</label>
                <div className="otp-input-wrapper">
                  <input
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="otp-input"
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>
              <Button variant="primary" type="submit" className="login-btn" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Verify & Login'}
              </Button>
              <button 
                type="button" 
                className="back-link" 
                onClick={() => setStep('PHONE')}
                disabled={loading}
              >
                Change Phone Number
              </button>
            </form>
          )}

          {step === 'REGISTER' && (
            <form onSubmit={handleRegister} className="login-form register-grid animate-fade-in">
              <div className="register-left-col">
                <h3 className="section-title">Personal Details</h3>
                <div className="form-group">
                  <label>Full Name <span className="required-star">*</span></label>
                  <div className="input-wrapper">
                    <User size={20} className="input-icon" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={regData.name}
                      onChange={(e) => setRegData({...regData, name: e.target.value})}
                      required
                      className="form-input with-icon"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address <span className="optional-text">(Optional)</span></label>
                  <div className="input-wrapper">
                    <Mail size={20} className="input-icon" />
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={regData.email}
                      onChange={(e) => setRegData({...regData, email: e.target.value})}
                      className="form-input with-icon"
                    />
                  </div>
                  <p className="input-hint">We'll send order updates here.</p>
                </div>

                <div className="form-row">
                  <div className="form-group half-width">
                    <label>Age <span className="optional-text">(Optional)</span></label>
                    <div className="input-wrapper">
                      <Calendar size={20} className="input-icon" />
                      <input
                        type="number"
                        placeholder="25"
                        value={regData.age}
                        onChange={(e) => setRegData({...regData, age: e.target.value})}
                        min="13"
                        max="120"
                        className="form-input with-icon"
                      />
                    </div>
                  </div>
                  <div className="form-group half-width">
                    <label>Gender <span className="optional-text">(Optional)</span></label>
                    <div className="input-wrapper">
                      <User size={20} className="input-icon" />
                      <select
                        value={regData.gender}
                        onChange={(e) => setRegData({...regData, gender: e.target.value})}
                        className="form-input with-icon"
                      >
                        <option value="select" disabled>Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="register-right-col">
                <h3 className="section-title">Delivery Location</h3>
                <div className="form-group location-group">
                  <label>Pin your location <span className="required-star">*</span></label>
                  <div className="location-picker-wrapper">
                    <LocationPicker onLocationSelect={handleLocationSelect} initialLocation={regData.location} />
                  </div>
                </div>
              </div>

              <div className="register-actions">
                <Button variant="primary" type="submit" className="login-btn complete-profile-btn" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : 'Complete Registration'}
                </Button>
                
                <button 
                  type="button" 
                  className="back-link" 
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
