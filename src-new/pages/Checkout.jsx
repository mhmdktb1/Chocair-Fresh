import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, CreditCard, Truck, MapPin, X, ArrowLeft, ArrowRight,
  ShieldCheck, Lock, ChevronDown, ChevronUp, ShoppingBag, Phone, User,
  Mail, MessageSquare, AlertCircle, Copy, Check
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { normalizeLebanesePhoneNumber } from '../utils/phoneUtils';
import { formatCurrency } from '../utils/formatters';
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
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment
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
    email: "",
    phone: "",
    address: "",
    googleMapsLink: ""
  });

  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        googleMapsLink: ""
      });
    }
  }, [user]);

  const shippingCost = cartTotal > 50 ? 0 : 5.99;
  const finalTotal = cartTotal + shippingCost;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (locationData) => {
    if (typeof locationData === 'string') {
      setFormData(prev => ({
        ...prev,
        address: locationData
      }));
    } else {
      const link = `https://www.google.com/maps/search/?api=1&query=${locationData.lat},${locationData.lng}`;
      setFormData(prev => ({
        ...prev,
        address: locationData.address,
        googleMapsLink: link
      }));
    }
  };

  const handleCopyWhish = () => {
    navigator.clipboard.writeText('+961 70 123 456');
    setCopiedWhishNumber(true);
    setTimeout(() => setCopiedWhishNumber(false), 2500);
  };

  const createOrder = async (authToken = null) => {
    try {
      const orderData = {
        orderItems: cartItems.map(item => ({
          name: item.name,
          qty: item.quantity,
          image: item.image,
          price: item.price,
          product: item._id || item.id
        })),
        customerInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          googleMapsLink: formData.googleMapsLink
        },
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

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError("");

    if (user) {
      await createOrder();
    } else {
      setError("Please verify your phone number to complete your order.");
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
          setStep(2);
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
            email: formData.email,
            location: formData.address
          });
          authToken = regRes.data.token;
          userData = regRes.data.user;
        }

        login(authToken, userData);
        setShowOtpModal(false);
        setStep(2);
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || err.message || "Invalid OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (step === 1) {
      if (!formData.name.trim()) {
        setError('Please enter your full name');
        return;
      }

      if (!formData.address || formData.address.trim() === '') {
        setError('Please select or pin your delivery location');
        return;
      }

      const normalizedPhone = normalizeLebanesePhoneNumber(formData.phone);
      if (!normalizedPhone && !formData.phone) {
        setError('Please enter a valid Lebanese phone number');
        return;
      }
      
      if (user && user.phone) {
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setLoading(true);
        try {
          const phoneToSend = normalizedPhone || formData.phone;
          const res = await api.post('/users/auth/send-otp', { phone: phoneToSend });
          setShowOtpModal(true);
        } catch (err) {
          setError(err.response?.data?.message || err.message || "Failed to send verification code. Please check your phone number.");
        } finally {
          setLoading(false);
        }
      }
    } else if (step === 2) {
      handlePlaceOrder();
    }
  };

  if (cartItems.length === 0 && !orderPlaced) {
    navigate('/cart');
    return null;
  }

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
          onClick={() => {
            if (step === 2) setStep(1);
            else navigate('/cart');
          }}
          aria-label="Go Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="checkout-mobile-title-wrap">
          <h1 className="checkout-mobile-title">Secure Checkout</h1>
          <span className="checkout-mobile-secure-badge">
            <Lock size={12} /> 256-Bit Encrypted
          </span>
        </div>
        <div style={{ width: 34 }} />
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
              {showOrderSummary ? 'Hide Order Summary' : 'Show Order Summary'}
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
                    <span className="mobile-item-unit-rate">{formatCurrency(item.price)} each</span>
                  </div>
                  <span className="mobile-item-line-total">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mobile-summary-calc-box">
              <div className="calc-row">
                <span>Subtotal ({cartCount} items)</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <div className="calc-row">
                <span>Delivery</span>
                <span>{shippingCost === 0 ? <strong style={{ color: '#16a34a' }}>FREE</strong> : formatCurrency(shippingCost)}</span>
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
            <h1 className="checkout-title">Checkout</h1>
            
            {/* 2-Step Segmented Bar */}
            <div className="checkout-step-pills">
              <div 
                className={`step-pill ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}
                onClick={() => step === 2 && setStep(1)}
              >
                <div className="pill-num">
                  {step > 1 ? <Check size={14} /> : '1'}
                </div>
                <div className="pill-text">
                  <span className="pill-label">Step 1</span>
                  <span className="pill-name">Delivery Address</span>
                </div>
              </div>

              <div className="step-pill-arrow">
                <ArrowRight size={16} />
              </div>

              <div className={`step-pill ${step === 2 ? 'active' : ''}`}>
                <div className="pill-num">2</div>
                <div className="pill-text">
                  <span className="pill-label">Step 2</span>
                  <span className="pill-name">Payment & Place</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container checkout-container">
        {/* Mobile Mini Step Progress Ribbon */}
        <div className="mobile-step-pill-banner">
          <div className={`mobile-step-tab ${step === 1 ? 'active' : 'completed'}`} onClick={() => step === 2 && setStep(1)}>
            <span className="step-circle">{step > 1 ? <Check size={12} /> : '1'}</span>
            <span>Delivery</span>
          </div>
          <div className="mobile-step-sep" />
          <div className={`mobile-step-tab ${step === 2 ? 'active' : ''}`}>
            <span className="step-circle">2</span>
            <span>Payment</span>
          </div>
        </div>

        <div className="checkout-grid">
          {/* Main Form Section */}
          <div className="checkout-form-section">
            {error && (
              <div className="checkout-alert-error">
                <AlertCircle size={18} className="alert-icon" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} id="checkout-main-form">
              {step === 1 ? (
                <div className="checkout-step-block">
                  <div className="step-block-header">
                    <div className="step-header-icon-wrap">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h2 className="step-block-title">Delivery Details</h2>
                      <p className="step-block-subtitle">Where should we deliver your farm-fresh harvest?</p>
                    </div>
                  </div>

                  {/* Contact Fields */}
                  <div className="form-card-box">
                    <div className="form-input-group">
                      <label htmlFor="name" className="modern-label">
                        <User size={15} /> Full Name <span className="req-star">*</span>
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

                    <div className="form-grid-two">
                      <div className="form-input-group">
                        <label htmlFor="phone" className="modern-label">
                          <Phone size={15} /> Phone (WhatsApp) <span className="req-star">*</span>
                          {user && user.phone && user.phone === formData.phone && (
                            <span className="verified-badge">
                              <CheckCircle size={12} /> Verified
                            </span>
                          )}
                        </label>
                        <input 
                          id="phone"
                          type="tel" 
                          name="phone"
                          required 
                          placeholder="e.g. 70 123 456 or +961 70 123456" 
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="modern-input"
                        />
                      </div>

                      <div className="form-input-group">
                        <label htmlFor="email" className="modern-label">
                          <Mail size={15} /> Email <span className="opt-label">(Optional)</span>
                        </label>
                        <input 
                          id="email"
                          type="email" 
                          name="email"
                          placeholder="john@example.com" 
                          value={formData.email}
                          onChange={handleInputChange}
                          className="modern-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location Picker Box */}
                  <div className="form-card-box location-box">
                    <label className="modern-label map-label">
                      <MapPin size={15} /> Pin Your Delivery Location <span className="req-star">*</span>
                    </label>
                    <p className="location-hint">
                      Use GPS or tap the map to ensure our courier arrives at your exact building/doorstep.
                    </p>
                    <div className="location-picker-wrapper">
                      <LocationPicker 
                        onLocationSelect={handleLocationSelect} 
                        initialLocation={formData.address} 
                      />
                    </div>
                  </div>

                  <div className="step-actions desktop-only">
                    <Button 
                      variant="primary" 
                      type="submit" 
                      className="step-primary-btn" 
                      disabled={loading}
                    >
                      {loading ? 'Validating...' : 'Continue to Payment'}
                      <ArrowRight size={18} style={{ marginLeft: 8 }} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="checkout-step-block">
                  <div className="step-block-header">
                    <div className="step-header-icon-wrap">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h2 className="step-block-title">Payment Method</h2>
                      <p className="step-block-subtitle">Choose how you would like to pay for your harvest.</p>
                    </div>
                  </div>

                  {/* Delivery Location Summary Badge */}
                  <div className="delivery-location-summary-card">
                    <div className="loc-summary-icon">
                      <MapPin size={18} />
                    </div>
                    <div className="loc-summary-text">
                      <span className="loc-summary-label">Delivering to:</span>
                      <strong className="loc-summary-val">{formData.name} • {formData.phone}</strong>
                      <span className="loc-summary-addr">{formData.address}</span>
                    </div>
                    <button 
                      type="button" 
                      className="loc-edit-btn"
                      onClick={() => setStep(1)}
                    >
                      Change
                    </button>
                  </div>

                  {/* Modern Payment Selector */}
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
                        <Truck size={22} />
                      </div>
                      <div className="payment-card-info">
                        <div className="payment-title-row">
                          <strong className="payment-title">Cash on Delivery (COD)</strong>
                          <span className="popular-badge">Most Popular</span>
                        </div>
                        <p className="payment-desc">
                          Pay cash (USD or LBP at market rate) directly to our courier upon doorstep delivery.
                        </p>
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
                        <CreditCard size={22} />
                      </div>
                      <div className="payment-card-info">
                        <div className="payment-title-row">
                          <strong className="payment-title">Whish Money Transfer</strong>
                          <span className="instant-badge">⚡ Instant</span>
                        </div>
                        <p className="payment-desc">
                          Transfer directly via Whish Money mobile app or any authorized agent.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Whish Money Details Box */}
                  {paymentMethod === 'Whish Money' && (
                    <div className="whish-instructions-card">
                      <div className="whish-header">
                        <span className="whish-badge">Whish Money Account</span>
                        <button 
                          type="button" 
                          className="copy-whish-btn"
                          onClick={handleCopyWhish}
                        >
                          {copiedWhishNumber ? (
                            <><Check size={14} /> Copied</>
                          ) : (
                            <><Copy size={14} /> Copy Number</>
                          )}
                        </button>
                      </div>
                      <div className="whish-account-row">
                        <span className="whish-num">+961 70 123 456</span>
                        <span className="whish-holder">Chocair Fresh</span>
                      </div>
                      <p className="whish-note">
                        Transfer exact amount: <strong>{formatCurrency(finalTotal)}</strong>. Our dispatcher verifies the transaction automatically.
                      </p>
                    </div>
                  )}

                  {/* Trust note */}
                  <div className="checkout-guarantee-box">
                    <ShieldCheck size={18} className="shield-icon" />
                    <span>Your order is backed by Chocair Fresh 100% Quality Guarantee.</span>
                  </div>

                  <div className="step-actions desktop-only">
                    <Button 
                      variant="secondary" 
                      onClick={() => setStep(1)} 
                      type="button"
                      className="step-back-btn"
                    >
                      ← Back to Address
                    </Button>
                    <Button 
                      variant="primary" 
                      type="submit" 
                      className="step-primary-btn" 
                      disabled={loading}
                    >
                      <Lock size={16} style={{ marginRight: 6 }} />
                      {loading ? 'Processing Order...' : `Place Order • ${formatCurrency(finalTotal)}`}
                    </Button>
                  </div>
                </div>
              )}
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
                      <span className="sidebar-item-rate">{formatCurrency(item.price)} each</span>
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
                
                <div className="sidebar-divider" />
                
                <div className="sidebar-calc-row total-row">
                  <div className="total-label-col">
                    <span className="total-main-label">Total</span>
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
        
        {step === 1 ? (
          <Button 
            variant="primary" 
            className="mobile-dock-btn"
            disabled={loading}
            onClick={() => {
              const form = document.getElementById('checkout-main-form');
              if (form) form.requestSubmit();
            }}
          >
            {loading ? 'Validating...' : 'Continue to Payment'}
            <ArrowRight size={16} />
          </Button>
        ) : (
          <Button 
            variant="primary" 
            className="mobile-dock-btn pay"
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
        )}
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
                {otpLoading ? 'Verifying Code...' : 'Confirm & Proceed to Payment'}
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
