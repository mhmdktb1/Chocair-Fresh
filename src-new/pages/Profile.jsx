import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, MapPin, Mail, Calendar, Edit2, LogOut, Save, X, 
  Package, Settings, ChevronRight, ShoppingBag, ChevronDown, ChevronUp, 
  AlertCircle, Phone, Camera, Upload, Plus, ShieldCheck, Clock, Truck, 
  ArrowLeft, ArrowRight, CheckCircle, Sparkles, RefreshCw, Copy, Check, 
  MessageSquare, Home, Briefcase, Trash2, Bell, Heart, ExternalLink, 
  Award, Search, Filter, Shield, CheckCircle2, MapPinned, Globe, Moon, Sun, Palette
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import LocationPicker from '../components/common/LocationPicker';
import api, { getStoredUser, clearAuthData, saveAuthData, getAssetUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { translations } from '../utils/translations';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { normalizeLebanesePhoneNumber, formatPhoneNumber } from '../utils/phoneUtils';
import { formatCurrency, formatDate } from '../utils/formatters';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, updateUser, logout: authLogout, isAdmin } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  const { language, setLanguage, toggleLanguage, theme, setTheme, toggleTheme, isDark } = useTheme();
  const t = translations[language] || translations.en;

  const [user, setUser] = useState(null);
  const [openSections, setOpenSections] = useState({
    profile: false,
    orders: true,
    addresses: false,
    preferences: false,
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'active' | 'delivered' | 'cancelled'
  const [orderSearch, setOrderSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Phone Change State
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState('INPUT'); // 'INPUT' | 'OTP'
  const [phoneError, setPhoneError] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  // Avatar Upload State
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Saved Addresses State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    id: null,
    label: 'Home',
    address: '',
    city: 'Beirut',
    notes: '',
    isDefault: false
  });

  // Logout Confirm Modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const toggleSection = (sectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const expandAndScrollToSection = (sectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: true
    }));
    setTimeout(() => {
      const el = document.getElementById(`section-${sectionKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Preferences State
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('cf_user_prefs');
      return saved ? JSON.parse(saved) : {
        whatsappNotifications: true,
        harvestAlerts: true,
        deliveryWindow: 'afternoon',
        language: 'en'
      };
    } catch {
      return {
        whatsappNotifications: true,
        harvestAlerts: true,
        deliveryWindow: 'afternoon',
        language: 'en'
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('cf_user_prefs', JSON.stringify(preferences));
  }, [preferences]);

  // Handle query or location navigation state
  useEffect(() => {
    if (location.state?.activeTab) {
      const tab = location.state.activeTab;
      if (tab === 'overview') expandAndScrollToSection('profile');
      else if (tab === 'orders') expandAndScrollToSection('orders');
      else if (tab === 'addresses') expandAndScrollToSection('addresses');
      else if (tab === 'settings') expandAndScrollToSection('preferences');
    }
  }, [location.state]);

  // Initial load
  useEffect(() => {
    const loadUserData = async () => {
      const storedUser = getStoredUser();
      if (!storedUser) {
        navigate('/login');
        return;
      }
      
      setUser(storedUser);
      setFormData(storedUser);

      try {
        const response = await api.get('/users/profile');
        const freshUser = response.data;
        
        setUser(freshUser);
        setFormData(freshUser);
        saveAuthData(localStorage.getItem('token'), freshUser);
        if (updateUser) updateUser(freshUser);
        
        await fetchOrders();
      } catch (err) {
        console.error("Failed to refresh user data", err);
        if (err.response && err.response.status === 401) {
          clearAuthData();
          if (authLogout) authLogout();
          navigate('/login');
        }
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadUserData();
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/myorders');
      setOrders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    clearAuthData();
    if (authLogout) authLogout();
    toast.info('Logged out successfully');
    navigate('/');
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await api.put('/users/profile', {
        name: formData.name,
        email: formData.email,
        location: formData.location,
        avatar: formData.avatar,
        addresses: formData.addresses || user.addresses || []
      });
      
      const updatedUser = response.data;
      setUser(updatedUser);
      setFormData(updatedUser);
      saveAuthData(localStorage.getItem('token'), updatedUser);
      if (updateUser) updateUser(updatedUser);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
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
        throw new Error('Please enter a valid Lebanese phone number (e.g. 70 123 456).');
      }

      const response = await api.post('/users/auth/send-otp', { phone: normalizedPhone });
      
      if (response.data.success) {
        if (response.data.otp) {
          toast.success(`Verification Code: ${response.data.otp}`, { autoClose: 15000 });
          setOtp(response.data.otp);
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
        if (updateUser) updateUser(updatedUser);
        setShowPhoneModal(false);
        setNewPhone('');
        setOtp('');
        setPhoneStep('INPUT');
        toast.success('Phone number updated successfully!');
      }
    } catch (err) {
      setPhoneError(err.response?.data?.message || 'Invalid OTP code or phone number already in use');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleCancelOrder = async (e, orderId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await api.put(`/orders/${orderId}/cancel`);
      fetchOrders();
      toast.success('Order cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel order', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to cancel order');
    }
  };

  const handleReorder = (e, order) => {
    e.stopPropagation();
    if (!order.orderItems || order.orderItems.length === 0) {
      toast.error('No items found in this order');
      return;
    }

    let addedCount = 0;
    order.orderItems.forEach(item => {
      const productObj = {
        _id: item.product || item._id,
        name: item.name,
        price: item.price,
        image: item.image,
      };
      addToCart(productObj, item.qty || 1);
      addedCount += (item.qty || 1);
    });

    setIsCartOpen(true);
    toast.success(`Added ${order.orderItems.length} items to your cart!`);
  };

  const handleCopyOrderId = (e, orderId) => {
    e.stopPropagation();
    const formatted = `#${orderId.slice(-6).toUpperCase()}`;
    navigator.clipboard?.writeText(orderId);
    setCopiedId(orderId);
    toast.info(`Order ID ${formatted} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleWhatsAppHelp = (e, order) => {
    e.stopPropagation();
    const orderCode = `#${order._id.slice(-6).toUpperCase()}`;
    const text = encodeURIComponent(`Hi Chocair Fresh! I need assistance with my Order ${orderCode}.`);
    window.open(`https://wa.me/96170123456?text=${text}`, '_blank');
  };

  const toggleOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
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
      
      const response = await api.put('/users/profile', {
        name: user.name,
        email: user.email,
        location: user.location,
        avatar: avatarUrl,
        addresses: user.addresses || []
      });
      
      const updatedUser = response.data;
      setUser(updatedUser);
      setFormData(updatedUser);
      saveAuthData(localStorage.getItem('token'), updatedUser);
      if (updateUser) updateUser(updatedUser);
      toast.success('Avatar updated successfully!');
    } catch (err) {
      toast.error('Failed to upload image');
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

  // Saved Addresses Management
  const handleOpenAddAddress = () => {
    setAddressForm({
      id: null,
      label: 'Home',
      address: '',
      city: 'Beirut',
      notes: '',
      isDefault: (user?.addresses?.length || 0) === 0
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.address.trim()) {
      toast.error('Please enter a valid address');
      return;
    }

    setLoading(true);
    try {
      let updatedAddresses = [...(user.addresses || [])];

      if (addressForm.isDefault) {
        updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
      }

      if (addressForm.id) {
        // Edit existing
        updatedAddresses = updatedAddresses.map(a => 
          a._id === addressForm.id || a.id === addressForm.id 
            ? { ...addressForm, _id: addressForm.id } 
            : a
        );
      } else {
        // Add new
        updatedAddresses.push({
          ...addressForm,
          _id: Date.now().toString()
        });
      }

      // If user default location is empty or updated address is default, update default location
      let newLocation = user.location;
      if (addressForm.isDefault || !newLocation) {
        newLocation = addressForm.address;
      }

      const response = await api.put('/users/profile', {
        ...user,
        location: newLocation,
        addresses: updatedAddresses
      });

      const updatedUser = response.data;
      setUser(updatedUser);
      setFormData(updatedUser);
      saveAuthData(localStorage.getItem('token'), updatedUser);
      if (updateUser) updateUser(updatedUser);
      setShowAddressModal(false);
      toast.success(addressForm.id ? 'Address updated!' : 'Address added!');
    } catch (err) {
      console.error('Failed to save address', err);
      toast.error('Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    
    setLoading(true);
    try {
      const updatedAddresses = (user.addresses || []).filter(a => a._id !== addressId && a.id !== addressId);
      const response = await api.put('/users/profile', {
        ...user,
        addresses: updatedAddresses
      });

      const updatedUser = response.data;
      setUser(updatedUser);
      setFormData(updatedUser);
      saveAuthData(localStorage.getItem('token'), updatedUser);
      if (updateUser) updateUser(updatedUser);
      toast.success('Address removed');
    } catch (err) {
      toast.error('Failed to remove address');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultAddress = async (address) => {
    setLoading(true);
    try {
      const updatedAddresses = (user.addresses || []).map(a => ({
        ...a,
        isDefault: (a._id === address._id || a.id === address.id)
      }));

      const response = await api.put('/users/profile', {
        ...user,
        location: address.address,
        addresses: updatedAddresses
      });

      const updatedUser = response.data;
      setUser(updatedUser);
      setFormData(updatedUser);
      saveAuthData(localStorage.getItem('token'), updatedUser);
      if (updateUser) updateUser(updatedUser);
      toast.success('Default delivery address updated!');
    } catch (err) {
      toast.error('Failed to set default address');
    } finally {
      setLoading(false);
    }
  };

  // Order stats calculations
  const totalSpent = useMemo(() => {
    return orders
      .filter(o => (o.status || '').toLowerCase() !== 'cancelled')
      .reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
  }, [orders]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter(o => {
      const st = (o.status || 'pending').toLowerCase();
      return ['pending', 'processing', 'confirmed', 'shipped', 'out_for_delivery'].includes(st);
    }).length;
  }, [orders]);

  const rewardPoints = useMemo(() => {
    return Math.floor(totalSpent * 10);
  }, [totalSpent]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const status = (order.status || 'pending').toLowerCase();
      
      // Status tab match
      let matchesTab = true;
      if (orderFilter === 'active') {
        matchesTab = ['pending', 'processing', 'confirmed', 'shipped', 'out_for_delivery'].includes(status);
      } else if (orderFilter === 'delivered') {
        matchesTab = status === 'delivered';
      } else if (orderFilter === 'cancelled') {
        matchesTab = status === 'cancelled';
      }

      if (!matchesTab) return false;

      // Search term match
      if (orderSearch.trim()) {
        const query = orderSearch.toLowerCase().trim();
        const idMatch = order._id?.toLowerCase().includes(query);
        const itemMatch = order.orderItems?.some(i => i.name?.toLowerCase().includes(query));
        return idMatch || itemMatch;
      }

      return true;
    });
  }, [orders, orderFilter, orderSearch]);

  if (initialLoading) {
    return <Loading text="Loading your account..." />;
  }

  if (!user) {
    return null;
  }

  const avatarUrl = user.avatar || formData.avatar;
  const fullAvatarUrl = avatarUrl ? getAssetUrl(avatarUrl) : '';

  // Order Progress Stage Helper
  const getOrderProgressStep = (status) => {
    const st = (status || 'pending').toLowerCase();
    if (st === 'cancelled') return -1;
    if (st === 'delivered') return 4;
    if (st === 'shipped' || st === 'out_for_delivery') return 3;
    if (st === 'processing' || st === 'confirmed') return 2;
    return 1; // Pending / Placed
  };

  // ==========================================
  // TAB: OVERVIEW & PROFILE EDIT
  // ==========================================
  const renderOverview = () => (
    <div className="profile-section-card fade-in">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">Personal Information</h2>
          <p className="section-subtitle">Manage your personal profile and primary delivery location</p>
        </div>
        {!isEditing ? (
          <button 
            type="button" 
            className="account-action-pill-btn"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 size={15} />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="edit-btn-actions">
            <button 
              type="button" 
              className="account-cancel-pill-btn"
              onClick={() => {
                setIsEditing(false);
                setFormData(user);
              }}
            >
              <X size={15} />
              <span>Cancel</span>
            </button>
            <button 
              type="button" 
              className="account-save-pill-btn"
              onClick={handleSaveProfile}
              disabled={loading}
            >
              <Save size={15} />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="profile-fields-grid">
        {/* Full Name */}
        <div className="profile-field-box">
          <label className="profile-field-label">
            <User size={15} /> Full Name
          </label>
          <input 
            type="text" 
            className="profile-field-input"
            value={formData.name || ''}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            disabled={!isEditing}
            placeholder="e.g. Walid Chocair"
          />
        </div>

        {/* WhatsApp Phone */}
        <div className="profile-field-box">
          <label className="profile-field-label">
            <Phone size={15} /> WhatsApp Number
            {user.phone ? (
              <span className="verified-badge-pill">
                <CheckCircle2 size={12} /> Verified
              </span>
            ) : (
              <span className="unverified-badge-pill">
                <AlertCircle size={12} /> Unlinked
              </span>
            )}
          </label>
          <div className="phone-input-action-row">
            <input 
              type="tel" 
              className="profile-field-input phone-input"
              value={formData.phone ? formatPhoneNumber(formData.phone) : 'No WhatsApp phone linked'}
              disabled={true}
            />
            {isEditing && (
              <button 
                type="button" 
                className="change-phone-btn"
                onClick={() => {
                  setNewPhone('');
                  setOtp('');
                  setPhoneError('');
                  setPhoneStep('INPUT');
                  setShowPhoneModal(true);
                }}
              >
                Change
              </button>
            )}
          </div>
        </div>

        {/* Email Address */}
        <div className="profile-field-box">
          <label className="profile-field-label">
            <Mail size={15} /> Email Address <span className="opt-tag">(Optional)</span>
          </label>
          <input 
            type="email" 
            className="profile-field-input"
            value={formData.email || ''}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            disabled={!isEditing}
            placeholder="your.email@example.com"
          />
        </div>

        {/* Member Since / Loyalty */}
        <div className="profile-field-box">
          <label className="profile-field-label">
            <Award size={15} /> Membership Tier
          </label>
          <div className="tier-display-box">
            <div className="tier-badge-icon">
              <Sparkles size={16} />
            </div>
            <div className="tier-info">
              <span className="tier-name">{isAdmin ? 'Store Administrator' : 'Fresh VIP Member'}</span>
              <span className="tier-perks">Free Priority Delivery & Fresh Harvest Perks</span>
            </div>
          </div>
        </div>

        {/* Delivery Location Section */}
        <div className="profile-field-box full-width">
          <div className="field-label-with-action">
            <label className="profile-field-label">
              <MapPin size={15} /> Primary Delivery Address
            </label>
            <span className="address-helper-text">Used for instant 1-tap checkout</span>
          </div>

          {isEditing ? (
            <div className="location-picker-wrapper">
              <LocationPicker onLocationSelect={handleLocationSelect} initialLocation={formData.location} />
            </div>
          ) : (
            <div className="location-preview-card">
              <div className="location-pin-icon-wrap">
                <MapPinned size={22} />
              </div>
              <div className="location-preview-content">
                <span className="location-main-text">
                  {formData.location ? (formData.location.startsWith('Lat:') ? 'Custom GPS Pinned Location' : formData.location) : 'No primary delivery address specified'}
                </span>
                <span className="location-sub-text">
                  Lebanon Delivery Network • Guaranteed Fresh On-Time Dispatch
                </span>
              </div>
              <button 
                type="button" 
                className="edit-addr-quick-btn"
                onClick={() => setIsEditing(true)}
              >
                Update
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ==========================================
  // TAB: ORDERS & DELIVERIES
  // ==========================================
  const renderOrders = () => (
    <div className="profile-section-card fade-in">
      <div className="orders-section-header">
        <div>
          <h2 className="section-title">Order History & Deliveries</h2>
          <p className="section-subtitle">Real-time status tracking, instant reordering, and item receipts</p>
        </div>
        <Button 
          variant="outline" 
          size="small" 
          onClick={() => navigate('/shop')} 
          className="header-shop-btn"
        >
          <ShoppingBag size={14} style={{ marginRight: 6 }} /> Shop Fresh
        </Button>
      </div>

      {/* Orders Filter & Search Toolbar */}
      <div className="orders-toolbar-wrap">
        <div className="order-filter-chips">
          <button 
            type="button" 
            className={`filter-chip ${orderFilter === 'all' ? 'active' : ''}`}
            onClick={() => setOrderFilter('all')}
          >
            All ({orders.length})
          </button>
          <button 
            type="button" 
            className={`filter-chip ${orderFilter === 'active' ? 'active' : ''}`}
            onClick={() => setOrderFilter('active')}
          >
            Active ({activeOrdersCount})
          </button>
          <button 
            type="button" 
            className={`filter-chip ${orderFilter === 'delivered' ? 'active' : ''}`}
            onClick={() => setOrderFilter('delivered')}
          >
            Delivered
          </button>
          <button 
            type="button" 
            className={`filter-chip ${orderFilter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setOrderFilter('cancelled')}
          >
            Cancelled
          </button>
        </div>

        <div className="order-search-box">
          <Search size={15} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by order # or item..." 
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
          />
          {orderSearch && (
            <button type="button" className="clear-search-btn" onClick={() => setOrderSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-orders-view">
          <div className="empty-icon-circle">
            <ShoppingBag size={38} />
          </div>
          <h3>No Orders Found</h3>
          <p>
            {orderSearch 
              ? `No orders matching "${orderSearch}". Try searching for another item or order ID.`
              : orderFilter !== 'all' 
                ? `You have no ${orderFilter} orders currently.`
                : "You haven't placed any fresh grocery orders yet."}
          </p>
          <Button variant="primary" onClick={() => navigate('/shop')} className="start-fresh-shop-btn">
            Explore Daily Harvest <ArrowRight size={16} style={{ marginLeft: 6 }} />
          </Button>
        </div>
      ) : (
        <div className="orders-cards-list">
          {filteredOrders.map(order => {
            const isExpanded = expandedOrder === order._id;
            const statusLower = (order.status || 'pending').toLowerCase();
            const progressStep = getOrderProgressStep(order.status);
            const isCancelled = statusLower === 'cancelled';
            const orderCode = `#${order._id.slice(-6).toUpperCase()}`;

            return (
              <div 
                key={order._id} 
                className={`redesigned-order-card ${isExpanded ? 'is-expanded' : ''} ${isCancelled ? 'is-cancelled' : ''}`}
                onClick={() => toggleOrder(order._id)}
              >
                {/* Order Top Bar */}
                <div className="order-card-header">
                  <div className="order-main-meta">
                    <div className="order-code-badge">
                      <span className="order-id-label">{orderCode}</span>
                      <button 
                        type="button" 
                        className="copy-id-btn" 
                        onClick={(e) => handleCopyOrderId(e, order._id)}
                        title="Copy Order ID"
                      >
                        {copiedId === order._id ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                      </button>
                    </div>
                    <span className="order-date-tag">
                      <Calendar size={13} /> {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <div className="order-header-right">
                    <span className={`order-status-pill status-${statusLower}`}>
                      {order.status || 'Pending'}
                    </span>
                    <button 
                      type="button" 
                      className="order-expand-toggle"
                      aria-label={isExpanded ? "Collapse Order" : "Expand Order"}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Visual Order Progress Tracker (Only for non-cancelled) */}
                {!isCancelled && (
                  <div className="order-progress-tracker" onClick={(e) => e.stopPropagation()}>
                    <div className={`progress-step ${progressStep >= 1 ? 'completed' : ''} ${progressStep === 1 ? 'current' : ''}`}>
                      <div className="step-dot">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span className="step-label">Placed</span>
                    </div>

                    <div className={`progress-line ${progressStep >= 2 ? 'completed' : ''}`} />

                    <div className={`progress-step ${progressStep >= 2 ? 'completed' : ''} ${progressStep === 2 ? 'current' : ''}`}>
                      <div className="step-dot">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span className="step-label">Confirmed</span>
                    </div>

                    <div className={`progress-line ${progressStep >= 3 ? 'completed' : ''}`} />

                    <div className={`progress-step ${progressStep >= 3 ? 'completed' : ''} ${progressStep === 3 ? 'current' : ''}`}>
                      <div className="step-dot">
                        <Truck size={12} strokeWidth={2.5} />
                      </div>
                      <span className="step-label">On The Way</span>
                    </div>

                    <div className={`progress-line ${progressStep >= 4 ? 'completed' : ''}`} />

                    <div className={`progress-step ${progressStep >= 4 ? 'completed' : ''} ${progressStep === 4 ? 'current' : ''}`}>
                      <div className="step-dot">
                        <CheckCircle size={12} strokeWidth={2.5} />
                      </div>
                      <span className="step-label">Delivered</span>
                    </div>
                  </div>
                )}

                {/* Order Summary Bar */}
                <div className="order-card-mid-summary">
                  <div className="items-preview-stack">
                    <div className="items-mini-thumbnails">
                      {order.orderItems?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="mini-thumb">
                          {item.image ? (
                            <img src={item.image} alt={item.name} />
                          ) : (
                            <Package size={14} color="#94a3b8" />
                          )}
                        </div>
                      ))}
                      {(order.orderItems?.length || 0) > 3 && (
                        <div className="mini-thumb-more">
                          +{(order.orderItems?.length || 0) - 3}
                        </div>
                      )}
                    </div>
                    <span className="order-item-count-text">
                      {order.orderItems?.length || 0} {order.orderItems?.length === 1 ? 'fresh item' : 'fresh items'}
                    </span>
                  </div>

                  <div className="order-total-price-box">
                    <span className="total-label">Total Amount</span>
                    <span className="total-value">{formatCurrency(order.totalPrice || 0)}</span>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="order-drawer-content fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="drawer-divider" />

                    {/* Line Items List */}
                    <div className="line-items-header">
                      <span>Purchased Items</span>
                      <span>Subtotal</span>
                    </div>
                    
                    <div className="order-line-items-list">
                      {order.orderItems?.map((item, idx) => (
                        <div key={idx} className="line-item-card">
                          <div className="item-img-frame">
                            {item.image ? (
                              <img src={item.image} alt={item.name} />
                            ) : (
                              <Package size={20} color="#94a3b8" />
                            )}
                          </div>
                          <div className="item-info-col">
                            <span className="item-title">{item.name}</span>
                            <span className="item-qty-rate">
                              Quantity: {item.qty} × {formatCurrency(item.price)}
                            </span>
                          </div>
                          <span className="item-row-total">
                            {formatCurrency(item.qty * item.price)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Delivery & Payment Details */}
                    <div className="order-meta-info-grid">
                      <div className="meta-info-card">
                        <div className="meta-card-title">
                          <Truck size={14} /> Delivery Address
                        </div>
                        <p className="meta-card-text">
                          {order.customerInfo?.address || order.shippingAddress?.address || 'Standard Delivery Spot, Lebanon'}
                        </p>
                      </div>

                      <div className="meta-info-card">
                        <div className="meta-card-title">
                          <Phone size={14} /> Recipient Phone
                        </div>
                        <p className="meta-card-text">
                          {order.customerInfo?.phone ? formatPhoneNumber(order.customerInfo.phone) : (user.phone ? formatPhoneNumber(user.phone) : 'Phone on file')}
                        </p>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="order-actions-bar">
                      <button 
                        type="button" 
                        className="reorder-action-btn"
                        onClick={(e) => handleReorder(e, order)}
                      >
                        <RefreshCw size={15} />
                        <span>Reorder All Items</span>
                      </button>

                      <button 
                        type="button" 
                        className="whatsapp-help-btn"
                        onClick={(e) => handleWhatsAppHelp(e, order)}
                      >
                        <MessageSquare size={15} />
                        <span>WhatsApp Help</span>
                      </button>

                      {order.status === 'Pending' && (
                        <button 
                          type="button" 
                          className="cancel-order-pill-btn"
                          onClick={(e) => handleCancelOrder(e, order._id)}
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ==========================================
  // TAB: SAVED ADDRESSES
  // ==========================================
  const renderAddresses = () => {
    const savedAddresses = user.addresses || [];

    return (
      <div className="profile-section-card fade-in">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">Saved Delivery Addresses</h2>
            <p className="section-subtitle">Manage multiple drop-off points for lightning-fast checkout</p>
          </div>
          <button 
            type="button" 
            className="account-action-pill-btn"
            onClick={handleOpenAddAddress}
          >
            <Plus size={16} />
            <span>Add New Address</span>
          </button>
        </div>

        {savedAddresses.length === 0 ? (
          <div className="empty-addresses-box">
            <div className="empty-icon-circle">
              <MapPin size={38} />
            </div>
            <h3>No Saved Addresses</h3>
            <p>Save your home, work, or chalet address to skip typing at checkout.</p>
            <Button variant="primary" onClick={handleOpenAddAddress} className="add-first-address-btn">
              <Plus size={16} style={{ marginRight: 6 }} /> Add Address
            </Button>
          </div>
        ) : (
          <div className="saved-addresses-grid">
            {savedAddresses.map((addr, index) => {
              const isDefault = addr.isDefault || (!savedAddresses.some(a => a.isDefault) && index === 0);
              const labelLower = (addr.label || 'home').toLowerCase();

              return (
                <div key={addr._id || index} className={`address-card ${isDefault ? 'is-default' : ''}`}>
                  <div className="address-card-header">
                    <div className="address-label-badge">
                      {labelLower === 'work' ? (
                        <Briefcase size={15} />
                      ) : labelLower === 'home' ? (
                        <Home size={15} />
                      ) : (
                        <MapPin size={15} />
                      )}
                      <span>{addr.label || 'Saved Location'}</span>
                    </div>

                    {isDefault ? (
                      <span className="default-address-chip">
                        <Check size={12} strokeWidth={3} /> Default
                      </span>
                    ) : (
                      <button 
                        type="button" 
                        className="make-default-btn"
                        onClick={() => handleSetDefaultAddress(addr)}
                      >
                        Set as Default
                      </button>
                    )}
                  </div>

                  <div className="address-card-body">
                    <p className="address-text-line">{addr.address}</p>
                    {addr.notes && (
                      <p className="address-notes-line">
                        <span className="notes-tag">Note:</span> {addr.notes}
                      </p>
                    )}
                  </div>

                  <div className="address-card-actions">
                    <button 
                      type="button" 
                      className="addr-action-btn delete"
                      onClick={() => handleDeleteAddress(addr._id || addr.id)}
                      title="Delete Address"
                    >
                      <Trash2 size={15} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // TAB: PREFERENCES & SETTINGS
  // ==========================================
  const renderSettings = () => (
    <div className="profile-section-card fade-in">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">{t.preferencesSecurity}</h2>
          <p className="section-subtitle">Customize language, dark mode, delivery timing, and security</p>
        </div>
      </div>

      <div className="settings-groups-stack">
        {/* Appearance & Language Selection */}
        <div className="settings-group-card">
          <h3 className="settings-group-title">
            <Palette size={18} /> {t.themeOption} & {t.languageOption}
          </h3>

          {/* Language Selector */}
          <div className="settings-toggle-row">
            <div className="toggle-text-col">
              <span className="toggle-title"><Globe size={14} style={{ display: 'inline', marginRight: 4 }} /> {t.languageOption}</span>
              <span className="toggle-desc">Switch between English and Arabic (with right-to-left alignment).</span>
            </div>
            <div className="segmented-choice-pill">
              <button 
                type="button" 
                className={`choice-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
              >
                English
              </button>
              <button 
                type="button" 
                className={`choice-btn ${language === 'ar' ? 'active' : ''}`}
                onClick={() => setLanguage('ar')}
              >
                العربية
              </button>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="settings-toggle-row">
            <div className="toggle-text-col">
              <span className="toggle-title">
                {isDark ? <Moon size={14} style={{ display: 'inline', marginRight: 4 }} /> : <Sun size={14} style={{ display: 'inline', marginRight: 4 }} />}
                {t.themeOption}
              </span>
              <span className="toggle-desc">Choose between vibrant fresh daylight theme or modern dark mode.</span>
            </div>
            <div className="segmented-choice-pill">
              <button 
                type="button" 
                className={`choice-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                <Sun size={13} /> {t.lightMode}
              </button>
              <button 
                type="button" 
                className={`choice-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                <Moon size={13} /> {t.darkMode}
              </button>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="settings-group-card">
          <h3 className="settings-group-title">
            <Bell size={18} /> {t.notificationPrefs}
          </h3>
          
          <div className="settings-toggle-row">
            <div className="toggle-text-col">
              <span className="toggle-title">{t.whatsAppAlerts}</span>
              <span className="toggle-desc">Receive real-time driver updates and dispatch confirmations on WhatsApp.</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={preferences.whatsappNotifications}
                onChange={(e) => setPreferences({...preferences, whatsappNotifications: e.target.checked})}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="toggle-text-col">
              <span className="toggle-title">{t.harvestAlerts}</span>
              <span className="toggle-desc">Get notified when new seasonal fruits, fresh berries, or flash sales drop.</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={preferences.harvestAlerts}
                onChange={(e) => setPreferences({...preferences, harvestAlerts: e.target.checked})}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        {/* Delivery Schedule Preferences */}
        <div className="settings-group-card">
          <h3 className="settings-group-title">
            <Clock size={18} /> {t.deliveryWindow}
          </h3>
          <p className="settings-group-desc">Choose when our refrigerated farm vans should prioritize your orders.</p>

          <div className="delivery-window-options">
            <label className={`window-radio-option ${preferences.deliveryWindow === 'morning' ? 'selected' : ''}`}>
              <input 
                type="radio" 
                name="deliveryWindow" 
                value="morning"
                checked={preferences.deliveryWindow === 'morning'}
                onChange={() => setPreferences({...preferences, deliveryWindow: 'morning'})}
              />
              <div className="window-radio-content">
                <span className="window-title">{t.morningWindow}</span>
                <span className="window-sub">Ideal for early fresh kitchen prep and daily cooking</span>
              </div>
            </label>

            <label className={`window-radio-option ${preferences.deliveryWindow === 'afternoon' ? 'selected' : ''}`}>
              <input 
                type="radio" 
                name="deliveryWindow" 
                value="afternoon"
                checked={preferences.deliveryWindow === 'afternoon'}
                onChange={() => setPreferences({...preferences, deliveryWindow: 'afternoon'})}
              />
              <div className="window-radio-content">
                <span className="window-title">{t.afternoonWindow}</span>
                <span className="window-sub">Fresh delivery right after work or school</span>
              </div>
            </label>
          </div>
        </div>

        {/* Admin Shortcut if applicable */}
        {isAdmin && (
          <div className="settings-group-card admin-highlight-card">
            <div className="admin-card-inner">
              <div className="admin-badge-icon">
                <ShieldCheck size={22} />
              </div>
              <div className="admin-text-col">
                <span className="admin-card-title">Store Management Portal</span>
                <span className="admin-card-desc">Access live inventory controls, orders dispatch, and hero configuration.</span>
              </div>
              <Button variant="primary" onClick={() => navigate('/admin')} className="launch-admin-btn">
                Launch Admin <ExternalLink size={14} style={{ marginLeft: 6 }} />
              </Button>
            </div>
          </div>
        )}

        {/* Account Security & Signout */}
        <div className="settings-group-card danger-zone">
          <h3 className="settings-group-title danger">
            <Shield size={18} /> {t.accountSession}
          </h3>
          <div className="danger-zone-row">
            <div className="danger-text-col">
              <span className="danger-title">Sign Out of Chocair Fresh</span>
              <span className="danger-desc">{t.signOutDesc}</span>
            </div>
            <button 
              type="button" 
              className="danger-signout-btn"
              onClick={() => setShowLogoutModal(true)}
            >
              <LogOut size={15} />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="profile-page">
      {loading && <Loading text="Updating your account..." />}
      
      {/* Desktop Navbar */}
      <div className="profile-desktop-nav">
        <Navbar />
      </div>

      {/* Mobile Sticky Top Header */}
      <header className="profile-mobile-header">
        <button 
          type="button" 
          className="profile-mobile-back-btn" 
          onClick={() => navigate(-1)}
          aria-label="Go Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="profile-mobile-title-wrap">
          <h1 className="profile-mobile-title">{t.profileTitle}</h1>
        </div>
        <div className="profile-header-actions">
          <button 
            type="button" 
            className="profile-mobile-lang-btn"
            onClick={toggleLanguage}
            title={language === 'en' ? 'عربي' : 'EN'}
          >
            <Globe size={13} />
            <span>{language === 'en' ? 'عربي' : 'EN'}</span>
          </button>
          <button 
            type="button" 
            className="profile-mobile-theme-btn"
            onClick={toggleTheme}
            title={isDark ? 'Light' : 'Dark'}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button 
            type="button" 
            className="profile-mobile-logout-icon-btn"
            onClick={() => setShowLogoutModal(true)}
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="container profile-container">
        
        {/* ==========================================
            HERO MEMBER IDENTITY CARD
            ========================================== */}
        <div className="profile-hero-card">
          <div className="hero-card-left">
            <div className="avatar-interaction-wrap">
              <div 
                className="hero-avatar" 
                onClick={() => setShowAvatarModal(true)}
                title="Change Photo"
              >
                {fullAvatarUrl ? (
                  <img src={fullAvatarUrl} alt={user.name} className="avatar-img" />
                ) : (
                  <div className="avatar-letter">
                    {user.name ? user.name.charAt(0).toUpperCase() : <User size={38} />}
                  </div>
                )}
                <div className="avatar-camera-overlay">
                  <Camera size={14} />
                </div>
              </div>
            </div>

            <div className="hero-identity-text">
              <div className="hero-name-row">
                <h2 className="hero-user-name">{user.name || 'Fresh Customer'}</h2>
                {isAdmin && <span className="admin-badge-pill">Admin</span>}
              </div>
              
              <div className="hero-contact-row">
                <span className="hero-phone-item">
                  <Phone size={13} /> {user.phone ? formatPhoneNumber(user.phone) : 'No phone linked'}
                </span>
                {user.email && (
                  <span className="hero-email-item">
                    <Mail size={13} /> {user.email}
                  </span>
                )}
              </div>

              <div className="hero-tier-tag-wrap">
                <span className="hero-tier-tag">
                  <Sparkles size={12} /> {isAdmin ? 'Administrator' : 'Fresh VIP Member'}
                </span>
                <span className="hero-loc-tag">
                  <MapPin size={12} /> {user.location ? (user.location.startsWith('Lat:') ? 'Pinned Location' : user.location.slice(0, 24) + (user.location.length > 24 ? '...' : '')) : 'Lebanon'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stat Counter Cards */}
          <div className="hero-stats-row">
            <div className="hero-stat-card" onClick={() => { setOrderFilter('all'); expandAndScrollToSection('orders'); }}>
              <div className="stat-icon-wrap orders">
                <Package size={18} />
              </div>
              <div className="stat-numbers">
                <span className="stat-value">{orders.length}</span>
                <span className="stat-label">Total Orders</span>
              </div>
            </div>

            <div className="hero-stat-card" onClick={() => { setOrderFilter('active'); expandAndScrollToSection('orders'); }}>
              <div className="stat-icon-wrap active-orders">
                <Truck size={18} />
              </div>
              <div className="stat-numbers">
                <span className="stat-value">{activeOrdersCount}</span>
                <span className="stat-label">In Transit</span>
              </div>
            </div>

            <div className="hero-stat-card" onClick={() => expandAndScrollToSection('preferences')}>
              <div className="stat-icon-wrap spent">
                <Award size={18} />
              </div>
              <div className="stat-numbers">
                <span className="stat-value">{rewardPoints}</span>
                <span className="stat-label">Fresh Points</span>
              </div>
            </div>

            <div className="hero-stat-card" onClick={() => expandAndScrollToSection('addresses')}>
              <div className="stat-icon-wrap total">
                <MapPin size={18} />
              </div>
              <div className="stat-numbers">
                <span className="stat-value">{user.addresses?.length || 1}</span>
                <span className="stat-label">Saved Spots</span>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            EXPANDABLE ACCORDION SECTIONS
            ========================================== */}
        <div className="profile-accordion-container">

          {/* 1. Profile Information Accordion */}
          <section id="section-profile" className={`accordion-card ${openSections.profile ? 'is-open' : ''}`}>
            <div 
              className="accordion-trigger-header"
              onClick={() => toggleSection('profile')}
              role="button"
              tabIndex={0}
              aria-expanded={openSections.profile}
            >
              <div className="accordion-trigger-left">
                <div className="accordion-icon-box profile">
                  <User size={20} />
                </div>
                <div className="accordion-title-col">
                  <div className="accordion-title-row">
                    <h2 className="accordion-section-title">{t.personalDetails}</h2>
                    {user.phone && <span className="accordion-mini-chip verified"><CheckCircle2 size={11} /> {t.verified}</span>}
                  </div>
                  <p className="accordion-summary-text">
                    {user.name || 'Fresh Customer'} • {user.phone ? formatPhoneNumber(user.phone) : 'No phone linked'}
                  </p>
                </div>
              </div>

              <div className="accordion-trigger-right">
                <span className="accordion-state-hint">{openSections.profile ? t.close : t.viewEdit}</span>
                <div className="accordion-chevron">
                  {openSections.profile ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </div>

            {openSections.profile && (
              <div className="accordion-body-content fade-in">
                {renderOverview()}
              </div>
            )}
          </section>

          {/* 2. Orders & Deliveries Accordion */}
          <section id="section-orders" className={`accordion-card ${openSections.orders ? 'is-open' : ''}`}>
            <div 
              className="accordion-trigger-header"
              onClick={() => toggleSection('orders')}
              role="button"
              tabIndex={0}
              aria-expanded={openSections.orders}
            >
              <div className="accordion-trigger-left">
                <div className="accordion-icon-box orders">
                  <Package size={20} />
                </div>
                <div className="accordion-title-col">
                  <div className="accordion-title-row">
                    <h2 className="accordion-section-title">{t.ordersDeliveries}</h2>
                    {activeOrdersCount > 0 ? (
                      <span className="accordion-mini-chip active-chip">
                        <Truck size={11} /> {activeOrdersCount} {t.inTransit}
                      </span>
                    ) : (
                      <span className="accordion-mini-chip neutral">
                        {orders.length} {t.all}
                      </span>
                    )}
                  </div>
                  <p className="accordion-summary-text">
                    {orders.length === 0 
                      ? 'No orders placed yet' 
                      : `Latest order #${orders[0]?._id?.slice(-6).toUpperCase()} • Total spent ${formatCurrency(totalSpent)}`}
                  </p>
                </div>
              </div>

              <div className="accordion-trigger-right">
                <span className="accordion-state-hint">{openSections.orders ? t.close : t.trackManage}</span>
                <div className="accordion-chevron">
                  {openSections.orders ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </div>

            {openSections.orders && (
              <div className="accordion-body-content fade-in">
                {renderOrders()}
              </div>
            )}
          </section>

          {/* 3. Saved Addresses Accordion */}
          <section id="section-addresses" className={`accordion-card ${openSections.addresses ? 'is-open' : ''}`}>
            <div 
              className="accordion-trigger-header"
              onClick={() => toggleSection('addresses')}
              role="button"
              tabIndex={0}
              aria-expanded={openSections.addresses}
            >
              <div className="accordion-trigger-left">
                <div className="accordion-icon-box addresses">
                  <MapPin size={20} />
                </div>
                <div className="accordion-title-col">
                  <div className="accordion-title-row">
                    <h2 className="accordion-section-title">{t.savedAddresses}</h2>
                    <span className="accordion-mini-chip neutral">
                      {(user.addresses?.length || 0)} {t.savedSpots}
                    </span>
                  </div>
                  <p className="accordion-summary-text">
                    {user.location 
                      ? (user.location.startsWith('Lat:') ? 'Map Pinned Location' : user.location.slice(0, 36) + (user.location.length > 36 ? '...' : '')) 
                      : 'Manage multiple drop-off spots & building info'}
                  </p>
                </div>
              </div>

              <div className="accordion-trigger-right">
                <span className="accordion-state-hint">{openSections.addresses ? t.close : t.manage}</span>
                <div className="accordion-chevron">
                  {openSections.addresses ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </div>

            {openSections.addresses && (
              <div className="accordion-body-content fade-in">
                {renderAddresses()}
              </div>
            )}
          </section>

          {/* 4. Preferences & Settings Accordion */}
          <section id="section-preferences" className={`accordion-card ${openSections.preferences ? 'is-open' : ''}`}>
            <div 
              className="accordion-trigger-header"
              onClick={() => toggleSection('preferences')}
              role="button"
              tabIndex={0}
              aria-expanded={openSections.preferences}
            >
              <div className="accordion-trigger-left">
                <div className="accordion-icon-box preferences">
                  <Settings size={20} />
                </div>
                <div className="accordion-title-col">
                  <div className="accordion-title-row">
                    <h2 className="accordion-section-title">{t.preferencesSecurity}</h2>
                  </div>
                  <p className="accordion-summary-text">
                    {language === 'ar' ? 'اللغة العربية' : 'English'} • {isDark ? t.darkMode : t.lightMode} • {preferences.deliveryWindow === 'morning' ? t.morningWindow : t.afternoonWindow}
                  </p>
                </div>
              </div>

              <div className="accordion-trigger-right">
                <span className="accordion-state-hint">{openSections.preferences ? t.close : t.configure}</span>
                <div className="accordion-chevron">
                  {openSections.preferences ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </div>

            {openSections.preferences && (
              <div className="accordion-body-content fade-in">
                {renderSettings()}
              </div>
            )}
          </section>

        </div>
      </div>

      {/* ==========================================
          MODAL: CHANGE AVATAR PHOTO
          ========================================== */}
      {showAvatarModal && (
        <div className="modal-overlay" onClick={() => setShowAvatarModal(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar">
              <h3 className="modal-title">Change Profile Photo</h3>
              <button type="button" className="modal-x-btn" onClick={() => setShowAvatarModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="avatar-options-stack">
              <button
                type="button"
                onClick={() => handleAvatarChoice('camera')}
                className="avatar-choice-card camera"
              >
                <div className="choice-icon-wrap">
                  <Camera size={22} />
                </div>
                <div className="choice-text-col">
                  <span className="choice-title">Take a Photo</span>
                  <span className="choice-sub">Use your phone or webcam camera</span>
                </div>
                <ChevronRight size={18} className="choice-arrow" />
              </button>

              <button
                type="button"
                onClick={() => handleAvatarChoice('file')}
                className="avatar-choice-card file"
              >
                <div className="choice-icon-wrap">
                  <Upload size={22} />
                </div>
                <div className="choice-text-col">
                  <span className="choice-title">Choose from Gallery</span>
                  <span className="choice-sub">Upload PNG, JPG or WEBP image</span>
                </div>
                <ChevronRight size={18} className="choice-arrow" />
              </button>
            </div>

            {/* Hidden file inputs */}
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
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: UPDATE WHATSAPP PHONE NUMBER
          ========================================== */}
      {showPhoneModal && (
        <div className="modal-overlay" onClick={() => setShowPhoneModal(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar">
              <h3 className="modal-title">Update WhatsApp Phone</h3>
              <button type="button" className="modal-x-btn" onClick={() => setShowPhoneModal(false)}>
                <X size={18} />
              </button>
            </div>

            {phoneError && (
              <div className="modal-error-banner">
                <AlertCircle size={15} /> {phoneError}
              </div>
            )}

            {phoneStep === 'INPUT' ? (
              <form onSubmit={handleSendOtp} className="modal-form-stack">
                <div className="form-group-wrap">
                  <label className="modal-input-label">New Lebanese WhatsApp Number</label>
                  <div className="phone-prefix-input-box">
                    <span className="prefix-tag">🇱🇧 +961</span>
                    <input
                      type="tel"
                      className="prefix-input"
                      placeholder="70 123 456"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                  <span className="modal-input-hint">
                    We will send a 6-digit WhatsApp verification code to confirm ownership.
                  </span>
                </div>
                
                <div className="modal-actions-row">
                  <Button variant="secondary" onClick={() => setShowPhoneModal(false)} type="button">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={phoneLoading}>
                    {phoneLoading ? 'Sending...' : 'Send WhatsApp Code'}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneUpdate} className="modal-form-stack">
                {otp && (
                  <div className="modal-test-otp-banner">
                    <span>🧪 Verification Code: </span>
                    <strong>{otp}</strong>
                  </div>
                )}

                <div className="form-group-wrap">
                  <label className="modal-input-label centered">Enter 6-Digit Code</label>
                  <input
                    type="text"
                    className="modal-otp-pin-input"
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    autoFocus
                    required
                  />
                  <span className="modal-input-hint centered">
                    Sent via WhatsApp to +961 {newPhone}
                  </span>
                </div>

                <div className="modal-actions-row">
                  <Button variant="secondary" onClick={() => setPhoneStep('INPUT')} type="button">
                    Back
                  </Button>
                  <Button type="submit" variant="primary" disabled={phoneLoading || otp.length < 4}>
                    {phoneLoading ? 'Verifying...' : 'Verify & Update'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ADD / EDIT SAVED ADDRESS
          ========================================== */}
      {showAddressModal && (
        <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="modal-content-card address-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar">
              <h3 className="modal-title">
                {addressForm.id ? 'Edit Saved Address' : 'Add New Delivery Address'}
              </h3>
              <button type="button" className="modal-x-btn" onClick={() => setShowAddressModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="modal-form-stack">
              {/* Label Choice */}
              <div className="form-group-wrap">
                <label className="modal-input-label">Address Label</label>
                <div className="address-label-options">
                  {['Home', 'Work', 'Farm', 'Other'].map(lbl => (
                    <button
                      key={lbl}
                      type="button"
                      className={`label-choice-pill ${addressForm.label === lbl ? 'selected' : ''}`}
                      onClick={() => setAddressForm({...addressForm, label: lbl})}
                    >
                      {lbl === 'Home' && <Home size={14} />}
                      {lbl === 'Work' && <Briefcase size={14} />}
                      {lbl === 'Farm' && <Sparkles size={14} />}
                      {lbl === 'Other' && <MapPin size={14} />}
                      <span>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Picker / Interactive Address */}
              <div className="form-group-wrap">
                <label className="modal-input-label">Select Location on Map & Building Details</label>
                <div className="address-picker-container">
                  <LocationPicker 
                    onLocationSelect={(locData) => {
                      const addr = typeof locData === 'string' ? locData : locData.address;
                      setAddressForm(prev => ({ ...prev, address: addr }));
                    }}
                    initialLocation={addressForm.address}
                  />
                </div>
              </div>

              {/* Delivery Notes / Special Instructions */}
              <div className="form-group-wrap">
                <label className="modal-input-label">Delivery Notes / Landmark (Optional)</label>
                <input 
                  type="text" 
                  className="modal-field-input"
                  placeholder="e.g. Ring second bell, leave with concierge"
                  value={addressForm.notes}
                  onChange={(e) => setAddressForm({...addressForm, notes: e.target.value})}
                />
              </div>

              {/* Set as Default Switch */}
              <div className="modal-checkbox-row">
                <input 
                  type="checkbox" 
                  id="addrDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                />
                <label htmlFor="addrDefault" className="checkbox-label">
                  Set as my primary default delivery address
                </label>
              </div>

              <div className="modal-actions-row">
                <Button variant="secondary" onClick={() => setShowAddressModal(false)} type="button">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Address'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: LOGOUT CONFIRMATION
          ========================================== */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-content-card logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-icon-wrap">
              <LogOut size={32} />
            </div>
            <h3 className="logout-confirm-title">Sign Out of Chocair Fresh?</h3>
            <p className="logout-confirm-desc">
              You will need to sign back in with your WhatsApp number or Google account next time.
            </p>

            <div className="modal-actions-row">
              <Button variant="secondary" onClick={() => setShowLogoutModal(false)} type="button">
                Stay Signed In
              </Button>
              <button 
                type="button" 
                className="confirm-signout-btn"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
