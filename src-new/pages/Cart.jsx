import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import './Cart.css';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
  const navigate = useNavigate();
  const shippingCost = cartTotal > 50 ? 0 : 5.99;
  const finalTotal = cartTotal + shippingCost;

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="container cart-empty-state">
          <div className="empty-cart-icon">
            <ShoppingBag size={64} />
          </div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything to your cart yet.</p>
          <Button variant="primary" onClick={() => navigate('/shop')}>
            Start Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Navbar />
      
      <div className="cart-header">
        <div className="container">
          <h1 className="cart-title">Shopping Cart</h1>
        </div>
      </div>

      <div className="container cart-container">
        <div className="cart-grid">
          {/* Cart Items List */}
          <div className="cart-items">
            <div className="cart-items-header">
              <span>Product</span>
              <span>Quantity</span>
              <span>Total</span>
            </div>
            
            {cartItems.map((item) => (
              <div key={item._id} className="cart-item">
                <div className="item-info">
                  <img src={item.image} alt={item.name} className="item-image" />
                  <div className="item-details">
                    <span className="item-category">{item.category}</span>
                    <h3 className="item-name">{item.name}</h3>
                    <span className="item-price">${item.price.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="item-quantity">
                  <button 
                    className="qty-btn"
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button 
                    className="qty-btn"
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <div className="item-total">
                  <span className="total-price">${(item.price * item.quantity).toFixed(2)}</span>
                  <button 
                    className="remove-btn"
                    onClick={() => removeFromCart(item._id)}
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="cart-summary">
            <h2 className="summary-title">Order Summary</h2>
            
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            
            <div className="summary-row">
              <span>Shipping</span>
              <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
            </div>
            
            {shippingCost > 0 && (
              <div className="shipping-note">
                Free shipping on orders over $50
              </div>
            )}
            
            <div className="summary-divider"></div>
            
            <div className="summary-row total">
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
            
            <Button 
              variant="primary" 
              className="checkout-btn"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </Button>
            
            <Link to="/shop" className="continue-shopping">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
