import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Mail, Calendar, Edit2, LogOut, Save, X } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { getStoredUser, clearAuthData, put, saveAuthData } from '../utils/api';
import Button from '../components/common/Button';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(storedUser);
      setFormData(storedUser);
    }
  }, [navigate]);

  const handleLogout = () => {
    clearAuthData();
    navigate('/');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Assuming there's an endpoint to update user profile
      // If not, we might need to create one or just update local storage for now
      // For this demo, we'll simulate an API call and update local storage
      
      // const response = await put('/users/profile', formData);
      // if (response.success) {
      //   setUser(response.user);
      //   saveAuthData(localStorage.getItem('token'), response.user);
      //   setIsEditing(false);
      // }

      // Simulating update since backend endpoint might not be ready
      setUser(formData);
      saveAuthData(localStorage.getItem('token'), formData);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      <Navbar />
      <div className="container profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <User size={40} color="#fff" />
            </div>
            <div className="profile-title">
              <h1>My Account</h1>
              <p>Manage your personal information</p>
            </div>
            <div className="profile-actions">
              {!isEditing ? (
                <button className="action-btn edit-btn" onClick={() => setIsEditing(true)}>
                  <Edit2 size={18} /> Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="action-btn cancel-btn" onClick={handleCancel} disabled={loading}>
                    <X size={18} /> Cancel
                  </button>
                  <button className="action-btn save-btn" onClick={handleSave} disabled={loading}>
                    <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
              <button className="action-btn logout-btn" onClick={handleLogout}>
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>

          <div className="profile-content">
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">
                  <User size={16} /> Full Name
                </div>
                {isEditing ? (
                  <input 
                    type="text" 
                    className="edit-input"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                ) : (
                  <div className="info-value">{user.name}</div>
                )}
              </div>

              <div className="info-item">
                <div className="info-label">
                  <MapPin size={16} /> Location
                </div>
                {isEditing ? (
                  <input 
                    type="text" 
                    className="edit-input"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                ) : (
                  <div className="info-value">{user.location || 'Not provided'}</div>
                )}
              </div>

              <div className="info-item">
                <div className="info-label">
                  <Mail size={16} /> Email Address
                </div>
                {isEditing ? (
                  <input 
                    type="email" 
                    className="edit-input"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                ) : (
                  <div className="info-value">{user.email || 'Not provided'}</div>
                )}
              </div>

              <div className="info-item">
                <div className="info-label">
                  <Calendar size={16} /> Age
                </div>
                {isEditing ? (
                  <input 
                    type="number" 
                    className="edit-input"
                    value={formData.age || ''}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                  />
                ) : (
                  <div className="info-value">{user.age || 'Not provided'}</div>
                )}
              </div>

              <div className="info-item">
                <div className="info-label">
                  <User size={16} /> Gender
                </div>
                {isEditing ? (
                  <select 
                    className="edit-input"
                    value={formData.gender || ''}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <div className="info-value" style={{textTransform: 'capitalize'}}>{user.gender || 'Not provided'}</div>
                )}
              </div>

              <div className="info-item full-width">
                <div className="info-label">
                  Phone Number (Cannot be changed)
                </div>
                <div className="info-value disabled">{user.phone}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
