import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Truck, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import api, { getStoredUser } from '../utils/api';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Details, 2: Payment, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: ""
  });

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.name ? user.name.split(' ')[0] : '',
        lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, []);

  const [paymentMethod, setPaymentMethod] = useState("Credit Card");

  const shippingCost = cartTotal > 50 ? 0 : 5.99;
  const finalTotal = cartTotal + shippingCost;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setLoading(true);
      setError("");

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
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            country: formData.country || "USA"
          },
          paymentMethod: paymentMethod,
          itemsPrice: cartTotal,
          shippingPrice: shippingCost,
          totalPrice: finalTotal
        };

        await api.post('/orders', orderData);

        setLoading(false);
        setStep(3);
        clearCart();
      } catch (err) {
        console.error("Order failed", err);
        setError(err.message || "Failed to place order. Please try again.");
        setLoading(false);
      }
    }
  };

  if (cartItems.length === 0 && step !== 3) {
    navigate('/cart');
    return null;
  }

  if (step === 3) {
    return (
      <div className="checkout-page">
        <Navbar />
        <div className="container success-container">
          <div className="success-card">
            <div className="success-icon">
              <CheckCircle size={64} />
            </div>
            <h1>Order Placed Successfully!</h1>
            <p>Thank you for your purchase. Your order has been confirmed.</p>
            <p className="email-note">We've sent a confirmation email to {formData.email}.</p>
            <Button variant="primary" onClick={() => navigate('/')}>
              Return Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
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
            <div className="step-line"></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-icon"><CheckCircle size={20} /></div>
              <span>Confirmation</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container checkout-container">
        <div className="checkout-grid">
          {/* Form Section */}
          <div className="checkout-form-section">
            {error && (
              <div style={{ 
                backgroundColor: '#ffebee', 
                color: '#c62828', 
                padding: '10px', 
                borderRadius: '4px', 
                marginBottom: '20px' 
              }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              {step === 1 ? (
                <div className="form-step">
                  <h2>Shipping Details</h2>
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input 
                        type="text" 
                        name="firstName"
                        required 
                        placeholder="John" 
                        value={formData.firstName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input 
                        type="text" 
                        name="lastName"
                        required 
                        placeholder="Doe" 
                        value={formData.lastName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email Address</label>
                      <input 
                        type="email" 
                        name="email"
                        required 
                        placeholder="john@example.com" 
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
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
                    <label>Street Address</label>
                    <input 
                      type="text" 
                      name="address"
                      required 
                      placeholder="123 Green St" 
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>City</label>
                      <input 
                        type="text" 
                        name="city"
                        required 
                        placeholder="New York" 
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Zip Code</label>
                      <input 
                        type="text" 
                        name="postalCode"
                        required 
                        placeholder="10001" 
                        value={formData.postalCode}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Country</label>
                    <input 
                      type="text" 
                      name="country"
                      placeholder="USA" 
                      value={formData.country}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <Button variant="primary" type="submit" className="next-btn">
                    Continue to Payment
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
                      {loading ? 'Processing...' : `Pay $${finalTotal.toFixed(2)}`}
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
    </div>
  );
};

export default Checkout;
