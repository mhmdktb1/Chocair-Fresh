import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Truck, MapPin, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import LocationPicker from '../components/common/LocationPicker';
import Loading from '../components/common/Loading';
import api from '../utils/api';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Details, 2: Payment
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [devOtp, setDevOtp] = useState(""); // For testing purposes

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    googleMapsLink: ""
  });

  const [paymentMethod, setPaymentMethod] = useState("Credit Card");

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    } else {
      // Clear form data when logged out
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

      // If we have a token (from fresh login), use it in headers
      const config = authToken ? {
        headers: { Authorization: `Bearer ${authToken}` }
      } : {};

      await api.post('/orders', orderData, config);

      clearCart();
      navigate('/profile'); // Redirect to Order History
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
      setError("Please log in to place an order.");
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError("");

    try {
      const res = await api.post('/users/auth/verify-otp', { 
        phone: formData.phone, 
        code: otpCode 
      });

      const data = res.data;
      let authToken = data.token;
      let userData = data.user;

      if (data.isNewUser) {
        // Register the new user
        const regRes = await api.post('/users/auth/register', {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          location: formData.address
        });
        authToken = regRes.data.token;
        userData = regRes.data.user;
      }

      // Login the user in frontend
      login(authToken, userData);
      setShowOtpModal(false);
      
      // Proceed to Payment Step
      setStep(2);

    } catch (err) {
      setOtpError(err.message || "Invalid OTP. Please try again.");
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      // Validate address/location is set
      if (!formData.address || formData.address.trim() === '') {
        setError('Please select your delivery location');
        return;
      }
      
      if (user) {
        setStep(2);
      } else {
        // User is NOT logged in - Start OTP Flow BEFORE Payment
        setLoading(true);
        try {
          const res = await api.post('/users/auth/send-otp', { phone: formData.phone });
          if (res.data.otp) {
            setDevOtp(res.data.otp);
          }
          setShowOtpModal(true);
        } catch (err) {
          setError(err.message || "Failed to send OTP. Please check your phone number.");
        } finally {
          setLoading(false);
        }
      }
    } else if (step === 2) {
      handlePlaceOrder();
    }
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="checkout-page">
      {loading && <Loading text="Processing your fresh order..." />}
      <Navbar />
      
      <div className="checkout-header">
        <div className="container">
          <h1 className="checkout-title">Checkout</h1>
          <div className="checkout-steps">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-icon"><MapPin size={20} /></div>
              <span>Shipping</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-icon"><CreditCard size={20} /></div>
              <span>Payment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container checkout-container">
        <div className="checkout-grid">
          {/* Form Section */}
          <div className="checkout-form-section">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              {step === 1 ? (
                <div className="form-step">
                  <h2>Shipping Details</h2>
                  
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      name="name"
                      required 
                      placeholder="John Doe" 
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email Address (Optional)</label>
                      <input 
                        type="email" 
                        name="email"
                        placeholder="john@example.com" 
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        Phone Number
                        {user && user.phone === formData.phone && (
                          <span style={{ color: 'var(--success)', marginLeft: '8px', fontSize: '0.85em', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> Verified
                          </span>
                        )}
                      </label>
                      <input 
                        type="tel" 
                        name="phone"
                        required 
                        placeholder="+1 (555) 000-0000" 
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Delivery Location</label>
                    <LocationPicker onLocationSelect={handleLocationSelect} initialLocation={formData.address} />
                  </div>
                  
                  <Button variant="primary" type="submit" className="next-btn" disabled={loading}>
                    {loading ? 'Verifying...' : 'Continue to Payment'}
                  </Button>
                </div>
              ) : (
                <div className="form-step">
                  <h2>Payment Method</h2>
                  <div className="payment-options">
                    <div 
                      className={`payment-option ${paymentMethod === 'Credit Card' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('Credit Card')}
                    >
                      <CreditCard size={24} />
                      <span>Credit Card</span>
                    </div>
                    <div 
                      className={`payment-option ${paymentMethod === 'Cash on Delivery' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('Cash on Delivery')}
                    >
                      <Truck size={24} />
                      <span>Cash on Delivery</span>
                    </div>
                  </div>
                  
                  {paymentMethod === 'Credit Card' && (
                    <>
                      <div className="form-group">
                        <label>Card Number</label>
                        <input type="text" placeholder="0000 0000 0000 0000" />
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>Expiry Date</label>
                          <input type="text" placeholder="MM/YY" />
                        </div>
                        <div className="form-group">
                          <label>CVC</label>
                          <input type="text" placeholder="123" />
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="form-actions">
                    <Button variant="secondary" onClick={() => setStep(1)} type="button">
                      Back
                    </Button>
                    <Button variant="primary" type="submit" className="pay-btn" disabled={loading}>
                      {loading ? 'Processing...' : `Place Order - $${finalTotal.toFixed(2)}`}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="checkout-summary">
            <h3>Order Summary</h3>
            <div className="summary-items">
              {cartItems.map(item => (
                <div key={item._id || item.id} className="summary-item">
                  <div className="summary-item-info">
                    <img src={item.image} alt={item.name} />
                    <div>
                      <h4>{item.name}</h4>
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="summary-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowOtpModal(false)}>
              <X size={24} />
            </button>
            <h2>Verify Phone Number</h2>
            <p>We sent a code to {formData.phone}</p>

            {devOtp && (
              <div style={{ 
                backgroundColor: '#e8f5e9', 
                color: '#2e7d32', 
                padding: '10px', 
                borderRadius: '4px', 
                marginBottom: '15px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                Your OTP Code: {devOtp}
              </div>
            )}
            
            {otpError && <div className="error-message">{otpError}</div>}
            
            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label>Enter OTP Code</label>
                <input 
                  type="text" 
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  required
                  autoFocus
                />
              </div>
              <Button variant="primary" type="submit" disabled={otpLoading} style={{ width: '100%' }}>
                {otpLoading ? 'Verifying...' : 'Verify & Place Order'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
