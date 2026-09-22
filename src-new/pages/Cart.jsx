import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft, 
  Truck, CheckCircle, Tag, Lock, MessageSquare, AlertCircle, Check,
  Search, Sparkles, Heart, Zap, ShieldCheck, Leaf, Copy, ChevronRight, Flame
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../hooks/useProducts';
import { useFavorites } from '../context/FavoritesContext';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import ProductCard from '../components/shop/ProductCard';
import CartRecommendations from '../components/shop/CartRecommendations';
import { formatCurrency } from '../utils/formatters';
import { toast } from 'react-toastify';
import './Cart.css';

const FREE_SHIPPING_THRESHOLD = 50;

const PROMO_CODES = {
  'FRESH10': { discountPercent: 10, description: '10% off your entire basket' },
  'FRESH15': { discountPercent: 15, description: '15% off fresh harvest' },
  'FREESHIP': { freeShipping: true, description: 'Free shipping on any order' }
};

const POPULAR_CATEGORIES = [
  { name: 'Fruits', icon: '🍎', slug: 'Fruits', countText: 'Apples, Berries, Citrus' },
  { name: 'Vegetables', icon: '🥦', slug: 'Vegetables', countText: 'Crisp Greens, Roots' },
  { name: 'Herbs & Greens', icon: '🌿', slug: 'Herbs', countText: 'Mint, Basil, Rosemary' },
  { name: 'Dairy & Eggs', icon: '🧀', slug: 'Dairy', countText: 'Farm Milk & Cheeses' },
  { name: 'Bakery', icon: '🥐', slug: 'Bakery', countText: 'Artisan Breads' },
  { name: 'Pantry', icon: '🍯', slug: 'Pantry', countText: 'Raw Honey & Olive Oils' },
];

const Cart = () => {
  const { cartItems, updateQuantity, updateItemInstruction, removeFromCart, clearCart, cartTotal, cartCount } = useCart();
  const { products, loading: productsLoading } = useProducts();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  
  // UI States
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

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

  const handleCopyCode = (code = 'FRESH10') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(true);
    toast.success(`Coupon code ${code} copied!`);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  if (cartItems.length === 0) {
    const popularProducts = (products || []).slice(0, 6);

    return (
      <div className="cart-page empty-cart-view">
        {/* Desktop Navigation */}
        <div className="cart-desktop-nav">
          <Navbar />
        </div>

        {/* Mobile Header */}
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
            <span className="cart-mobile-count empty-count-badge">0 items</span>
          </div>
          <button 
            type="button" 
            className="cart-mobile-search-btn"
            onClick={() => navigate('/shop?focus=search')}
            aria-label="Search produce"
          >
            <Search size={18} />
          </button>
        </header>

        <div className="container cart-empty-container">
          <div className="empty-cart-card">
            
            {/* Top Organic Badge */}
            <div className="empty-fresh-pill">
              <Leaf size={14} className="empty-leaf-icon" />
              <span>100% Farm Fresh & Organic</span>
            </div>

            {/* Glowing Mascot / Basket Animation */}
            <div className="empty-cart-icon-wrapper">
              <div className="empty-glow-circle" />
              <div className="empty-mascot-cluster">
                <img 
                  src="/assets/images/mascots/avocado.svg" 
                  alt="Avocado mascot" 
                  className="empty-floating-mascot mascot-left" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="empty-bag-circle">
                  <ShoppingBag size={46} className="empty-bag-icon" />
                </div>
                <img 
                  src="/assets/images/mascots/apple.svg" 
                  alt="Apple mascot" 
                  className="empty-floating-mascot mascot-right"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <span className="empty-icon-sparkle">✨</span>
            </div>
            
            <h2 className="empty-title">Your Basket is Empty</h2>
            <p className="empty-subtitle">
              Looks like you haven't picked your fresh harvest yet. Discover fresh orchard fruits, crisp farm vegetables, and organic goods!
            </p>

            {/* Primary & Secondary Call to Action */}
            <div className="empty-cta-group">
              <Button 
                variant="primary" 
                size="large"
                className="empty-start-btn"
                onClick={() => navigate('/shop')}
              >
                <span>Start Fresh Shopping</span>
                <ArrowRight size={18} />
              </Button>
              <button 
                type="button"
                className="empty-browse-btn"
                onClick={() => navigate('/shop?focus=search')}
              >
                <Search size={16} />
                <span>Search Products</span>
              </button>
            </div>

            {/* Welcome Promo Voucher Banner */}
            <div className="empty-promo-voucher" onClick={() => handleCopyCode('FRESH10')}>
              <div className="voucher-left">
                <div className="voucher-icon-box">
                  <Tag size={18} />
                </div>
                <div className="voucher-texts">
                  <span className="voucher-tagline">First Order Welcome Gift</span>
                  <div className="voucher-code-row">
                    <span className="voucher-code">FRESH10</span>
                    <span className="voucher-desc">10% Off All Produce</span>
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                className={`voucher-copy-btn ${copiedCode ? 'copied' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyCode('FRESH10');
                }}
              >
                {copiedCode ? (
                  <>
                    <Check size={14} />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Saved Wishlist Items Reminder (if any) */}
            {favorites && favorites.length > 0 && (
              <div className="empty-wishlist-card" onClick={() => navigate('/shop')}>
                <div className="wishlist-reminder-left">
                  <div className="wishlist-icon-wrap">
                    <Heart size={16} fill="#ef4444" color="#ef4444" />
                  </div>
                  <div className="wishlist-reminder-text">
                    <strong>You have {favorites.length} saved {favorites.length === 1 ? 'item' : 'items'}</strong>
                    <span>Jump in and add your favorites to basket</span>
                  </div>
                </div>
                <ChevronRight size={18} className="wishlist-arrow" />
              </div>
            )}

            {/* Interactive Category Chips */}
            <div className="empty-category-shortcuts">
              <div className="shortcuts-header-row">
                <span className="shortcuts-label">Explore by Category</span>
                <Link to="/shop" className="shortcuts-view-all">View All →</Link>
              </div>
              <div className="shortcut-chips-scroll">
                {POPULAR_CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    className="shortcut-chip-card"
                    onClick={() => navigate(`/shop?category=${cat.slug}`)}
                  >
                    <div className="chip-emoji-box">
                      <span className="chip-emoji">{cat.icon}</span>
                    </div>
                    <div className="chip-meta">
                      <span className="chip-name">{cat.name}</span>
                      <span className="chip-sub">{cat.countText}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Farm Picks Carousel */}
            {popularProducts.length > 0 && (
              <div className="empty-trending-section">
                <div className="trending-section-header">
                  <div className="trending-title-wrap">
                    <div className="trending-icon-badge">
                      <Flame size={16} />
                    </div>
                    <div className="trending-texts">
                      <h3 className="trending-title">Trending Farm Harvests</h3>
                      <span className="trending-subtitle">Frequently enjoyed by our community</span>
                    </div>
                  </div>
                  <Link to="/shop" className="trending-see-all">See All</Link>
                </div>

                <div className="empty-products-track">
                  {popularProducts.map((prod) => (
                    <div key={prod._id || prod.id} className="empty-prod-card-wrap">
                      <ProductCard product={prod} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile Perks / Trust Grid */}
            <div className="empty-perks-grid">
              <div className="empty-perk-card">
                <div className="perk-icon-wrap express">
                  <Zap size={18} />
                </div>
                <div className="perk-text-wrap">
                  <strong>45-Min Express</strong>
                  <span>Fast doorstep dispatch</span>
                </div>
              </div>

              <div className="empty-perk-card">
                <div className="perk-icon-wrap organic">
                  <Leaf size={18} />
                </div>
                <div className="perk-text-wrap">
                  <strong>Daily Harvest</strong>
                  <span>Picked fresh each morning</span>
                </div>
              </div>

              <div className="empty-perk-card">
                <div className="perk-icon-wrap shipping">
                  <Truck size={18} />
                </div>
                <div className="perk-text-wrap">
                  <strong>Free Delivery $50+</strong>
                  <span>Zero shipping fee on large orders</span>
                </div>
              </div>

              <div className="empty-perk-card">
                <div className="perk-icon-wrap trust">
                  <ShieldCheck size={18} />
                </div>
                <div className="perk-text-wrap">
                  <strong>100% Guarantee</strong>
                  <span>Satisfaction or refund</span>
                </div>
              </div>
            </div>

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
              <Truck size={18} className="shipping-truck-icon" />
            </div>
            <div className="shipping-text">
              {isShippingFree ? (
                <span className="shipping-unlocked">
                  <CheckCircle size={15} color="#16a34a" /> 
                  <strong>Free Delivery Unlocked!</strong>
                </span>
              ) : (
                <span>
                  Add <strong>${amountNeeded}</strong> more for <strong>FREE Delivery</strong>
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
            
            {/* Header */}
            <div className="cart-section-bar">
              <div className="section-title-wrap">
                <h2 className="section-heading">Basket Items</h2>
                <span className="section-item-counter">({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
              </div>
            </div>

            {/* Streamlined Responsive Cart Items List */}
            <div className="cart-modern-list">
              {cartItems.map((item) => (
                <div key={item._id} className="cart-item-card">
                  {/* Left: Product Thumbnail */}
                  <Link to={`/product/${item._id}`} className="cart-item-thumb-link">
                    <img 
                      src={item.image || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&auto=format&fit=crop&q=80'} 
                      alt={item.name} 
                      className="cart-item-thumb-img" 
                    />
                  </Link>

                  {/* Right: Content & Controls */}
                  <div className="cart-item-body">
                    {/* Top Row: Title, Category & Remove */}
                    <div className="cart-item-header-row">
                      <div className="cart-item-title-col">
                        {item.category && (
                          <span className="cart-item-cat">{item.category}</span>
                        )}
                        <Link to={`/product/${item._id}`} className="cart-item-name">
                          {item.name}
                        </Link>
                        <span className="cart-item-unit-rate">
                          {formatCurrency(item.price)} {item.unit ? `/ ${item.unit}` : ''}
                        </span>
                        {item.instruction ? (
                          <div className="cart-item-instruction-box">
                            <MessageSquare size={12} className="cart-instruction-icon" />
                            <span className="cart-instruction-text">"{item.instruction}"</span>
                            <button
                              type="button"
                              className="cart-instruction-edit-btn"
                              onClick={() => {
                                const newNote = window.prompt(`Edit instructions for ${item.name}:`, item.instruction || '');
                                if (newNote !== null) {
                                  updateItemInstruction(item._id, newNote.trim());
                                }
                              }}
                              title="Edit instruction"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="cart-instruction-remove-btn"
                              onClick={() => updateItemInstruction(item._id, '')}
                              title="Remove instruction"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="cart-item-add-instruction-btn"
                            onClick={() => {
                              const newNote = window.prompt(`Special instructions for ${item.name} (e.g. extra ripe, green, sliced):`);
                              if (newNote !== null && newNote.trim()) {
                                updateItemInstruction(item._id, newNote.trim());
                              }
                            }}
                          >
                            <MessageSquare size={11} />
                            <span>Add note</span>
                          </button>
                        )}
                      </div>

                      <button 
                        type="button"
                        className="cart-item-remove-btn"
                        onClick={() => removeFromCart(item._id)}
                        aria-label={`Remove ${item.name}`}
                        title="Remove Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Bottom Row: Stepper & Subtotal */}
                    <div className="cart-item-footer-row">
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

                      <div className="cart-item-price-col">
                        <span className="cart-item-total-price">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add / Cart Recommendations */}
            <div className="cart-recommendations-box">
              <CartRecommendations limit={8} />
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
                  <span>Packaging & Taxes</span>
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

              {/* Fast Delivery Info */}
              <div className="delivery-speed-card">
                <span className="delivery-speed-icon">⚡</span>
                <p><strong>Fast Dispatch:</strong> Orders placed now arrive today within 2–3 hours.</p>
              </div>

              {/* Accepted Payments */}
              <div className="accepted-payments-wrap">
                <span className="payments-label">Guaranteed Safe & Secure Checkout</span>
                <div className="payment-badges">
                  <span className="payment-pill">💵 Cash on Delivery</span>
                  <span className="payment-pill">💳 Card</span>
                  <span className="payment-pill">📱 Whish</span>
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
