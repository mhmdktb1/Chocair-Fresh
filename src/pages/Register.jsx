/**
 * ==========================================
 * REGISTER PAGE - USER REGISTRATION
 * ==========================================
 * 
 * Allows new users to create an account.
 * Validates input and calls AuthContext.registerUser().
 * Redirects to homepage on success.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { loading } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  // Error and success messages
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
  };

  /**
   * Validate form inputs
   */
  const validateForm = () => {
    const { name, email, password, confirmPassword, phone } = formData;

    // Check required fields
    if (!name.trim()) {
      setError('Please enter your name');
      return false;
    }

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
      setError('Please enter a password');
      return false;
    }

    // Password strength validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (!phone.trim()) {
      setError('Please enter your phone number');
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
      // Prepare data for API (exclude confirmPassword)
      const { confirmPassword, ...userData } = formData;

      // Call registerUser from AuthContext
      await registerUser(userData);

      // Show success message
      setSuccess('Registration successful! Redirecting...');

      // Clear form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
      });

      // Redirect to home page after 1.5 seconds
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Registration Disabled</h1>
            <p>Account creation is temporarily disabled — Dev mode active.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
