import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  User, MapPin, Edit2, LogOut, Save, X, 
  Package, Settings, ShoppingBag, ChevronDown, ChevronUp, 
  AlertCircle, Phone, Camera, Upload, Plus, ShieldCheck, Truck, 
  ArrowLeft, ArrowRight, CheckCircle, RefreshCw, Copy, Check, 
  MessageSquare, Home, Briefcase, Trash2, Heart, ExternalLink, 
  CheckCircle2, MapPinned, ShoppingCart, 
  Eye, CreditCard, ChevronRight, Clock, Sparkles
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import LocationPicker from '../components/common/LocationPicker';
import api, { getStoredUser, clearAuthData, saveAuthData, getAssetUrl } from '../utils/api';
import { 
  getUserAvatarUrl, 
  isMascotAvatar, 
  MASCOTS, 
  getDeterministicMascotKey 
} from '../utils/mascotAvatars';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';
import { translations } from '../utils/translations';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { normalizeLebanesePhoneNumber, formatPhoneNumber } from '../utils/phoneUtils';
import { formatCurrency, formatDate } from '../utils/formatters';
import { toast } from 'react-toastify';
import './Profile.css';

const formatOrderDateTime = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return formatDate(dateString);
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${datePart} • ${timePart}`;
};

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, updateUser, logout: authLogout, isAdmin } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  const { favorites, favoritesCount, toggleFavorite } = useFavorites();
  const { language } = useTheme();
  const t = translations[language] || translations.en;

  const cachedUser = getStoredUser() || authUser || null;
  const [user, setUser] = useState(cachedUser);
  const [openSections, setOpenSections] = useState({
    profile: false,
    orders: true,
    favorites: false,
    addresses: false,
    settings: false,
  });
  const [orders, setOrders] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!cachedUser);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(cachedUser || {});
  const [expandedOrder, setExpandedOrder] = useState(null);
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
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    setOpenSections(prev => {
      const willBeOpen = !prev[sectionKey];
      if (isMobile) {
        // On mobile, opening a section automatically closes any other open section
        return {
          profile: false,
          orders: false,
          favorites: false,
          addresses: false,
          settings: false,
          [sectionKey]: willBeOpen
        };
      }
      return {
        ...prev,
        [sectionKey]: willBeOpen
      };
    });
  };

  const expandAndScrollToSection = (sectionKey) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    setOpenSections(prev => {
      if (isMobile) {
        return {
          profile: false,
          orders: false,
          favorites: false,
          addresses: false,
          settings: false,
          [sectionKey]: true
        };
      }
      return {
        ...prev,
        [sectionKey]: true
      };
    });
    setTimeout(() => {
      const el = document.getElementById(`section-${sectionKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Handle query or location navigation state
  useEffect(() => {
    if (location.state?.activeTab) {
      const tab = location.state.activeTab;
      if (tab === 'overview' || tab === 'profile') expandAndScrollToSection('profile');
      else if (tab === 'orders') expandAndScrollToSection('orders');
      else if (tab === 'favorites') expandAndScrollToSection('favorites');
      else if (tab === 'addresses') expandAndScrollToSection('addresses');
      else if (tab === 'settings' || tab === 'preferences') expandAndScrollToSection('settings');
    }
  }, [location.state]);

  // Initial load: user, orders, products
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
        const [profileRes, ordersRes, productsRes] = await Promise.allSettled([
          api.get('/users/profile'),
          api.get('/orders/myorders'),
          api.get('/products')
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
          const freshUser = profileRes.value.data;
          setUser(freshUser);
          setFormData(freshUser);
          saveAuthData(localStorage.getItem('token'), freshUser);
          if (updateUser) updateUser(freshUser);
        }

        if (ordersRes.status === 'fulfilled' && ordersRes.value?.data) {
          const fetchedOrders = ordersRes.value.data || [];
          setOrders(fetchedOrders);
        }

        if (productsRes.status === 'fulfilled' && productsRes.value?.data) {
          setAllProducts(productsRes.value.data || []);
        }
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
        toast.success('WhatsApp number updated!');
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

    order.orderItems.forEach(item => {
      const productObj = {
        _id: item.product || item._id,
        name: item.name,
        price: item.price,
        image: item.image,
      };
      addToCart(productObj, item.qty || 1);
    });

    setIsCartOpen(true);
    toast.success(`Added ${order.orderItems.length} items to cart`);
  };

  const handleCopyOrderId = (e, orderId) => {
    e.stopPropagation();
    const formatted = `#${orderId.slice(-6).toUpperCase()}`;
    navigator.clipboard?.writeText(orderId);
    setCopiedId(orderId);
    toast.info(`Order ID ${formatted} copied!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleWhatsAppHelp = (e, order) => {
    e.stopPropagation();
    const orderCode = `#${order._id.slice(-6).toUpperCase()}`;
    const text = encodeURIComponent(`Hi Chocair Fresh! I need assistance with my Order ${orderCode}.`);
    window.open(`https://wa.me/96171966828?text=${text}`, '_blank');
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

  const handleSelectMascot = async (mascotKey) => {
    try {
      setLoading(true);
      setShowAvatarModal(false);
      
      const response = await api.put('/users/profile', {
        name: user.name,
        location: user.location,
        mascot: mascotKey,
        avatar: '', // Clear custom photo to use selected mascot
        addresses: user.addresses || []
      });
      
      const updatedUser = response.data;
      setUser(updatedUser);
      setFormData(updatedUser);
      saveAuthData(localStorage.getItem('token'), updatedUser);
      if (updateUser) updateUser(updatedUser);
      toast.success('Mascot updated!');
    } catch (err) {
      toast.error('Failed to update mascot');
    } finally {
      setLoading(false);
    }
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

  const handleEditAddress = (addr) => {
    setAddressForm({
      id: addr._id || addr.id,
      label: addr.label || 'Home',
      address: addr.address || '',
      city: addr.city || 'Beirut',
      notes: addr.notes || '',
      isDefault: Boolean(addr.isDefault)
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!addressForm.address || !addressForm.address.trim()) {
      toast.error('Please enter a valid address');
      return;
    }

    setLoading(true);
    try {
      const currentAddresses = Array.isArray(user.addresses) ? [...user.addresses] : [];

      let updatedAddresses;
      if (addressForm.id) {
        updatedAddresses = currentAddresses.map((a) => {
          const match = (a._id && a._id === addressForm.id) || (a.id && a.id === addressForm.id);
          if (match) {
            const item = {
              label: addressForm.label || 'Home',
              address: addressForm.address.trim(),
              city: addressForm.city || 'Beirut',
              notes: addressForm.notes || '',
              isDefault: Boolean(addressForm.isDefault),
            };
            if (a._id && /^[0-9a-fA-F]{24}$/.test(String(a._id))) {
              item._id = a._id;
            }
            return item;
          }
          return addressForm.isDefault ? { ...a, isDefault: false } : a;
        });
      } else {
        if (addressForm.isDefault) {
          currentAddresses.forEach((a) => { a.isDefault = false; });
        }
        const newAddr = {
          label: addressForm.label || 'Home',
          address: addressForm.address.trim(),
          city: addressForm.city || 'Beirut',
          notes: addressForm.notes || '',
          isDefault: addressForm.isDefault || currentAddresses.length === 0,
        };
        updatedAddresses = [...currentAddresses, newAddr];
      }

      let newLocation = user.location;
      if (addressForm.isDefault || !newLocation) {
        newLocation = addressForm.address.trim();
      }

      const response = await api.put('/users/profile', {
        name: user.name,
        email: user.email,
        location: newLocation,
        avatar: user.avatar,
        mascot: user.mascot,
        addresses: updatedAddresses,
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
      toast.error(err.response?.data?.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    
    setLoading(true);
    try {
      const currentAddresses = Array.isArray(user.addresses) ? user.addresses : [];
      const updatedAddresses = currentAddresses.filter(a => a._id !== addressId && a.id !== addressId);
      const response = await api.put('/users/profile', {
        name: user.name,
        email: user.email,
        location: user.location,
        avatar: user.avatar,
        mascot: user.mascot,
        addresses: updatedAddresses,
      });

      const updatedUser = response.data;
      setUser(updatedUser);
      setFormData(updatedUser);
      saveAuthData(localStorage.getItem('token'), updatedUser);
      if (updateUser) updateUser(updatedUser);
      toast.success('Address removed');
    } catch (err) {
      console.error('Failed to remove address', err);
      toast.error(err.response?.data?.message || 'Failed to remove address');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultAddress = async (address) => {
    setLoading(true);
    try {
      const currentAddresses = Array.isArray(user.addresses) ? user.addresses : [];
      const targetId = address._id || address.id;
      const updatedAddresses = currentAddresses.map(a => ({
        ...a,
        isDefault: (a._id === targetId || a.id === targetId)
      }));

      const response = await api.put('/users/profile', {
        name: user.name,
        email: user.email,
        location: address.address,
        avatar: user.avatar,
        mascot: user.mascot,
        addresses: updatedAddresses,
      });

      const updatedUser = response.data;
      setUser(updatedUser);
      setFormData(updatedUser);
      saveAuthData(localStorage.getItem('token'), updatedUser);
      if (updateUser) updateUser(updatedUser);
      toast.success('Default address updated!');
    } catch (err) {
      console.error('Failed to set default address', err);
      toast.error(err.response?.data?.message || 'Failed to set default address');
    } finally {
      setLoading(false);
    }
  };

  // Favorite Products list
  const favoriteProductsList = useMemo(() => {
    return allProducts.filter(p => favorites.includes((p._id || p.id).toString()));
  }, [allProducts, favorites]);

  if (initialLoading) {
    return <Loading text="Loading account..." />;
  }

  if (!user) {
    return null;
  }

  const currentUserData = { ...user, ...formData };
  const avatarDisplayUrl = getUserAvatarUrl(currentUserData);
  const isMascot = isMascotAvatar(currentUserData);

  // Order Progress Stage Helper
  const getOrderProgressStep = (status) => {
    const st = (status || 'pending').toLowerCase();
    if (st === 'cancelled') return -1;
    if (st === 'delivered') return 4;
    if (st === 'shipped' || st === 'out_for_delivery') return 3;
    if (st === 'processing' || st === 'confirmed') return 2;
    return 1;
  };

  // ==========================================
  // SECTION: PERSONAL DETAILS
  // ==========================================
  const renderProfile = () => (
    <div className="profile-section-card fade-in">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">{t.personalDetails}</h2>
        </div>
        {!isEditing ? (
          <button 
            type="button" 
            className="account-action-pill-btn"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 size={14} />
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
              <X size={14} />
              <span>Cancel</span>
            </button>
            <button 
              type="button" 
              className="account-save-pill-btn"
              onClick={handleSaveProfile}
              disabled={loading}
            >
              <Save size={14} />
              <span>{loading ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="profile-fields-grid">
        {/* Full Name */}
        <div className="profile-field-box">
          <label className="profile-field-label">
            <User size={14} /> {t.fullName}
          </label>
          <input 
            type="text" 
            className="profile-field-input"
            value={formData.name || ''}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            disabled={!isEditing}
            placeholder="Full Name"
          />
        </div>

        {/* WhatsApp Phone */}
        <div className="profile-field-box">
          <label className="profile-field-label">
            <Phone size={14} /> {t.whatsAppNumber}
            {user.phone ? (
              <span className="verified-badge-pill">
                <CheckCircle2 size={11} /> Verified
              </span>
            ) : (
              <span className="unverified-badge-pill">
                <AlertCircle size={11} /> Unlinked
              </span>
            )}
          </label>
          <div className="phone-input-action-row">
            <input 
              type="tel" 
              className="profile-field-input phone-input"
              value={formData.phone ? formatPhoneNumber(formData.phone) : 'No phone linked'}
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

        {/* Primary Delivery Location */}
        <div className="profile-field-box full-width">
          <label className="profile-field-label">
            <MapPin size={14} /> {t.primaryAddress}
          </label>

          {isEditing ? (
            <div className="location-picker-wrapper">
              <LocationPicker onLocationSelect={handleLocationSelect} initialLocation={formData.location} />
            </div>
          ) : (
            <div className="location-preview-card">
              <div className="location-pin-icon-wrap">
                <MapPinned size={20} />
              </div>
              <div className="location-preview-content">
                <span className="location-main-text">
                  {formData.location ? (formData.location.startsWith('Lat:') ? 'Pinned GPS Location' : formData.location) : 'No primary delivery address set'}
                </span>
              </div>
              <button 
                type="button" 
                className="edit-addr-quick-btn"
                onClick={() => setIsEditing(true)}
              >
                Change
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ==========================================
  // SECTION: MY ORDERS
  // ==========================================
  const renderOrders = () => (
    <div className="profile-section-card fade-in">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">{t.ordersDeliveries}</h2>
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

      {orders.length === 0 ? (
        <div className="empty-orders-view">
          <div className="empty-icon-circle">
            <ShoppingBag size={34} />
          </div>
          <h3>{t.noOrdersFound}</h3>
          <p>You haven't placed any orders yet.</p>
          <Button variant="primary" onClick={() => navigate('/shop')} className="start-fresh-shop-btn">
            {t.exploreHarvest} <ArrowRight size={15} style={{ marginLeft: 6 }} />
          </Button>
        </div>
      ) : (
        <div className="compact-orders-list">
          {orders.map(order => {
            const isExpanded = expandedOrder === order._id;
            const statusLower = (order.status || 'pending').toLowerCase();
            const progressStep = getOrderProgressStep(order.status);
            const isCancelled = statusLower === 'cancelled';
            const orderCode = `#${order._id.slice(-6).toUpperCase()}`;

            return (
              <div 
                key={order._id} 
                className={`compact-order-card ${isExpanded ? 'is-expanded' : ''} ${isCancelled ? 'is-cancelled' : ''}`}
              >
                {/* Compact Row */}
                <div 
                  className="compact-order-row"
                  onClick={() => toggleOrder(order._id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                >
                  <div className="compact-order-meta">
                    <div className="order-code-badge">
                      <span className="order-id-label">{orderCode}</span>
                      <button 
                        type="button" 
                        className="copy-id-btn" 
                        onClick={(e) => handleCopyOrderId(e, order._id)}
                        title="Copy ID"
                      >
                        {copiedId === order._id ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <span className="compact-order-date">
                      {formatOrderDateTime(order.createdAt)}
                    </span>
                  </div>

                  <div className="compact-order-actions">
                    <span className={`order-status-pill status-${statusLower}`}>
                      {order.status || 'Pending'}
                    </span>
                    <button 
                      type="button" 
                      className={`order-view-toggle-btn ${isExpanded ? 'active' : ''}`}
                      title={isExpanded ? "Collapse Details" : "View Details"}
                      aria-label={isExpanded ? "Collapse Details" : "View Details"}
                    >
                      <Eye size={15} />
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Full Order Details */}
                {isExpanded && (
                  <div className="order-drawer-content fade-in" onClick={(e) => e.stopPropagation()}>
                    {/* Visual Order Progress Tracker */}
                    {!isCancelled ? (
                      <div className="order-progress-tracker">
                        <div className={`progress-step ${progressStep >= 1 ? 'completed' : ''} ${progressStep === 1 ? 'current' : ''}`}>
                          <div className="step-dot">
                            <Check size={10} strokeWidth={3} />
                          </div>
                          <span className="step-label">Placed</span>
                        </div>

                        <div className={`progress-line ${progressStep >= 2 ? 'completed' : ''}`} />

                        <div className={`progress-step ${progressStep >= 2 ? 'completed' : ''} ${progressStep === 2 ? 'current' : ''}`}>
                          <div className="step-dot">
                            <Check size={10} strokeWidth={3} />
                          </div>
                          <span className="step-label">Confirmed</span>
                        </div>

                        <div className={`progress-line ${progressStep >= 3 ? 'completed' : ''}`} />

                        <div className={`progress-step ${progressStep >= 3 ? 'completed' : ''} ${progressStep === 3 ? 'current' : ''}`}>
                          <div className="step-dot">
                            <Truck size={11} strokeWidth={2.5} />
                          </div>
                          <span className="step-label">On Way</span>
                        </div>

                        <div className={`progress-line ${progressStep >= 4 ? 'completed' : ''}`} />

                        <div className={`progress-step ${progressStep >= 4 ? 'completed' : ''} ${progressStep === 4 ? 'current' : ''}`}>
                          <div className="step-dot">
                            <CheckCircle size={11} strokeWidth={2.5} />
                          </div>
                          <span className="step-label">Delivered</span>
                        </div>
                      </div>
                    ) : (
                      <div className="order-cancelled-banner">
                        <AlertCircle size={15} /> Order Cancelled
                      </div>
                    )}

                    {/* Line Items List */}
                    <div className="line-items-header">
                      <span>Items ({order.orderItems?.length || 0})</span>
                      <span>Subtotal</span>
                    </div>
                    
                    <div className="order-line-items-list">
                      {order.orderItems?.map((item, idx) => (
                        <div key={idx} className="line-item-card">
                          <div className="item-img-frame">
                            {item.image ? (
                              <img src={item.image} alt={item.name} />
                            ) : (
                              <Package size={18} color="#94a3b8" />
                            )}
                          </div>
                          <div className="item-info-col">
                            <span className="item-title">{item.name}</span>
                            <span className="item-qty-rate">
                              {item.qty} × {formatCurrency(item.price)}
                            </span>
                          </div>
                          <span className="item-row-total">
                            {formatCurrency(item.qty * item.price)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Meta Info Grid */}
                    <div className="order-meta-info-grid">
                      <div className="meta-info-card">
                        <div className="meta-card-title">
                          <Truck size={13} /> {t.deliveryAddress}
                        </div>
                        <p className="meta-card-text">
                          {order.customerInfo?.address || order.shippingAddress?.address || 'Standard Delivery, Lebanon'}
                        </p>
                      </div>

                      <div className="meta-info-card">
                        <div className="meta-card-title">
                          <Phone size={13} /> {t.recipientPhone}
                        </div>
                        <p className="meta-card-text">
                          {order.customerInfo?.phone ? formatPhoneNumber(order.customerInfo.phone) : (user.phone ? formatPhoneNumber(user.phone) : 'On file')}
                        </p>
                      </div>

                      <div className="meta-info-card">
                        <div className="meta-card-title">
                          <CreditCard size={13} /> Payment
                        </div>
                        <p className="meta-card-text">
                          {order.paymentMethod || 'Cash on Delivery'}
                        </p>
                      </div>

                      {(order.customerInfo?.deliveryPreference || order.deliveryPreference) && (
                        <div className="meta-info-card">
                          <div className="meta-card-title">
                            <Clock size={13} /> Delivery Timing
                          </div>
                          <p className="meta-card-text" style={{ color: '#15803d', fontWeight: 600 }}>
                            {order.customerInfo?.deliveryPreference || order.deliveryPreference}
                          </p>
                        </div>
                      )}

                      <div className="meta-info-card total-highlight-card">
                        <div className="meta-card-title">
                          {t.totalAmount}
                        </div>
                        <p className="meta-card-text total-amount-value">
                          {formatCurrency(order.totalPrice || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Order Action Buttons */}
                    <div className="order-actions-bar">
                      <button 
                        type="button" 
                        className="reorder-action-btn"
                        onClick={(e) => handleReorder(e, order)}
                      >
                        <RefreshCw size={14} />
                        <span>{t.reorderAll}</span>
                      </button>

                      <button 
                        type="button" 
                        className="whatsapp-help-btn"
                        onClick={(e) => handleWhatsAppHelp(e, order)}
                      >
                        <MessageSquare size={14} />
                        <span>{t.whatsAppHelp}</span>
                      </button>

                      {order.status === 'Pending' && (
                        <button 
                          type="button" 
                          className="cancel-order-pill-btn"
                          onClick={(e) => handleCancelOrder(e, order._id)}
                        >
                          {t.cancelOrder}
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
  // SECTION: FAVORITES (COMPACT & CLEAN)
  // ==========================================
  const renderFavorites = () => (
    <div className="profile-section-card fade-in">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">{t.myFavorites}</h2>
        </div>
        <Button 
          variant="outline" 
          size="small" 
          onClick={() => navigate('/shop')} 
          className="header-shop-btn"
        >
          <ShoppingBag size={14} style={{ marginRight: 6 }} /> {t.browseShop}
        </Button>
      </div>

      {favoriteProductsList.length === 0 ? (
        <div className="empty-favorites-box">
          <div className="empty-fav-icon-circle">
            <Heart size={34} />
          </div>
          <h3>{t.noFavoritesFound}</h3>
          <p>{t.noFavoritesDesc}</p>
          <Button variant="primary" onClick={() => navigate('/shop')} className="start-fresh-shop-btn">
            {t.browseShop} <ArrowRight size={15} style={{ marginLeft: 6 }} />
          </Button>
        </div>
      ) : (
        <div className="favorites-compact-grid">
          {favoriteProductsList.map((product) => {
            const inStock = (product.countInStock || 10) > 0;
            return (
              <div key={product._id} className="fav-compact-card">
                <button
                  type="button"
                  className="fav-compact-heart-btn"
                  onClick={() => toggleFavorite(product)}
                  title="Remove from favorites"
                  aria-label="Remove from favorites"
                >
                  <Heart size={14} fill="#ef4444" color="#ef4444" />
                </button>

                <Link to={`/product/${product._id}`} className="fav-compact-img-link">
                  <img 
                    src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'} 
                    alt={product.name}
                    loading="lazy"
                  />
                </Link>

                <div className="fav-compact-body">
                  <Link to={`/product/${product._id}`} className="fav-compact-title-link">
                    <h4 className="fav-compact-name">{product.name}</h4>
                  </Link>

                  <div className="fav-compact-price-row">
                    <span className="fav-compact-price">{formatCurrency(product.price)}</span>
                    {product.unit && <span className="fav-compact-unit">/{product.unit}</span>}
                  </div>

                  <button
                    type="button"
                    className="fav-compact-add-btn"
                    disabled={!inStock}
                    onClick={() => {
                      addToCart(product, 1);
                      toast.success(`${product.name} added to cart!`);
                    }}
                  >
                    <ShoppingCart size={13} />
                    <span>{inStock ? t.addToCart : t.outOfStock}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ==========================================
  // SECTION: SAVED ADDRESSES
  // ==========================================
  const renderAddresses = () => {
    const savedAddresses = user.addresses || [];

    return (
      <div className="profile-section-card fade-in">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">{t.savedAddresses}</h2>
          </div>
          <button 
            type="button" 
            className="account-action-pill-btn"
            onClick={handleOpenAddAddress}
          >
            <Plus size={15} />
            <span>{t.addNewAddress}</span>
          </button>
        </div>

        {savedAddresses.length === 0 ? (
          <div className="empty-addresses-box">
            <div className="empty-icon-circle">
              <MapPin size={34} />
            </div>
            <h3>{t.noSavedAddresses}</h3>
            <p>Save your home or work address for 1-tap fast checkout.</p>
            <Button variant="primary" onClick={handleOpenAddAddress} className="add-first-address-btn">
              <Plus size={15} style={{ marginRight: 6 }} /> {t.addNewAddress}
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
                        <Briefcase size={14} />
                      ) : labelLower === 'home' ? (
                        <Home size={14} />
                      ) : (
                        <MapPin size={14} />
                      )}
                      <span>{addr.label || 'Saved Location'}</span>
                    </div>

                    {isDefault ? (
                      <span className="default-address-chip">
                        <Check size={11} strokeWidth={3} /> {t.defaultBadge}
                      </span>
                    ) : (
                      <button 
                        type="button" 
                        className="make-default-btn"
                        onClick={() => handleSetDefaultAddress(addr)}
                      >
                        {t.setDefault}
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
                      className="addr-action-btn edit"
                      onClick={() => handleEditAddress(addr)}
                      title="Edit Address"
                    >
                      <Edit2 size={14} />
                      <span>{t.edit || 'Edit'}</span>
                    </button>
                    <button 
                      type="button" 
                      className="addr-action-btn delete"
                      onClick={() => handleDeleteAddress(addr._id || addr.id)}
                      title="Delete Address"
                    >
                      <Trash2 size={14} />
                      <span>{t.remove}</span>
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
  // SECTION: PREFERENCES & ACCOUNT SETTINGS
  // ==========================================
  const renderSettings = () => (
    <div className="profile-section-card fade-in">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">{t.preferencesSecurity}</h2>
        </div>
      </div>

      <div className="settings-groups-stack">
        {/* Admin Shortcut if applicable */}
        {isAdmin && (
          <div className="settings-group-card admin-highlight-card">
            <div className="admin-card-inner">
              <div className="admin-badge-icon">
                <ShieldCheck size={20} />
              </div>
              <div className="admin-text-col">
                <span className="admin-card-title">Store Management Portal</span>
                <span className="admin-card-desc">Access live inventory controls and orders dispatch</span>
              </div>
              <Button variant="primary" onClick={() => navigate('/admin')} className="launch-admin-btn">
                Launch Admin <ExternalLink size={13} style={{ marginLeft: 5 }} />
              </Button>
            </div>
          </div>
        )}

        {/* Sign Out Card */}
        <div className="settings-group-card danger-zone">
          <div className="danger-zone-row">
            <div className="danger-text-col">
              <span className="danger-title">{t.accountSession}</span>
              <span className="danger-desc">{t.signOutDesc}</span>
            </div>
            <button 
              type="button" 
              className="danger-signout-btn"
              onClick={() => setShowLogoutModal(true)}
            >
              <LogOut size={14} />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="profile-page">
      {loading && <Loading text="Updating account..." />}
      
      {/* Desktop Navbar */}
      <div className="profile-desktop-nav">
        <Navbar />
      </div>

      {/* Mobile Header */}
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
            MEMBER IDENTITY CARD (CLEAN & MINIMAL)
            ========================================== */}
        <div className="profile-hero-card">
          <div className="hero-card-left">
            <div className="avatar-interaction-wrap">
              <div 
                className="hero-avatar" 
                onClick={() => setShowAvatarModal(true)}
                title="Change Avatar"
              >
                <img 
                  src={avatarDisplayUrl} 
                  alt={user.name || 'User Avatar'} 
                  className={`avatar-img ${isMascot ? 'mascot-avatar-img' : ''}`} 
                />
                <div className="avatar-camera-overlay">
                  <Camera size={13} />
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
                  <Phone size={12} /> {user.phone ? formatPhoneNumber(user.phone) : 'No phone linked'}
                </span>
              </div>

              <div className="hero-tier-tag-wrap">
                <span className="hero-loc-tag">
                  <MapPin size={11} /> {user.location ? (user.location.startsWith('Lat:') ? 'Pinned Location' : user.location.slice(0, 24) + (user.location.length > 24 ? '...' : '')) : 'Lebanon'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            EXPANDABLE ACCORDION SECTIONS
            ========================================== */}
        <div className="profile-accordion-container">

          {/* 1. Personal Details */}
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
                  <User size={18} />
                </div>
                <div className="accordion-title-col">
                  <div className="accordion-title-row">
                    <h2 className="accordion-section-title">{t.personalDetails}</h2>
                    {user.phone && <span className="accordion-mini-chip verified"><CheckCircle2 size={11} /> {t.verified}</span>}
                  </div>
                </div>
              </div>

              <div className="accordion-trigger-right">
                <span className="accordion-state-hint">{openSections.profile ? t.close : t.viewEdit}</span>
                <div className="accordion-chevron">
                  {openSections.profile ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
            </div>

            {openSections.profile && (
              <div className="accordion-body-content fade-in">
                {renderProfile()}
              </div>
            )}
          </section>

          {/* 2. My Orders */}
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
                  <Package size={18} />
                </div>
                <div className="accordion-title-col">
                  <div className="accordion-title-row">
                    <h2 className="accordion-section-title">{t.ordersDeliveries}</h2>
                    {orders.length > 0 && (
                      <span className="accordion-mini-chip neutral">
                        {orders.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="accordion-trigger-right">
                <span className="accordion-state-hint">{openSections.orders ? t.close : t.trackManage}</span>
                <div className="accordion-chevron">
                  {openSections.orders ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
            </div>

            {openSections.orders && (
              <div className="accordion-body-content fade-in">
                {renderOrders()}
              </div>
            )}
          </section>

          {/* 3. Favorites */}
          <section id="section-favorites" className={`accordion-card ${openSections.favorites ? 'is-open' : ''}`}>
            <div 
              className="accordion-trigger-header"
              onClick={() => toggleSection('favorites')}
              role="button"
              tabIndex={0}
              aria-expanded={openSections.favorites}
            >
              <div className="accordion-trigger-left">
                <div className="accordion-icon-box favorites">
                  <Heart size={18} />
                </div>
                <div className="accordion-title-col">
                  <div className="accordion-title-row">
                    <h2 className="accordion-section-title">{t.myFavorites}</h2>
                    {favoritesCount > 0 && (
                      <span className="accordion-mini-chip neutral">
                        {favoritesCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="accordion-trigger-right">
                <span className="accordion-state-hint">{openSections.favorites ? t.close : t.manage}</span>
                <div className="accordion-chevron">
                  {openSections.favorites ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
            </div>

            {openSections.favorites && (
              <div className="accordion-body-content fade-in">
                {renderFavorites()}
              </div>
            )}
          </section>

          {/* 4. Saved Addresses */}
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
                  <MapPin size={18} />
                </div>
                <div className="accordion-title-col">
                  <div className="accordion-title-row">
                    <h2 className="accordion-section-title">{t.savedAddresses}</h2>
                    {(user.addresses?.length || 0) > 0 && (
                      <span className="accordion-mini-chip neutral">
                        {user.addresses.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="accordion-trigger-right">
                <span className="accordion-state-hint">{openSections.addresses ? t.close : t.manage}</span>
                <div className="accordion-chevron">
                  {openSections.addresses ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
            </div>

            {openSections.addresses && (
              <div className="accordion-body-content fade-in">
                {renderAddresses()}
              </div>
            )}
          </section>

          {/* 5. Preferences */}
          <section id="section-settings" className={`accordion-card ${openSections.settings ? 'is-open' : ''}`}>
            <div 
              className="accordion-trigger-header"
              onClick={() => toggleSection('settings')}
              role="button"
              tabIndex={0}
              aria-expanded={openSections.settings}
            >
              <div className="accordion-trigger-left">
                <div className="accordion-icon-box preferences">
                  <Settings size={18} />
                </div>
                <div className="accordion-title-col">
                  <div className="accordion-title-row">
                    <h2 className="accordion-section-title">{t.preferencesSecurity}</h2>
                  </div>
                </div>
              </div>

              <div className="accordion-trigger-right">
                <span className="accordion-state-hint">{openSections.settings ? t.close : t.configure}</span>
                <div className="accordion-chevron">
                  {openSections.settings ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
            </div>

            {openSections.settings && (
              <div className="accordion-body-content fade-in">
                {renderSettings()}
              </div>
            )}
          </section>

        </div>
      </div>

      {/* ==========================================
          MODAL: CHANGE AVATAR PHOTO / MASCOT
          ========================================== */}
      {showAvatarModal && (
        <div className="modal-overlay" onClick={() => setShowAvatarModal(false)}>
          <div className="modal-content-card avatar-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar">
              <h3 className="modal-title">Choose Your Avatar</h3>
              <button type="button" className="modal-x-btn" onClick={() => setShowAvatarModal(false)}>
                <X size={17} />
              </button>
            </div>

            <div className="mascot-selection-section">
              <label className="mascot-section-label">Fresh Fruit & Veggie Mascots</label>
              <div className="mascot-grid">
                {MASCOTS.map((m) => {
                  const currentMascotKey = user.mascot || getDeterministicMascotKey(user._id || user.phone || user.name);
                  const isSelected = (!user.avatar || isMascot) && currentMascotKey === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      className={`mascot-grid-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectMascot(m.key)}
                      title={m.name}
                    >
                      <img src={m.image} alt={m.name} className="mascot-thumb" />
                      <span className="mascot-thumb-name">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="avatar-modal-divider">
              <span>or use your custom photo</span>
            </div>

            <div className="avatar-options-stack">
              <button
                type="button"
                onClick={() => handleAvatarChoice('camera')}
                className="avatar-choice-card camera"
              >
                <div className="choice-icon-wrap">
                  <Camera size={20} />
                </div>
                <div className="choice-text-col">
                  <span className="choice-title">Take a Photo</span>
                  <span className="choice-sub">Use camera</span>
                </div>
                <ChevronRight size={16} className="choice-arrow" />
              </button>

              <button
                type="button"
                onClick={() => handleAvatarChoice('file')}
                className="avatar-choice-card file"
              >
                <div className="choice-icon-wrap">
                  <Upload size={20} />
                </div>
                <div className="choice-text-col">
                  <span className="choice-title">Choose from Gallery</span>
                  <span className="choice-sub">Upload image</span>
                </div>
                <ChevronRight size={16} className="choice-arrow" />
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
                <X size={17} />
              </button>
            </div>

            {phoneError && (
              <div className="modal-error-banner">
                <AlertCircle size={14} /> {phoneError}
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
                    A 6-digit WhatsApp verification code will be sent.
                  </span>
                </div>
                
                <div className="modal-actions-row">
                  <Button variant="secondary" onClick={() => setShowPhoneModal(false)} type="button">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={phoneLoading}>
                    {phoneLoading ? 'Sending...' : 'Send Code'}
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
                <X size={17} />
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
                      {lbl === 'Home' && <Home size={13} />}
                      {lbl === 'Work' && <Briefcase size={13} />}
                      {lbl === 'Farm' && <Sparkles size={13} />}
                      {lbl === 'Other' && <MapPin size={13} />}
                      <span>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Address Input */}
              <div className="form-group-wrap">
                <label className="modal-input-label">Street / Area / Building Address *</label>
                <input 
                  type="text" 
                  className="modal-field-input"
                  placeholder="e.g. Beirut, Hamra, Makdessi St., Sunrise Bldg 3rd Fl"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </div>

              {/* Location Picker */}
              <div className="form-group-wrap">
                <label className="modal-input-label">Pin Location on Map / GPS (Optional)</label>
                <div className="address-picker-container">
                  <LocationPicker 
                    onLocationSelect={(locData) => {
                      const addr = typeof locData === 'string' ? locData : (locData?.address || '');
                      if (addr) {
                        setAddressForm(prev => ({ ...prev, address: addr }));
                      }
                    }}
                    initialLocation={addressForm.address}
                  />
                </div>
              </div>

              {/* Delivery Notes */}
              <div className="form-group-wrap">
                <label className="modal-input-label">Delivery Notes / Landmark (Optional)</label>
                <input 
                  type="text" 
                  className="modal-field-input"
                  placeholder="e.g. Ring 2nd bell, leave with concierge"
                  value={addressForm.notes}
                  onChange={(e) => setAddressForm({...addressForm, notes: e.target.value})}
                />
              </div>

              {/* Set as Default */}
              <div className="modal-checkbox-row">
                <input 
                  type="checkbox" 
                  id="addrDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                />
                <label htmlFor="addrDefault" className="checkbox-label">
                  Set as default delivery address
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
              <LogOut size={28} />
            </div>
            <h3 className="logout-confirm-title">Sign Out of Chocair Fresh?</h3>
            <p className="logout-confirm-desc">
              Your saved addresses and order history will be waiting for you.
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
