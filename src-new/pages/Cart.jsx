import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft, 
  Sparkles, Truck, ShieldCheck, Clock, CheckCircle, LayoutGrid, List,
  Tag, Lock, MessageSquare, AlertCircle, Check
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import CartRecommendations from '../components/shop/CartRecommendations';
import { formatCurrency } from '../utils/formatters';
import './Cart.css';

const FREE_SHIPPING_THRESHOLD = 50;

const PROMO_CODES = {
  'FRESH10': { discountPercent: 10, description: '10% off your entire basket' },
  'FRESH15': { discountPercent: 15, description: '15% off fresh harvest' },
  'FREESHIP': { freeShipping: true, description: 'Free shipping on any order' }
};

const POPULAR_CATEGORIES = [
  { name: 'Fruits', icon: '🍎', slug: 'fruits' },
  { name: 'Vegetables', icon: '🥦', slug: 'vegetables' },
  { name: 'Herbs & Greens', icon: '🌿', slug: 'herbs' },
  { name: 'Dairy & Eggs', icon: '🧀', slug: 'dairy' },
];

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();
  
  // UI States
  const [viewMode, setViewMode] = useState('list'); // 'list' is default for clean shopping cart
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Calculations
  const isFreeShippingByThreshold = cartTotal >= FREE_SHIPPING_THRESHOLD;
  const isFreeShippingByPromo = appliedPromo?.code === 'FREESHIP';
  const isShippingFree = isFreeShippingByThreshold || isFreeShippingByPromo;
  
  const rawShippingCost = isShippingFree ? 0 : 5.99;
  
  let promoDiscount = 0;
  if (appliedPromo && appliedPromo.discountPercent) {
    promoDiscount = (cartTotal * appliedPromo.discountPercent) / 100;
  }
  
  const finalTotal = Math.max(0, cartTotal - promoDiscount + rawShippingCost);
  const freeShippingProgress = Math.min(100, Math.round((cartTotal / FREE_SHIPPING_THRESHOLD) * 100));
  const amountNeeded = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal).toFixed(2);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError('');
    const cleanCode = promoInput.trim().toUpperCase();
    
    if (!cleanCode) {
      setPromoError('Please enter a coupon code.');
      return;
    }

    if (PROMO_CODES[cleanCode]) {
      setAppliedPromo({ code: cleanCode, ...PROMO_CODES[cleanCode] });
      setPromoInput('');
    } else {
      setPromoError('Invalid coupon code. Try FRESH10 for 10% off.');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError('');
  };

  const handleClearCart = () => {
    if (confirmClear) {
      clearCart();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-desktop-nav">
          <Navbar />
        </div>

        {/* Mobile Header */}
        <header className="cart-mobile-header">
          <button 
            type="button" 
            className="cart-mobile-back-btn" 
            onClick={() => navigate('/shop')}
            aria-label="Back to shop"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="cart-mobile-title-wrap">
            <h1 className="cart-mobile-title">Shopping Basket</h1>
            <span className="cart-mobile-count">0 items</span>
          </div>
          <div style={{ width: 36 }} />
        </header>

        <div className="container cart-empty-container">
          <div className="empty-cart-card">
            <div className="empty-cart-icon-wrapper">
              <ShoppingBag size={56} className="empty-bag-icon" />
              <span className="empty-icon-sparkle">✨</span>
            </div>
            
            <h2 className="empty-title">Your Basket is Empty</h2>
            <p className="empty-subtitle">
              Looks like you haven't added any fresh fruits, vegetables, or artisan farm goods yet.
            </p>

            <div className="empty-category-shortcuts">
              <span className="shortcuts-label">Explore popular categories:</span>
              <div className="shortcut-chips">
                {POPULAR_CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    className="shortcut-chip"
                    onClick={() => navigate(`/shop?category=${cat.slug}`)}
                  >
                    <span className="chip-emoji">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button 
              variant="primary" 
              size="large"
              className="empty-start-btn"
              onClick={() => navigate('/shop')}
            >
              Start Fresh Shopping <ArrowRight size={18} style={{ marginLeft: 8 }} />
            </Button>
          </div>
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
          <h1 className="cart-mobile-title">Shopping Basket</h1>
          <span className="cart-mobile-count">{cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
        </div>
        <button 
          type="button" 
          className={`cart-mobile-clear-btn ${confirmClear ? 'confirm-active' : ''}`}
          onClick={handleClearCart}
          title="Clear Basket"
        >
          {confirmClear ? 'Confirm?' : 'Clear'}
        </button>
      </header>

      {/* Desktop Header Banner */}
      <div className="cart-header desktop-only">
        <div className="container">
          <div className="cart-breadcrumb">
            <Link to="/" className="breadcrumb-link">Home</Link>
            <span className="breadcrumb-sep">/</span>
            <Link to="/shop" className="breadcrumb-link">Shop</Link>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-active">Shopping Basket</span>
          </div>
          
          <div className="cart-header-row">
            <div>
              <h1 className="cart-title">
                Your Fresh Basket 
                <span className="cart-title-badge">{cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
              </h1>
              <p className="cart-subtitle">Review your harvest, adjust quantities, and checkout smoothly.</p>
            </div>
            
            <button 
              type="button"
              className={`clear-cart-link ${confirmClear ? 'confirm-active' : ''}`} 
              onClick={handleClearCart}
            >
              <Trash2 size={16} /> 
              {confirmClear ? 'Click again to confirm' : 'Clear Basket'}
            </button>
          </div>
        </div>
      </div>

      <div className="container cart-container">
        {/* Free Shipping Progress Meter */}
        <div className="shipping-progress-card">
          <div className="shipping-progress-info">
            <div className="shipping-icon-wrap">
              <Truck size={20} className="shipping-truck-icon" />
            </div>
            <div className="shipping-text">
              {isShippingFree ? (
                <span className="shipping-unlocked">
                  <CheckCircle size={16} color="#16a34a" /> 
                  <strong>Free Standard Delivery Unlocked!</strong>
                </span>
              ) : (
                <span>
                  Add <strong>${amountNeeded}</strong> more for <strong>FREE Delivery</strong> ($50 threshold)
                </span>
              )}
            </div>
            <span className="shipping-percent">
              {isShippingFree ? '100%' : `${freeShippingProgress}%`}
            </span>
          </div>
          <div className="shipping-meter-track">
            <div 
              className={`shipping-meter-fill ${isShippingFree ? 'complete' : ''}`}
              style={{ width: `${isShippingFree ? 100 : freeShippingProgress}%` }}
            />
          </div>
        </div>

        <div className="cart-main-layout">
          {/* Left Column: Items Section */}
          <div className="cart-products-section">
            
            {/* View Mode Bar & Header */}
            <div className="cart-section-bar">
              <div className="section-title-wrap">
                <h2 className="section-heading">Basket Items</h2>
                <span className="section-item-counter">{cartItems.length} unique items</span>
              </div>

              <div className="view-toggle-btns">
                <button 
                  type="button"
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                  aria-label="List View"
                >
                  <List size={16} />
                  <span className="view-label">List</span>
                </button>
                <button 
                  type="button"
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <LayoutGrid size={16} />
                  <span className="view-label">Grid</span>
                </button>
              </div>
            </div>

            {/* View Mode: Modern List View */}
            {viewMode === 'list' ? (
              <div className="cart-modern-list">
                {cartItems.map((item) => (
                  <div key={item._id} className="cart-modern-item">
                    <Link to={`/product/${item._id}`} className="modern-item-image-wrap">
                      <img 
                        src={item.image || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&auto=format&fit=crop&q=80'} 
                        alt={item.name} 
                        className="modern-item-img" 
                      />
                    </Link>

                    <div className="modern-item-main">
                      <div className="modern-item-meta">
                        {item.category && (
                          <span className="modern-item-category">{item.category}</span>
                        )}
                        <span className="fresh-pick-pill">🌱 Fresh Harvest</span>
                      </div>
                      
                      <Link to={`/product/${item._id}`} className="modern-item-title">
                        {item.name}
                      </Link>

                      <div className="modern-item-pricing-hint">
                        <span className="unit-price-tag">{formatCurrency(item.price)}</span>
                        {item.unit && <span className="unit-label">/ {item.unit}</span>}
                      </div>
                    </div>

                    <div className="modern-item-controls">
                      {/* Quantity Stepper */}
                      <div className="clean-qty-stepper">
                        <button 
                          type="button"
                          className="stepper-action-btn minus"
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="stepper-number">{item.quantity}</span>
                        <button 
                          type="button"
                          className="stepper-action-btn plus"
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="modern-item-subtotal">
                        <span className="subtotal-val">{formatCurrency(item.price * item.quantity)}</span>
                      </div>

                      {/* Remove Button */}
                      <button 
                        type="button"
                        className="modern-item-delete-btn"
                        onClick={() => removeFromCart(item._id)}
                        aria-label={`Remove ${item.name}`}
                        title="Remove Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* View Mode: Modern Grid View */
              <div className="cart-modern-grid">
                {cartItems.map((item) => (
                  <div key={item._id} className="grid-produce-card">
                    <button 
                      type="button"
                      className="grid-remove-btn"
                      onClick={() => removeFromCart(item._id)}
                      aria-label="Remove item"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                    
                    <Link to={`/product/${item._id}`} className="grid-image-box">
                      <img 
                        src={item.image || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&auto=format&fit=crop&q=80'} 
                        alt={item.name} 
                        className="grid-item-img" 
                      />
                    </Link>

                    <div className="grid-card-info">
                      <span className="grid-category">{item.category || 'Produce'}</span>
                      <Link to={`/product/${item._id}`} className="grid-title">
                        {item.name}
                      </Link>
                      <span className="grid-unit-price">
                        {formatCurrency(item.price)} {item.unit ? `/ ${item.unit}` : ''}
                      </span>
                    </div>

                    <div className="grid-bottom-row">
                      <div className="clean-qty-stepper compact">
                        <button 
                          type="button"
                          className="stepper-action-btn minus"
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="stepper-number">{item.quantity}</span>
                        <button 
                          type="button"
                          className="stepper-action-btn plus"
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <span className="grid-item-total">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Additional Order Notes & Coupon for Mobile / Items area */}
            <div className="cart-extra-options">
              {/* Special Delivery Note Toggle */}
              <div className="order-note-wrapper">
                <button 
                  type="button"
                  className="order-note-toggle-btn"
                  onClick={() => setShowNoteInput(!showNoteInput)}
                >
                  <MessageSquare size={16} />
                  <span>{showNoteInput ? 'Hide delivery instructions' : 'Add special delivery instructions'}</span>
                </button>
                
                {showNoteInput && (
                  <div className="order-note-input-wrap">
                    <textarea 
                      className="order-note-textarea"
                      placeholder="e.g. Please pick slightly green bananas, leave by front porch gate, call upon arrival..."
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      rows={3}
                    />
                    <span className="note-hint">Our harvest team will follow your packaging notes.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Add / Cart Recommendations */}
            <div className="cart-recommendations-box">
              <CartRecommendations limit={4} />
            </div>

            {/* Trust & Farm Guarantee Badges */}
            <div className="cart-trust-ribbon">
              <div className="trust-item">
                <div className="trust-icon-wrap">
                  <Sparkles size={20} className="trust-icon" />
                </div>
                <div>
                  <strong>100% Farm Fresh</strong>
                  <span>Handpicked organic produce</span>
                </div>
              </div>
              
              <div className="trust-item">
                <div className="trust-icon-wrap">
                  <Clock size={20} className="trust-icon" />
                </div>
                <div>
                  <strong>Express Delivery</strong>
                  <span>Temperature-controlled packaging</span>
                </div>
              </div>
              
              <div className="trust-item">
                <div className="trust-icon-wrap">
                  <ShieldCheck size={20} className="trust-icon" />
                </div>
                <div>
                  <strong>Quality Guaranteed</strong>
                  <span>Instant replacement or refund</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary (Desktop Sticky Sidebar) */}
          <aside className="cart-summary-sidebar">
            <div className="cart-summary-card">
              <h2 className="summary-title">Order Summary</h2>

              {/* Promo Code Box */}
              <div className="summary-promo-section">
                {!appliedPromo ? (
                  <form onSubmit={handleApplyPromo} className="promo-form">
                    <div className="promo-input-group">
                      <Tag size={16} className="promo-tag-icon" />
                      <input 
                        type="text" 
                        className="promo-input"
                        placeholder="Discount code (e.g. FRESH10)"
                        value={promoInput}
                        onChange={(e) => {
                          setPromoInput(e.target.value);
                          setPromoError('');
                        }}
                      />
                      <button type="submit" className="promo-apply-btn">
                        Apply
                      </button>
                    </div>
                    {promoError && (
                      <p className="promo-error-msg">
                        <AlertCircle size={13} /> {promoError}
                      </p>
                    )}
                  </form>
                ) : (
                  <div className="promo-applied-badge">
                    <div className="applied-info">
                      <Check size={14} className="applied-check" />
                      <div>
                        <strong>{appliedPromo.code}</strong>
                        <span>{appliedPromo.description}</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="promo-remove-btn"
                      onClick={handleRemovePromo}
                      aria-label="Remove coupon"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              
              <div className="summary-rows-group">
                <div className="summary-row">
                  <span>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
                  <span className="row-amount">{formatCurrency(cartTotal)}</span>
                </div>

                {appliedPromo && promoDiscount > 0 && (
                  <div className="summary-row promo-discount-row">
                    <span>Discount ({appliedPromo.code})</span>
                    <span className="row-amount discount-amount">-{formatCurrency(promoDiscount)}</span>
                  </div>
                )}
                
                <div className="summary-row">
                  <span>Standard Delivery</span>
                  <span className="row-amount">
                    {isShippingFree ? (
                      <span className="free-shipping-tag">FREE</span>
                    ) : (
                      formatCurrency(rawShippingCost)
                    )}
                  </span>
                </div>

                <div className="summary-row eco-fee-row">
                  <span>Eco-Packaging & Taxes</span>
                  <span className="row-amount free-tax-tag">Included</span>
                </div>
              </div>

              <div className="summary-divider" />
              
              <div className="summary-row total-row">
                <div className="total-label-wrap">
                  <span className="total-label">Total Amount</span>
                  <span className="vat-hint">Includes all taxes</span>
                </div>
                <span className="total-amount-val">{formatCurrency(finalTotal)}</span>
              </div>

              <Button 
                variant="primary" 
                className="checkout-btn-main"
                onClick={() => navigate('/checkout')}
              >
                <Lock size={16} style={{ marginRight: 6 }} />
                Proceed to Checkout
                <ArrowRight size={18} style={{ marginLeft: 8 }} />
              </Button>
              
              <Link to="/shop" className="continue-link">
                ← Continue Shopping
              </Link>

              {/* Delivery Guarantee hint */}
              <div className="delivery-speed-card">
                <span className="delivery-speed-icon">⚡</span>
                <p><strong>Fast Dispatch:</strong> Orders placed now are freshly packed and arrive today within 2–3 hours.</p>
              </div>

              {/* Accepted Payment Icons */}
              <div className="accepted-payments-wrap">
                <span className="payments-label">Guaranteed Safe & Secure Checkout</span>
                <div className="payment-badges">
                  <span className="payment-pill">💵 Cash on Delivery</span>
                  <span className="payment-pill">💳 Credit / Debit Card</span>
                  <span className="payment-pill">📱 Whish Money</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Sticky Checkout Dock */}
      <div className="mobile-cart-checkout-bar">
        <div className="mobile-checkout-total-info">
          <span className="mobile-total-label">Total ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
          <span className="mobile-total-amount">{formatCurrency(finalTotal)}</span>
          {isShippingFree && <span className="mobile-free-badge">Free Delivery</span>}
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
