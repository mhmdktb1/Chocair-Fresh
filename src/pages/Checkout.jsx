import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/checkout.css";
import { CreditCard, Truck, MapPin, User, Mail, DollarSign, LocateFixed } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { post } from "../utils/api";
import Header from "../components/layout/Header";

function Checkout() {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    paymentMethod: "cash", // Default to cash
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        orderItems: cartItems.map(item => ({
          product: item._id || item.id,
          name: item.name,
          image: item.image,
          price: item.price,
          qty: item.qty
        })),
        customerInfo: {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: 'Lebanon'
        },
        paymentMethod: formData.paymentMethod === 'card' ? 'Credit Card' : 'Cash on Delivery',
        itemsPrice: getCartTotal(),
        shippingPrice: 5.00,
        totalPrice: getCartTotal() + 5.00
      };

      const response = await post('/orders', orderData);
      
      localStorage.setItem('userEmail', formData.email);
      clearCart();
      alert('Order placed successfully!');
      navigate('/order-success', { state: { orderId: response._id } });
    } catch (error) {
      console.error("Order failed", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <>
        <Header />
        <div className="empty-cart-container" style={{ textAlign: 'center', marginTop: '100px' }}>
          <h2>Your cart is empty</h2>
          <button onClick={() => navigate('/products')} className="btn-primary">Go Shopping</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>
        
        <div className="checkout-grid">
          {/* Form Section */}
          <div className="checkout-form-section">
            <h2>Shipping Details</h2>
            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="form-group">
                <User size={18} />
                <input 
                  type="text" 
                  name="fullName" 
                  placeholder="Full Name" 
                  value={formData.fullName}
                  onChange={handleChange}
                  required 
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <Mail size={18} />
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="Email" 
                    value={formData.email}
                    onChange={handleChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <Truck size={18} />
                  <input 
                    type="tel" 
                    name="phone" 
                    placeholder="Phone Number" 
                    value={formData.phone}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <MapPin size={18} />
                <input 
                  type="text" 
                  name="address" 
                  placeholder="Address" 
                  value={formData.address}
                  onChange={handleChange}
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <input 
                    type="text" 
                    name="city" 
                    placeholder="City" 
                    value={formData.city}
                    onChange={handleChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <input 
                    type="text" 
                    name="postalCode" 
                    placeholder="Postal Code" 
                    value={formData.postalCode}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="payment-methods">
                <h3>Payment Method</h3>
                <div className="payment-options">
                  <label className={`payment-option ${formData.paymentMethod === 'cash' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="cash" 
                      checked={formData.paymentMethod === 'cash'}
                      onChange={handleChange}
                    />
                    <DollarSign size={20} />
                    <span>Cash on Delivery</span>
                  </label>
                  <label className={`payment-option ${formData.paymentMethod === 'card' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="card" 
                      checked={formData.paymentMethod === 'card'}
                      onChange={handleChange}
                    />
                    <CreditCard size={20} />
                    <span>Credit Card</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Processing...' : `Place Order ($${(getCartTotal() + 5).toFixed(2)})`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-items">
              {cartItems.map(item => (
                <div key={item.id} className="summary-item">
                  <div className="item-info">
                    <img src={item.image} alt={item.name} />
                    <div>
                      <h4>{item.name}</h4>
                      <p>Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="item-price">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="summary-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Shipping</span>
                <span>$5.00</span>
              </div>
              <div className="total-row final">
                <span>Total</span>
                <span>${(getCartTotal() + 5).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Checkout;