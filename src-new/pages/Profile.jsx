import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, MapPin, Mail, Calendar, Edit2, LogOut, Save, X, 
  Package, Settings, ChevronRight, ShoppingBag, Heart, ChevronDown, ChevronUp, AlertCircle, Phone, Camera, Upload, Plus 
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import LocationPicker from '../components/common/LocationPicker';
import api, { getStoredUser, clearAuthData, saveAuthData } from '../utils/api';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { normalizeLebanesePhoneNumber } from '../utils/phoneUtils';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, orders, settings
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Phone Change State
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState('INPUT'); // INPUT, OTP
  const [phoneError, setPhoneError] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  // Avatar Upload State
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    const loadUserData = async () => {
      const storedUser = getStoredUser();
      if (!storedUser) {
        navigate('/login');
        return;
      }
      
      // Optimistically set user from storage
      setUser(storedUser);
      setFormData(storedUser);

      try {
        // Fetch fresh data from backend to ensure sync
        const response = await api.get('/users/profile');
        const freshUser = response.data;
        
        // Update state and storage with fresh data
        setUser(freshUser);
        setFormData(freshUser);
        saveAuthData(localStorage.getItem('token'), freshUser);
        
        // Fetch orders
        fetchOrders();
      } catch (err) {
        console.error("Failed to refresh user data", err);
        // If token is invalid, logout
        if (err.response && err.response.status === 401) {
            clearAuthData();
            navigate('/login');
        }
      }
    };
    
    loadUserData();
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/myorders');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthData();
    navigate('/');
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await api.put('/users/profile', {
        name: formData.name,
        email: formData.email,
        location: formData.location,
        avatar: formData.avatar
      });
      
      const updatedUser = response.data;
      setUser(updatedUser);
      setFormData(updatedUser);
      saveAuthData(localStorage.getItem('token'), updatedUser);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setPhoneLoading(true);

    try {
      const normalizedPhone = normalizeLebanesePhoneNumber(newPhone);
      if (!normalizedPhone) {
        throw new Error('Invalid phone number format.');
      }

      const response = await api.post('/users/auth/send-otp', { phone: normalizedPhone });
      
      if (response.data.success) {
        if (response.data.otp) {
          alert(`DEV MODE: Your OTP is ${response.data.otp}`);
        }
        setPhoneStep('OTP');
      }
    } catch (err) {
      setPhoneError(err.response?.data?.message || err.message || 'Failed to send OTP');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhoneUpdate = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setPhoneLoading(true);

    try {
      const normalizedPhone = normalizeLebanesePhoneNumber(newPhone);
      const response = await api.put('/users/profile/phone', {
        phone: normalizedPhone,
        code: otp
      });

      if (response.data.success) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        setFormData(updatedUser);
        saveAuthData(localStorage.getItem('token'), updatedUser);
        setShowPhoneModal(false);
        setNewPhone('');
        setOtp('');
        setPhoneStep('INPUT');
        alert('Phone number updated successfully!');
      }
    } catch (err) {
      setPhoneError(err.response?.data?.message || 'Invalid OTP or phone number already in use');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleCancelOrder = async (e, orderId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await api.put(`/orders/${orderId}/cancel`);
      fetchOrders(); // Refresh list
      alert('Order cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel order', error);
      alert(error.message || 'Failed to cancel order');
    }
  };

  const toggleOrder = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  const handleLocationSelect = (locationData) => {
    const address = typeof locationData === 'string' ? locationData : locationData.address;
    setFormData(prev => ({
      ...prev,
      location: address
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      setLoading(true);
      setShowAvatarModal(false);
      
      const res = await api.post('/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const avatarUrl = res.data;
      
      // Update user profile immediately
      const response = await api.put('/users/profile', {
        name: user.name,
        email: user.email,
        location: user.location,
        avatar: avatarUrl
      });
      
      const updatedUser = response.data;
      setUser(updatedUser);
      setFormData(updatedUser);
      saveAuthData(localStorage.getItem('token'), updatedUser);
    } catch (err) {
      alert('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChoice = (type) => {
    setShowAvatarModal(false);
    setTimeout(() => {
      if (type === 'camera') {
        cameraInputRef.current?.click();
      } else {
        fileInputRef.current?.click();
      }
    }, 100);
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <Loading fullScreen text="Loading profile..." />
      </>
    );
  }

  const renderSidebar = () => {
    const avatarUrl = user.avatar || formData.avatar;
    const fullAvatarUrl = avatarUrl && !avatarUrl.startsWith('http') 
      ? `http://localhost:5001${avatarUrl}` 
      : avatarUrl;

    return (
      <div className="profile-sidebar">
        <div className="user-summary-card">
          <div className="avatar-wrapper">
            <div className="avatar-container" style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => setShowAvatarModal(true)}>
              {fullAvatarUrl ? (
                <img src={fullAvatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="avatar-placeholder">
                  {user.name ? user.name.charAt(0).toUpperCase() : <User size={40} />}
                </div>
              )}
              <div className="avatar-edit-overlay">
                <Plus size={24} strokeWidth={3} />
              </div>
            </div>
            <div className="avatar-badge">
              <User size={14} />
            </div>
          </div>
          <h3 className="user-name">{user.name || 'User'}</h3>
          <p className="user-email">{user.email || 'No email provided'}</p>
        <div className="user-stats">
          <div className="stat-item">
            <Package size={16} />
            <span>{orders.length} Orders</span>
          </div>
        </div>
      </div>

      <div className="profile-nav">
        <button 
          className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <User size={20} /> Overview
        </button>
        <button 
          className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <Package size={20} /> My Orders
        </button>
        <button 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={20} /> Settings
        </button>
        <button className="nav-item logout" onClick={handleLogout}>
          <LogOut size={20} /> Logout
        </button>
      </div>
    </div>
  );
};

  const renderOverview = () => (
    <div className="profile-content fade-in">
      <div className="section-header">
        <div>
          <h2 className="section-title">Profile Overview</h2>
          <p className="section-subtitle">Manage your personal information</p>
        </div>
        {!isEditing ? (
          <Button 
            variant="outline" 
            onClick={() => {
              console.log('Edit button clicked');
              setIsEditing(true);
            }}
          >
            <Edit2 size={16} style={{ marginRight: '8px' }} /> Edit Profile
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button 
              variant="secondary" 
              onClick={() => {
                setIsEditing(false);
                setFormData(user); // Reset form data to original
              }}
            >
              <X size={16} style={{ marginRight: '8px' }} /> Cancel
            </Button>
            <Button onClick={handleSaveProfile} loading={loading}>
              <Save size={16} style={{ marginRight: '8px' }} /> Save
            </Button>
          </div>
        )}
      </div>

      {/* Hidden file inputs for avatar upload */}
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <input 
        ref={cameraInputRef}
        type="file" 
        accept="image/*"
        capture="user"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">
            <User size={16} style={{ marginRight: '6px' }} />
            Full Name
          </label>
          <input 
            type="text" 
            className="form-input"
            value={formData.name || ''}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            disabled={!isEditing}
            placeholder="Enter your full name"
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            <Mail size={16} style={{ marginRight: '6px' }} />
            Email Address
          </label>
          <input 
            type="email" 
            className="form-input"
            value={formData.email || ''}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            disabled={!isEditing}
            placeholder="your.email@example.com"
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            <Phone size={16} style={{ marginRight: '6px' }} />
            Phone Number
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
              type="tel" 
              className="form-input"
              value={formData.phone || ''}
              disabled={true}
              style={{ flex: 1 }}
            />
            {isEditing && (
              <Button variant="outline" onClick={() => setShowPhoneModal(true)} style={{ whiteSpace: 'nowrap', padding: '0.75rem 1rem' }}>
                <Edit2 size={14} style={{ marginRight: '4px' }} />
                Change
              </Button>
            )}
          </div>
        </div>
        <div className="form-group form-group-full">
          <label className="form-label">
            <MapPin size={16} style={{ marginRight: '6px' }} />
            Location</label>
          {isEditing ? (
            <LocationPicker onLocationSelect={handleLocationSelect} initialLocation={formData.location} />
          ) : (
            <div className="form-input" style={{backgroundColor: '#f5f5f5', border: '1px solid #ddd', minHeight: '40px', display: 'flex', alignItems: 'center', padding: '0 12px'}}>
              {formData.location ? (formData.location.startsWith('Lat:') ? 'Location Pinned on Map' : formData.location) : 'No location set'}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="profile-content fade-in">
      <div className="section-header">
        <div>
          <h2 className="section-title">My Orders</h2>
          <p className="section-subtitle">Track and manage your orders</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No orders yet</h3>
          <p>Start shopping to see your orders here!</p>
          <Button onClick={() => navigate('/shop')} style={{ marginTop: '1rem' }}>
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order._id} className={`order-card ${expandedOrder === order._id ? 'expanded' : ''}`} onClick={() => toggleOrder(order._id)}>
              <div className="order-header">
                <div className="order-info">
                  <span className="order-id">Order #{order._id.slice(-6)}</span>
                  <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="order-status-container">
                  <span className={`order-status status-${order.status?.toLowerCase() || 'pending'}`}>
                    {order.status || 'Pending'}
                  </span>
                  {expandedOrder === order._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
              
              <div className="order-summary-row">
                <span>{order.orderItems?.length || 0} Items</span>
                <span className="order-total">${order.totalPrice?.toFixed(2)}</span>
              </div>

              {expandedOrder === order._id && (
                <div className="order-details fade-in">
                  <div className="order-items">
                    {order.orderItems.map((item, index) => (
                      <div key={index} className="order-item">
                        <div className="item-image">
                          {item.image ? <img src={item.image} alt={item.name} /> : <Package size={24} />}
                        </div>
                        <div className="item-info">
                          <div className="item-name">{item.name}</div>
                          <div className="item-meta">Qty: {item.qty} × ${item.price}</div>
                        </div>
                        <div className="item-total">${(item.qty * item.price).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="order-footer">
                    <div className="shipping-info">
                      <strong>Shipping to:</strong>
                      <p>{order.customerInfo?.address}, {order.customerInfo?.city}</p>
                    </div>
                    
                    {order.status === 'Pending' && (
                      <Button 
                        variant="outline" 
                        className="cancel-btn"
                        onClick={(e) => handleCancelOrder(e, order._id)}
                      >
                        Cancel Order
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="profile-content fade-in">
      <div className="section-header">
        <div>
          <h2 className="section-title">Account Settings</h2>
          <p className="section-subtitle">Manage your preferences</p>
        </div>
      </div>
      
      <div className="empty-state">
        <Settings size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h3>Settings Coming Soon</h3>
        <p>We are working on more features for you!</p>
      </div>
    </div>
  );

  if (initialLoading) {
    return <Loading text="Loading your profile..." />;
  }

  return (
    <div className="profile-page">
      {loading && <Loading text="Updating profile..." />}
      <Navbar />
      <div className="profile-container">
        {renderSidebar()}
        
        <div className="profile-main">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>

      {/* Avatar Upload Modal */}
      {showAvatarModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }} onClick={() => setShowAvatarModal(false)}>
          <div className="modal-content" style={{
            backgroundColor: 'white', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '400px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Change Profile Picture</h3>
              <button onClick={() => setShowAvatarModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                onClick={() => handleAvatarChoice('camera')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem',
                  background: '#f0fdf4', border: '2px solid #22c55e', borderRadius: '12px',
                  cursor: 'pointer', fontSize: '1rem', fontWeight: 600, color: '#16a34a',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#dcfce7'}
                onMouseOut={(e) => e.currentTarget.style.background = '#f0fdf4'}
              >
                <Camera size={24} />
                <span>Take a Photo</span>
              </button>

              <button
                onClick={() => handleAvatarChoice('file')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem',
                  background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '12px',
                  cursor: 'pointer', fontSize: '1rem', fontWeight: 600, color: '#334155',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
              >
                <Upload size={24} />
                <span>Choose from Files</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phone Change Modal */}
      {showPhoneModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Change Phone Number</h3>
              <button onClick={() => setShowPhoneModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            {phoneError && (
              <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {phoneError}
              </div>
            )}

            {phoneStep === 'INPUT' ? (
              <form onSubmit={handleSendOtp}>
                <div className="form-group">
                  <label className="form-label">New Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="70 123 456"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      style={{ paddingLeft: '40px' }}
                      autoFocus
                    />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                    We will send a verification code to this number.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                  <Button variant="secondary" onClick={() => setShowPhoneModal(false)} style={{ flex: 1 }}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={phoneLoading} style={{ flex: 1 }}>
                    Send Code
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneUpdate}>
                <div className="form-group">
                  <label className="form-label">Verification Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    style={{ letterSpacing: '2px', textAlign: 'center', fontSize: '1.2rem' }}
                    autoFocus
                  />
                  <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px', textAlign: 'center' }}>
                    Sent to {newPhone}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                  <Button variant="secondary" onClick={() => setPhoneStep('INPUT')} style={{ flex: 1 }}>
                    Back
                  </Button>
                  <Button type="submit" loading={phoneLoading} style={{ flex: 1 }}>
                    Verify & Update
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
