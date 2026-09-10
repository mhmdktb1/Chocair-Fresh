import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft, 
  Sparkles, Truck, ShieldCheck, Clock, CheckCircle, LayoutGrid, List
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import VisualBasket from '../components/shop/VisualBasket';
import CartRecommendations from '../components/shop/CartRecommendations';
import { formatCurrency } from '../utils/formatters';
import './Cart.css';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (horizontal cards) or 'list'

  const FREE_SHIPPING_THRESHOLD = 50;
  const shippingCost = cartTotal >= FREE_SHIPPING_THRESHOLD ? 0 : 5.99;
  const finalTotal = cartTotal + shippingCost;
  const freeShippingProgress = Math.min(100, Math.round((cartTotal / FREE_SHIPPING_THRESHOLD) * 100));
  const amountNeeded = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal).toFixed(2);

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-desktop-nav">
          <Navbar />
        </div>
        <div className="container cart-empty-state">
          <div className="empty-cart-icon">
            <ShoppingBag size={64} />
          </div>
          <h2>Your Fresh Basket is Empty</h2>
          <p>Explore today's organic harvest and pick your favorite fruits and vegetables.</p>
          <Button variant="primary" onClick={() => navigate('/shop')}>
            Start Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {/* Desktop Navigation */}
      <div className="cart-desktop-nav">
        <Navbar />
      </div>

      {/* Mobile Streamlined Top Header */}
      <header className="cart-mobile-header">
        <button 
          type="button" 
          className="cart-mobile-back-btn" 
          onClick={() => navigate(-1)}
          aria-label="Go Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="cart-mobile-title-wrap">
          <h1 className="cart-mobile-title">Shopping Cart</h1>
          <span className="cart-mobile-count">{cartCount} items</span>
        </div>
        <button 
          type="button" 
          className="cart-mobile-clear-btn"
          onClick={clearCart}
          title="Clear Cart"
        >
          Clear
        </button>
      </header>

      {/* Desktop Header Banner */}
      <div className="cart-header desktop-only">
        <div className="container">
          <div className="cart-header-row">
            <div>
              <h1 className="cart-title">Your Fresh Harvest</h1>
              <p className="cart-subtitle">Review items, customize quantities, and checkout smoothly.</p>
            </div>
            <button className="clear-cart-link" onClick={clearCart}>
              <Trash2 size={16} /> Clear All
            </button>
          </div>
        </div>
      </div>

      <div className="container cart-container">
        {/* Dynamic Visual Harvest Basket */}
        <VisualBasket cartItems={cartItems} />

        {/* Free Shipping Progress Meter */}
        <div className="shipping-progress-card">
          <div className="shipping-progress-info">
            <div className="shipping-icon-wrap">
              <Truck size={20} className="shipping-truck-icon" />
            </div>
            <div className="shipping-text">
              {cartTotal >= FREE_SHIPPING_THRESHOLD ? (
                <span className="shipping-unlocked">
                  <CheckCircle size={15} color="#16a34a" /> <strong>Free Delivery Unlocked!</strong>
                </span>
              ) : (
                <span>
                  Add <strong>${amountNeeded}</strong> more for <strong>FREE Delivery</strong>
                </span>
              )}
            </div>
            <span className="shipping-percent">{freeShippingProgress}%</span>
          </div>
          <div className="shipping-meter-track">
            <div 
              className={`shipping-meter-fill ${freeShippingProgress >= 100 ? 'complete' : ''}`}
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        <div className="cart-main-layout">
          {/* Left Column: Items Section */}
          <div className="cart-products-section">
            
            {/* View Mode Bar */}
            <div className="cart-section-bar">
              <h2 className="section-heading">Basket Items ({cartItems.length})</h2>
              <div className="view-toggle-btns">
                <button 
                  type="button"
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Card View"
                  aria-label="Card View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button 
                  type="button"
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                  aria-label="List View"
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* View Mode: Horizontal Snap Cards */}
            {viewMode === 'grid' ? (
              <div className="cart-cards-horizontal-rail">
                {cartItems.map((item) => (
                  <div key={item._id} className="cart-produce-card">
                    <button 
                      className="card-remove-pill"
                      onClick={() => removeFromCart(item._id)}
                      aria-label="Remove item"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                    
                    <div className="card-image-box">
                      <img src={item.image} alt={item.name} className="card-img" />
                    </div>

                    <div className="card-info">
                      <span className="card-category">{item.category}</span>
                      <h3 className="card-title">{item.name}</h3>
                      <span className="card-unit-price">{formatCurrency(item.price)} {item.unit ? `/ ${item.unit}` : ''}</span>
                    </div>

                    <div className="card-bottom-row">
                      <div className="modern-qty-stepper">
                        <button 
                          className="stepper-btn"
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="stepper-value">{item.quantity}</span>
                        <button 
                          className="stepper-btn"
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <span className="card-item-total">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* View Mode: Compact List */
              <div className="cart-list-container">
                {cartItems.map((item) => (
                  <div key={item._id} className="cart-list-item">
                    <img src={item.image} alt={item.name} className="list-item-img" />
                    <div className="list-item-details">
                      <span className="list-item-cat">{item.category}</span>
                      <h4 className="list-item-name">{item.name}</h4>
                      <span className="list-item-unit-price">{formatCurrency(item.price)} {item.unit ? `/ ${item.unit}` : ''}</span>
                    </div>
                    
                    <div className="modern-qty-stepper list-stepper">
                      <button 
                        className="stepper-btn"
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="stepper-value">{item.quantity}</span>
                      <button 
                        className="stepper-btn"
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <div className="list-item-pricing">
                      <span className="list-item-total">{formatCurrency(item.price * item.quantity)}</span>
                      <button 
                        className="list-remove-btn"
                        onClick={() => removeFromCart(item._id)}
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Recommendations */}
            <div className="cart-recommendations-box">
              <CartRecommendations limit={4} />
            </div>

            {/* Trust & Guarantee Badges */}
            <div className="cart-trust-ribbon">
              <div className="trust-item">
                <Sparkles size={18} className="trust-icon" />
                <div>
                  <strong>100% Farm Fresh</strong>
                  <span>Hand-selected quality</span>
                </div>
              </div>
              <div className="trust-item">
                <Clock size={18} className="trust-icon" />
                <div>
                  <strong>Fast Same-Day</strong>
                  <span>Express temperature-packed</span>
                </div>
              </div>
              <div className="trust-item">
                <ShieldCheck size={18} className="trust-icon" />
                <div>
                  <strong>Satisfaction Guaranteed</strong>
                  <span>Easy returns & replacements</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary (Desktop Sticky Sidebar) */}
          <aside className="cart-summary-sidebar">
            <div className="cart-summary-card">
              <h2 className="summary-title">Order Summary</h2>
              
              <div className="summary-row">
                <span>Subtotal ({cartCount} items)</span>
                <span className="row-amount">{formatCurrency(cartTotal)}</span>
              </div>
              
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span className="row-amount">
                  {shippingCost === 0 ? (
                    <span className="free-shipping-tag">FREE</span>
                  ) : (
                    formatCurrency(shippingCost)
                  )}
                </span>
              </div>

              <div className="summary-divider" />
              
              <div className="summary-row total-row">
                <span>Total Amount</span>
                <span className="total-amount-val">{formatCurrency(finalTotal)}</span>
              </div>

              <Button 
                variant="primary" 
                className="checkout-btn-main"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout <ArrowRight size={18} style={{ marginLeft: '8px' }} />
              </Button>
              
              <Link to="/shop" className="continue-link">
                ← Continue Shopping
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Sticky Checkout Dock */}
      <div className="mobile-cart-checkout-bar">
        <div className="mobile-checkout-total-info">
          <span className="mobile-total-label">Total ({cartCount} items)</span>
          <span className="mobile-total-amount">{formatCurrency(finalTotal)}</span>
        </div>
        <Button 
          variant="primary" 
          className="mobile-checkout-action-btn"
          onClick={() => navigate('/checkout')}
        >
          Checkout <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
};

export default Cart;
