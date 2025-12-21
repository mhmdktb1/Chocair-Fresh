import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, MapPin, Mail, Calendar, Edit2, LogOut, Save, X, 
  Package, Settings, ChevronRight, ShoppingBag, Heart, ChevronDown, ChevronUp, AlertCircle 
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import api, { getStoredUser, clearAuthData, saveAuthData } from '../utils/api';
import Button from '../components/common/Button';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, orders, settings
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(storedUser);
      setFormData(storedUser);
      fetchOrders();
    }
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/myorders');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    }
  };

  const handleLogout = () => {
    clearAuthData();
    navigate('/');
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUser(formData);
      saveAuthData(localStorage.getItem('token'), formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile', error);
    } finally {
      setLoading(false);
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

  if (!user) return null;

  const renderSidebar = () => (
    <div className="profile-sidebar">
      <div className="user-summary-card">
        <div className="avatar-container">
          {user.name ? user.name.charAt(0).toUpperCase() : <User />}
        </div>
        <h3 className="user-name">{user.name || 'User'}</h3>
        <p className="user-email">{user.email}</p>
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

  const renderOverview = () => (
    <div className="profile-content fade-in">
      <div className="section-header">
        <div>
          <h2 className="section-title">Profile Overview</h2>
          <p className="section-subtitle">Manage your personal information</p>
        </div>
        {!isEditing ? (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit2 size={16} style={{ marginRight: '8px' }} /> Edit Profile
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              <X size={16} style={{ marginRight: '8px' }} /> Cancel
            </Button>
            <Button onClick={handleSaveProfile} loading={loading}>
              <Save size={16} style={{ marginRight: '8px' }} /> Save
            </Button>
          </div>
        )}
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input 
            type="text" 
            className="form-input"
            value={formData.name || ''}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            disabled={!isEditing}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input 
            type="email" 
            className="form-input"
            value={formData.email || ''}
            disabled={true} // Email usually can't be changed easily
          />
        </div>
        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input 
            type="tel" 
            className="form-input"
            value={formData.phone || ''}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            disabled={!isEditing}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Location</label>
          <input 
            type="text" 
            className="form-input"
            value={formData.location || ''}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            disabled={!isEditing}
          />
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

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-container">
        {renderSidebar()}
        
        <div className="profile-main">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
};

export default Profile;
