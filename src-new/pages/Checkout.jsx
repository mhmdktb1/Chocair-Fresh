import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, CreditCard, Truck, MapPin, X, ArrowLeft, ArrowRight,
  ShieldCheck, Lock, ChevronDown, ChevronUp, ShoppingBag, Phone, User,
  MessageSquare, AlertCircle, Copy, Check, Sparkles, Clock, Zap, Calendar, Sun
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { normalizeLebanesePhoneNumber } from '../utils/phoneUtils';
import { formatCurrency } from '../utils/formatters';
import { normalizeUnit, formatQuantityWithUnit } from '../utils/unitHelper';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import LocationPicker from '../components/common/LocationPicker';
import Loading from '../components/common/Loading';
import api from '../utils/api';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart, cartCount } = useCart();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);

  // UI state for mobile accordion summary
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [copiedWhishNumber, setCopiedWhishNumber] = useState(false);

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    googleMapsLink: "",
    additionalInfo: ""
  });

  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");

  // Delivery Timing Preference State
  const [deliveryPreference, setDeliveryPreference] = useState("asap"); // 'asap' | 'anytime' | 'schedule'
  const [scheduledDayOption, setScheduledDayOption] = useState("today"); // 'today' | 'tomorrow' | 'custom'
  
  const todayIso = new Date().toISOString().split('T')[0];
  const tomorrowDateObj = new Date();
  tomorrowDateObj.setDate(tomorrowDateObj.getDate() + 1);
  const tomorrowIso = tomorrowDateObj.toISOString().split('T')[0];

  const [scheduledDate, setScheduledDate] = useState(todayIso);
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState("Morning (09:00 AM - 12:00 PM)");

  const getFormattedDeliveryPreference = () => {
    if (deliveryPreference === 'asap') {
      return 'ASAP (Fastest Delivery)';
    }
    if (deliveryPreference === 'anytime') {
      return 'Anytime Today (Not in a hurry)';
    }
    if (deliveryPreference === 'schedule') {
      const dayLabel = scheduledDayOption === 'today' 
        ? `Today (${scheduledDate})` 
        : scheduledDayOption === 'tomorrow' 
          ? `Tomorrow (${scheduledDate})` 
          : scheduledDate;
      return `Scheduled: ${dayLabel} • ${scheduledTimeSlot}`;
    }
    return 'ASAP';
  };

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name || '',
        phone: user.phone || prev.phone || '',
        address: prev.address || user.location || '',
      }));
    }
  }, [user]);

  const shippingCost = cartTotal > 50 ? 0 : 5.99;
  const finalTotal = cartTotal + shippingCost;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = useCallback((locationData) => {
    if (!locationData) return;
    if (typeof locationData === 'string') {
      setFormData(prev => ({
        ...prev,
        address: locationData
      }));
    } else {
      const link = (locationData.lat != null && locationData.lng != null)
        ? `https://www.google.com/maps/search/?api=1&query=${locationData.lat},${locationData.lng}`
        : '';
      setFormData(prev => ({
        ...prev,
        address: locationData.address || prev.address,
        googleMapsLink: link || prev.googleMapsLink
      }));
    }
  }, []);

  const handleCopyWhish = () => {
    navigator.clipboard.writeText('+961 70 123 456');
    setCopiedWhishNumber(true);
    setTimeout(() => setCopiedWhishNumber(false), 2500);
  };

  const createOrder = async (authToken = null) => {
    try {
      const formattedDeliveryPref = getFormattedDeliveryPreference();
      const orderData = {
        orderItems: cartItems.map(item => ({
          name: item.name,
          qty: item.quantity,
          image: item.image,
          price: item.price,
          unit: normalizeUnit(item.unit),
          instruction: item.instruction || item.specialInstructions || '',
          product: item._id || item.id
        })),
        customerInfo: {
          name: user?.name || formData.name,
          email: user?.email || '',
          phone: user?.phone || formData.phone,
          address: formData.address,
          googleMapsLink: formData.googleMapsLink,
          additionalInfo: formData.additionalInfo || '',
          deliveryPreference: formattedDeliveryPref,
          deliveryType: deliveryPreference,
          deliveryDate: deliveryPreference === 'schedule' ? scheduledDate : '',
          deliveryTimeSlot: deliveryPreference === 'schedule' ? scheduledTimeSlot : ''
        },
        deliveryPreference: formattedDeliveryPref,
        paymentMethod: paymentMethod,
        itemsPrice: cartTotal,
        shippingPrice: shippingCost,
        totalPrice: finalTotal
      };

      const config = authToken ? {
        headers: { Authorization: `Bearer ${authToken}` }
      } : {};

      await api.post('/orders', orderData, config);

      setOrderPlaced(true);
      clearCart();
      navigate('/profile', { state: { activeTab: 'orders' } });
    } catch (err) {
      console.error("Order failed", err);
      setError(err.message || "Failed to place order. Please try again.");
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError("");

    const normalizedPhone = normalizeLebanesePhoneNumber(formData.phone) || formData.phone;

    try {
      if (user) {
        const res = await api.put('/users/profile/phone', {
          phone: normalizedPhone,
          code: otpCode,
        });

        if (res.data.success) {
          login(localStorage.getItem('token'), res.data.user);
          setShowOtpModal(false);
          await createOrder();
        } else {
          throw new Error(res.data.message || 'Verification failed');
        }
      } else {
        const res = await api.post('/users/auth/verify-otp', { 
          phone: normalizedPhone, 
          code: otpCode 
        });

        const data = res.data;
        let authToken = data.token;
        let userData = data.user;

        if (data.isNewUser) {
          const regRes = await api.post('/users/auth/register', {
            name: formData.name,
            phone: normalizedPhone,
            location: formData.address
          });
          authToken = regRes.data.token;
          userData = regRes.data.user;
        }

        login(authToken, userData);
        setShowOtpModal(false);
        await createOrder(authToken);
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || err.message || "Invalid OTP. Please try again.");
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const currentName = user?.name || formData.name;
    const currentPhone = user?.phone || formData.phone;

    if (!currentName || !currentName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!formData.address || formData.address.trim() === '') {
      setError('Please select or pin your delivery location');
      return;
    }

    const normalizedPhone = normalizeLebanesePhoneNumber(currentPhone);
    if (!normalizedPhone) {
      setError('Please enter a valid Lebanese phone number (e.g., 70 123 456 or 03 123 456)');
      return;
    }
    
    // If user is already logged in AND has a verified phone number
    if (user && user.phone) {
      setLoading(true);
      await createOrder();
    } else {
      // Prompt for WhatsApp OTP verification (e.g. Google user without phone or Guest)
      setLoading(true);
      try {
        const phoneToSend = normalizedPhone || currentPhone;
        const res = await api.post('/users/auth/send-otp', { phone: phoneToSend });
        if (res.data.otp) {
          console.log('TEST OTP CODE:', res.data.otp);
          toast.success(`Verification Code: ${res.data.otp}`, { autoClose: 15000 });
          setOtpCode(res.data.otp);
        }
        setShowOtpModal(true);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to send verification code. Please check your phone number.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (cartItems.length === 0 && !orderPlaced) {
    navigate('/cart');
    return null;
  }

  // Determine if user has a verified account & phone
  const isFullyVerifiedUser = Boolean(user && user.phone);
  const isGoogleUserNeedingPhone = Boolean(user && !user.phone);

  return (
    <div className="checkout-page">
      {loading && <Loading text="Finalizing your fresh harvest order..." />}
      
      {/* Desktop Navigation */}
      <div className="checkout-desktop-nav">
        <Navbar />
      </div>

      {/* Mobile Streamlined Top Header */}
      <header className="checkout-mobile-header">
        <button 
          type="button" 
          className="checkout-mobile-back-btn" 
          onClick={() => navigate('/cart')}
          aria-label="Back to Cart"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="checkout-mobile-title-wrap">
          <h1 className="checkout-mobile-title">Checkout</h1>
          <span className="checkout-mobile-secure-badge">
            <Lock size={11} /> Secure & Encrypted
          </span>
        </div>
        <div className="checkout-mobile-header-right">
          <span className="checkout-mobile-count-pill">{cartCount}</span>
        </div>
      </header>

      {/* Mobile Collapsible Order Summary Accordion */}
      <div className="mobile-order-summary-toggle-bar">
        <button 
          type="button" 
          className="summary-toggle-btn"
          onClick={() => setShowOrderSummary(!showOrderSummary)}
        >
          <div className="toggle-left">
            <ShoppingBag size={18} className="toggle-bag-icon" />
            <span className="toggle-text">
              {showOrderSummary ? 'Hide Order Summary' : `Order Summary (${cartCount} items)`}
            </span>
            {showOrderSummary ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          <span className="toggle-price">{formatCurrency(finalTotal)}</span>
        </button>

        {showOrderSummary && (
          <div className="mobile-summary-expanded-content">
            <div className="mobile-summary-items-rail">
              {cartItems.map((item) => (
                <div key={item._id || item.id} className="mobile-summary-item-row">
                  <div className="mobile-item-thumb-box">
                    <img src={item.image} alt={item.name} />
                    <span className="mobile-item-qty-pill">{item.quantity}</span>
                  </div>
                  <div className="mobile-item-info">
                    <h4 className="mobile-item-name">{item.name}</h4>
                    <span className="mobile-item-unit-rate">
                      {formatCurrency(item.price)} / {normalizeUnit(item.unit)} • {formatQuantityWithUnit(item.quantity, item.unit)}
                    </span>
                    {item.instruction && (
                      <span className="mobile-item-instruction" style={{ display: 'block', fontSize: '0.75rem', color: '#16a34a', marginTop: '2px', fontStyle: 'italic' }}>
                        Note: "{item.instruction}"
                      </span>
                    )}
                  </div>
                  <span className="mobile-item-line-total">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mobile-summary-calc-box">
              <div className="calc-row">
                <span>Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <div className="calc-row">
                <span>Delivery</span>
                <span>{shippingCost === 0 ? <strong style={{ color: '#16a34a' }}>FREE</strong> : formatCurrency(shippingCost)}</span>
              </div>
              <div className="calc-row">
                <span>Timing</span>
                <span style={{ fontWeight: 700, color: '#15803d' }}>
                  {deliveryPreference === 'asap' && '⚡ ASAP'}
                  {deliveryPreference === 'anytime' && '🕒 Anytime'}
                  {deliveryPreference === 'schedule' && `📅 ${scheduledDayOption === 'today' ? 'Today' : scheduledDayOption === 'tomorrow' ? 'Tomorrow' : scheduledDate}`}
                </span>
              </div>
              <div className="calc-divider" />
              <div className="calc-row total">
                <span>Total</span>
                <span className="calc-total-val">{formatCurrency(finalTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Header Banner */}
      <div className="checkout-header desktop-only">
        <div className="container">
          <div className="checkout-breadcrumb">
            <Link to="/cart" className="breadcrumb-link">Cart</Link>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-active">Checkout</span>
          </div>

          <div className="checkout-header-content">
            <div>
              <h1 className="checkout-title">Checkout</h1>
              <p className="checkout-subtitle">Set your delivery location and choose payment method.</p>
            </div>
            <div className="desktop-secure-badge">
              <Lock size={14} /> Secure & Encrypted
            </div>
          </div>
        </div>
      </div>

      <div className="container checkout-container">
        <div className="checkout-grid">
          {/* Main Unified Form Section */}
          <div className="checkout-form-section">
            {error && (
              <div className="checkout-alert-error">
                <AlertCircle size={18} className="alert-icon" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} id="checkout-main-form" className="checkout-single-page-form">
              
              {/* BOX 1: User Account / Contact Details (Conditional) */}
              {isFullyVerifiedUser ? (
                /* Authenticated & Verified user -> Clean compact summary chip */
                <div className="checkout-user-logged-banner">
                  <div className="user-logged-left">
                    <div className="user-avatar-icon">
                      <User size={18} />
                    </div>
                    <div className="user-logged-info">
                      <span className="user-ordering-label">Ordering Account</span>
                      <strong className="user-logged-name">{user.name || 'Customer'}</strong>
                      <span className="user-logged-phone">
                        <Phone size={12} /> {user.phone}
                        <span className="verified-pill"><CheckCircle size={11} /> Verified</span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : isGoogleUserNeedingPhone ? (
                /* Google User without phone number -> Show phone number input only */
                <div className="checkout-section-box">
                  <div className="section-box-header">
                    <div className="section-header-icon-wrap user-icon">
                      <Phone size={18} />
                    </div>
                    <div>
                      <h2 className="section-box-title">WhatsApp Number</h2>
                      <p className="section-box-subtitle">Enter your phone number for delivery updates</p>
                    </div>
                  </div>

                  <div className="form-card-inner">
                    <div className="form-input-group">
                      <label htmlFor="phone" className="modern-label">
                        <Phone size={14} /> WhatsApp Number <span className="req-star">*</span>
                      </label>
                      <input 
                        id="phone"
                        type="tel" 
                        name="phone"
                        required 
                        placeholder="e.g. 70 123 456" 
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="modern-input"
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Guest User -> Show Name & Phone inputs */
                <div className="checkout-section-box">
                  <div className="section-box-header">
                    <div className="section-header-icon-wrap user-icon">
                      <User size={18} />
                    </div>
                    <div>
                      <h2 className="section-box-title">Contact Information</h2>
                      <p className="section-box-subtitle">Name & WhatsApp number</p>
                    </div>
                  </div>

                  <div className="form-card-inner">
                    <div className="form-grid-two">
                      <div className="form-input-group">
                        <label htmlFor="name" className="modern-label">
                          <User size={14} /> Full Name <span className="req-star">*</span>
                        </label>
                        <input 
                          id="name"
                          type="text" 
                          name="name"
                          required 
                          placeholder="e.g. John Doe" 
                          value={formData.name}
                          onChange={handleInputChange}
                          className="modern-input"
                        />
                      </div>

                      <div className="form-input-group">
                        <label htmlFor="phone" className="modern-label">
                          <Phone size={14} /> WhatsApp Number <span className="req-star">*</span>
                        </label>
                        <input 
                          id="phone"
                          type="tel" 
                          name="phone"
                          required 
                          placeholder="e.g. 70 123 456" 
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="modern-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BOX 2: Dedicated Delivery Address & Location Section */}
              <div className="checkout-section-box">
                <div className="section-box-header">
                  <div className="section-header-icon-wrap">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h2 className="section-box-title">Delivery Address</h2>
                    <p className="section-box-subtitle">Set your delivery location</p>
                  </div>
                </div>

                <div className="form-card-inner">
                  <LocationPicker 
                    onLocationSelect={handleLocationSelect} 
                    initialLocation={formData.address} 
                  />
                </div>
              </div>

              {/* BOX 3: Delivery Timing Preference */}
              <div className="checkout-section-box">
                <div className="section-box-header">
                  <div className="section-header-icon-wrap timing-icon">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h2 className="section-box-title">Delivery Time Preference</h2>
                    <p className="section-box-subtitle">Choose when you would like to receive your order</p>
                  </div>
                </div>

                <div className="form-card-inner">
                  <div className="delivery-timing-grid">
                    {/* ASAP */}
                    <div 
                      className={`timing-radio-card ${deliveryPreference === 'asap' ? 'selected' : ''}`}
                      onClick={() => setDeliveryPreference('asap')}
                    >
                      <div className="timing-card-header">
                        <div className="radio-indicator">
                          <div className="radio-dot" />
                        </div>
                        <div className="timing-icon-badge asap">
                          <Zap size={14} />
                        </div>
                        <span className="timing-pill asap-pill">Fastest</span>
                      </div>
                      <div className="timing-card-info">
                        <strong className="timing-card-title">ASAP</strong>
                        <p className="timing-card-desc">Express fresh delivery (~30–60 min)</p>
                      </div>
                    </div>

                    {/* Anytime */}
                    <div 
                      className={`timing-radio-card ${deliveryPreference === 'anytime' ? 'selected' : ''}`}
                      onClick={() => setDeliveryPreference('anytime')}
                    >
                      <div className="timing-card-header">
                        <div className="radio-indicator">
                          <div className="radio-dot" />
                        </div>
                        <div className="timing-icon-badge anytime">
                          <Clock size={14} />
                        </div>
                        <span className="timing-pill anytime-pill">Flexible</span>
                      </div>
                      <div className="timing-card-info">
                        <strong className="timing-card-title">Anytime Today</strong>
                        <p className="timing-card-desc">Flexible delivery (not in a hurry)</p>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div 
                      className={`timing-radio-card ${deliveryPreference === 'schedule' ? 'selected' : ''}`}
                      onClick={() => setDeliveryPreference('schedule')}
                    >
                      <div className="timing-card-header">
                        <div className="radio-indicator">
                          <div className="radio-dot" />
                        </div>
                        <div className="timing-icon-badge schedule">
                          <Calendar size={14} />
                        </div>
                        <span className="timing-pill schedule-pill">Planned</span>
                      </div>
                      <div className="timing-card-info">
                        <strong className="timing-card-title">Schedule Time</strong>
                        <p className="timing-card-desc">Pick preferred date & slot</p>
                      </div>
                    </div>
                  </div>

                  {/* Scheduled Date & Window Picker */}
                  {deliveryPreference === 'schedule' && (
                    <div className="schedule-picker-box">
                      {/* Date Selection */}
                      <div className="schedule-section">
                        <label className="schedule-label">
                          <Calendar size={13} /> Delivery Date
                        </label>
                        <div className="schedule-pills-row">
                          <button
                            type="button"
                            className={`schedule-pill-btn ${scheduledDayOption === 'today' ? 'active' : ''}`}
                            onClick={() => {
                              setScheduledDayOption('today');
                              setScheduledDate(todayIso);
                            }}
                          >
                            Today
                          </button>
                          <button
                            type="button"
                            className={`schedule-pill-btn ${scheduledDayOption === 'tomorrow' ? 'active' : ''}`}
                            onClick={() => {
                              setScheduledDayOption('tomorrow');
                              setScheduledDate(tomorrowIso);
                            }}
                          >
                            Tomorrow
                          </button>
                          <button
                            type="button"
                            className={`schedule-pill-btn ${scheduledDayOption === 'custom' ? 'active' : ''}`}
                            onClick={() => setScheduledDayOption('custom')}
                          >
                            Choose Date
                          </button>
                        </div>
                        {scheduledDayOption === 'custom' && (
                          <input
                            type="date"
                            min={todayIso}
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="modern-input schedule-custom-date"
                          />
                        )}
                      </div>

                      {/* Time Slot Selection */}
                      <div className="schedule-section">
                        <label className="schedule-label">
                          <Clock size={13} /> Preferred Time Window
                        </label>
                        <div className="schedule-pills-row time-slots">
                          <button
                            type="button"
                            className={`schedule-pill-btn ${scheduledTimeSlot === 'Morning (09:00 AM - 12:00 PM)' ? 'active' : ''}`}
                            onClick={() => setScheduledTimeSlot('Morning (09:00 AM - 12:00 PM)')}
                          >
                            🌅 Morning (9 AM - 12 PM)
                          </button>
                          <button
                            type="button"
                            className={`schedule-pill-btn ${scheduledTimeSlot === 'Afternoon (12:00 PM - 04:00 PM)' ? 'active' : ''}`}
                            onClick={() => setScheduledTimeSlot('Afternoon (12:00 PM - 4 PM)')}
                          >
                            ☀️ Afternoon (12 PM - 4 PM)
                          </button>
                          <button
                            type="button"
                            className={`schedule-pill-btn ${scheduledTimeSlot === 'Evening (04:00 PM - 08:00 PM)' ? 'active' : ''}`}
                            onClick={() => setScheduledTimeSlot('Evening (4 PM - 8 PM)')}
                          >
                            🌙 Evening (4 PM - 8 PM)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* BOX 4: Dedicated Payment Method Section */}
              <div className="checkout-section-box">
                <div className="section-box-header">
                  <div className="section-header-icon-wrap payment">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h2 className="section-box-title">Payment Method</h2>
                    <p className="section-box-subtitle">Choose payment method</p>
                  </div>
                </div>

                <div className="form-card-inner">
                  <div className="modern-payment-options">
                    {/* Cash on Delivery */}
                    <div 
                      className={`payment-radio-card ${paymentMethod === 'Cash on Delivery' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('Cash on Delivery')}
                    >
                      <div className="radio-indicator">
                        <div className="radio-dot" />
                      </div>
                      <div className="payment-card-icon-wrap cod">
                        <Truck size={18} />
                      </div>
                      <div className="payment-card-info">
                        <div className="payment-title-row">
                          <strong className="payment-title">Cash on Delivery</strong>
                        </div>
                        <p className="payment-desc">Pay cash on delivery</p>
                      </div>
                    </div>

                    {/* Whish Money */}
                    <div 
                      className={`payment-radio-card ${paymentMethod === 'Whish Money' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('Whish Money')}
                    >
                      <div className="radio-indicator">
                        <div className="radio-dot" />
                      </div>
                      <div className="payment-card-icon-wrap whish">
                        <CreditCard size={18} />
                      </div>
                      <div className="payment-card-info">
                        <div className="payment-title-row">
                          <strong className="payment-title">Whish Money</strong>
                        </div>
                        <p className="payment-desc">Pay via Whish</p>
                      </div>
                    </div>
                  </div>

                  {/* Whish Money Details Box */}
                  {paymentMethod === 'Whish Money' && (
                    <div className="whish-instructions-card">
                      <div className="whish-header">
                        <span className="whish-badge">Whish Money Transfer</span>
                        <button 
                          type="button" 
                          className="copy-whish-btn"
                          onClick={handleCopyWhish}
                        >
                          {copiedWhishNumber ? (
                            <><Check size={13} /> Copied</>
                          ) : (
                            <><Copy size={13} /> Copy Number</>
                          )}
                        </button>
                      </div>
                      <div className="whish-account-row">
                        <span className="whish-num">+961 70 123 456</span>
                        <span className="whish-holder">Chocair Fresh</span>
                      </div>
                      <p className="whish-note">
                        Transfer exact total: <strong>{formatCurrency(finalTotal)}</strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* BOX 5: Delivery Notes / Special Instructions */}
              <div className="checkout-section-box">
                <div className="section-box-header">
                  <div className="section-header-icon-wrap notes-icon">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h2 className="section-box-title">Delivery Notes <span className="opt-tag">(Optional)</span></h2>
                    <p className="section-box-subtitle">Special instructions for the courier</p>
                  </div>
                </div>

                <div className="form-card-inner">
                  <div className="form-input-group">
                    <textarea 
                      id="additionalInfo"
                      name="additionalInfo"
                      rows={2}
                      placeholder="e.g. Ring bell twice, leave with concierge, or call on arrival..." 
                      value={formData.additionalInfo}
                      onChange={handleInputChange}
                      className="modern-textarea"
                    />
                  </div>
                </div>
              </div>

              {/* Desktop Submit Action */}
              <div className="desktop-submit-action desktop-only">
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="desktop-place-order-btn" 
                  disabled={loading}
                >
                  <Lock size={17} style={{ marginRight: 8 }} />
                  {loading ? 'Processing Order...' : `Place Order • ${formatCurrency(finalTotal)}`}
                  <ArrowRight size={18} style={{ marginLeft: 8 }} />
                </Button>
              </div>
            </form>
          </div>

          {/* Desktop Order Summary Sidebar */}
          <aside className="checkout-summary-sidebar">
            <div className="checkout-summary-card">
              <div className="sidebar-header">
                <h3 className="sidebar-title">Order Summary</h3>
                <span className="sidebar-items-count">{cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
              </div>

              {/* Items List */}
              <div className="sidebar-items-list">
                {cartItems.map(item => (
                  <div key={item._id || item.id} className="sidebar-item-row">
                    <div className="sidebar-item-thumb">
                      <img src={item.image} alt={item.name} />
                      <span className="thumb-qty-pill">{item.quantity}</span>
                    </div>
                    <div className="sidebar-item-info">
                      <h4 className="sidebar-item-name">{item.name}</h4>
                      <span className="sidebar-item-rate">
                        {formatCurrency(item.price)} / {normalizeUnit(item.unit)} • {formatQuantityWithUnit(item.quantity, item.unit)}
                      </span>
                      {item.instruction && (
                        <span className="sidebar-item-instruction" style={{ display: 'block', fontSize: '0.75rem', color: '#16a34a', marginTop: '2px', fontStyle: 'italic' }}>
                          Note: "{item.instruction}"
                        </span>
                      )}
                    </div>
                    <span className="sidebar-item-price">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Calculations */}
              <div className="sidebar-calc-box">
                <div className="sidebar-calc-row">
                  <span>Subtotal</span>
                  <span className="calc-val">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="sidebar-calc-row">
                  <span>Delivery</span>
                  <span className="calc-val">
                    {shippingCost === 0 ? (
                      <span className="free-tag">FREE</span>
                    ) : (
                      formatCurrency(shippingCost)
                    )}
                  </span>
                </div>
                <div className="sidebar-calc-row">
                  <span>Timing</span>
                  <span className="calc-val" style={{ color: '#15803d', fontWeight: 700 }}>
                    {deliveryPreference === 'asap' && '⚡ ASAP'}
                    {deliveryPreference === 'anytime' && '🕒 Anytime (Flexible)'}
                    {deliveryPreference === 'schedule' && `📅 ${scheduledDayOption === 'today' ? 'Today' : scheduledDayOption === 'tomorrow' ? 'Tomorrow' : scheduledDate}`}
                  </span>
                </div>
                
                <div className="sidebar-divider" />
                
                <div className="sidebar-calc-row total-row">
                  <div className="total-label-col">
                    <span className="total-main-label">Total Amount</span>
                    <span className="tax-hint">VAT Included</span>
                  </div>
                  <span className="total-final-val">{formatCurrency(finalTotal)}</span>
                </div>
              </div>

              <div className="sidebar-security-badge">
                <Lock size={15} />
                <span>256-Bit SSL Encrypted & Protected</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Floating Bottom Sticky Action Dock */}
      <div className="mobile-checkout-dock">
        <div className="mobile-dock-total">
          <span className="dock-total-label">Total Amount</span>
          <span className="dock-total-price">{formatCurrency(finalTotal)}</span>
        </div>
        
        <Button 
          variant="primary" 
          className="mobile-dock-btn"
          disabled={loading}
          onClick={() => {
            const form = document.getElementById('checkout-main-form');
            if (form) form.requestSubmit();
          }}
        >
          <Lock size={15} style={{ marginRight: 4 }} />
          {loading ? 'Processing...' : 'Place Order'}
          <ArrowRight size={16} />
        </Button>
      </div>

      {/* Modern WhatsApp OTP Modal */}
      {showOtpModal && (
        <div className="modal-overlay">
          <div className="modal-content-card">
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setShowOtpModal(false)}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            
            <div className="otp-modal-header">
              <div className="otp-icon-wrap">
                <MessageSquare size={28} />
              </div>
              <h2 className="otp-title">Verify Phone Number</h2>
              <p className="otp-subtitle">
                We sent a 6-digit WhatsApp verification code to <strong>{formData.phone}</strong>
              </p>

              {otpCode && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '12px',
                  padding: '0.65rem 0.9rem',
                  textAlign: 'center',
                  fontSize: '0.82rem',
                  color: '#15803d',
                  fontWeight: '600',
                  marginTop: '0.75rem'
                }}>
                  <span>🧪 Testing Code: </span>
                  <strong style={{ fontSize: '1.05rem', letterSpacing: '2px', color: '#166534' }}>{otpCode}</strong>
                </div>
              )}
            </div>
            
            {otpError && (
              <div className="otp-error-banner">
                <AlertCircle size={15} /> {otpError}
              </div>
            )}
            
            <form onSubmit={handleVerifyOtp} className="otp-form">
              <div className="otp-input-wrap">
                <label className="otp-label">Enter 6-Digit Code</label>
                <input 
                  type="text" 
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="• • • • • •"
                  maxLength={6}
                  required
                  autoFocus
                  className="otp-pin-input"
                />
              </div>

              <Button 
                variant="primary" 
                type="submit" 
                disabled={otpLoading || otpCode.length < 4} 
                className="otp-verify-btn"
              >
                {otpLoading ? 'Verifying Code...' : 'Confirm & Place Order'}
              </Button>

              <button 
                type="button" 
                className="otp-change-phone-btn"
                onClick={() => setShowOtpModal(false)}
              >
                Change Phone Number
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
