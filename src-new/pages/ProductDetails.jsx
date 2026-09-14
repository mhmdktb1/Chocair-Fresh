import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Minus, 
  Plus, 
  ShoppingBag, 
  ArrowLeft, 
  Star, 
  Scale, 
  Heart, 
  Share2, 
  Sparkles, 
  Leaf, 
  Check, 
  Maximize2, 
  X
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useCart } from '../context/CartContext';
import { useCategories } from '../hooks/useCategories';
import api from '../utils/api';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import WeightScale from '../components/shop/WeightScale';
import RecommendationRow from '../components/shop/RecommendationRow';
import { toast } from 'react-toastify';
import './ProductDetails.css';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { categories } = useCategories();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isScaleOpen, setIsScaleOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'storage'
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Check wishlist state from localStorage
  useEffect(() => {
    try {
      const savedWishlist = JSON.parse(localStorage.getItem('cf_wishlist') || '[]');
      setIsFavorite(savedWishlist.includes(id));
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/products/${id}`);
        const data = response.data;
        setProduct(data);
        
        // Save to last viewed history
        try {
          const history = JSON.parse(localStorage.getItem('viewHistory') || '[]');
          const newHistory = history.filter(item => item._id !== data._id);
          newHistory.unshift({ _id: data._id, name: data.name });
          localStorage.setItem('viewHistory', JSON.stringify(newHistory.slice(0, 10)));
        } catch (e) {
          console.error('Failed to save view history', e);
        }

        // Set default quantity based on unit
        if (data.unit === 'kg' || data.unit === 'g' || data.unit === '1kg') {
          setQuantity(1.0);
        } else {
          setQuantity(1);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const isWeightBased = ['kg', 'g', '1kg'].includes(product?.unit?.toLowerCase());

  const handleQuantityChange = (delta) => {
    const step = isWeightBased ? 0.5 : 1;
    let newQty = quantity + (delta * step);
    newQty = Math.round(newQty * 100) / 100;
    const minQty = isWeightBased ? 0.5 : 1;
    
    if (newQty >= minQty && newQty <= (product?.countInStock || 100)) {
      setQuantity(newQty);
    }
  };

  const setPresetQuantity = (qty) => {
    if (product && qty <= (product.countInStock || 100)) {
      setQuantity(qty);
    }
  };

  const handleWeightConfirm = (weight) => {
    setQuantity(weight);
    setIsScaleOpen(false);
  };

  const toggleWishlist = () => {
    try {
      const savedWishlist = JSON.parse(localStorage.getItem('cf_wishlist') || '[]');
      let updated;
      if (isFavorite) {
        updated = savedWishlist.filter(itemId => itemId !== product._id);
        toast.info('Removed from favorites');
      } else {
        updated = [...savedWishlist, product._id];
        toast.success('Saved to your favorites! ❤️');
      }
      localStorage.setItem('cf_wishlist', JSON.stringify(updated));
      setIsFavorite(!isFavorite);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out fresh ${product.name} at Chocair Fresh!`,
          url: window.location.href,
        });
      } catch (err) {
        // User dismissed
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Product link copied to clipboard! 📋');
      } catch (err) {
        toast.info('Link ready to share');
      }
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 800);
      toast.success(`Added ${quantity} ${product.unit || 'items'} to cart!`, {
        icon: '🛒'
      });
    }
  };

  if (loading) {
    return <Loading text="Loading fresh product details..." />;
  }

  if (error || !product) {
    return (
      <div className="product-details-page">
        <Navbar />
        <div className="error-container">
          <h2>Product not found</h2>
          <Button onClick={() => navigate('/shop')}>Back to Shop</Button>
        </div>
      </div>
    );
  }

  const categoryName = categories.find(c => c._id === product.category)?.name || product.category || 'Fresh Produce';
  const totalPrice = (product.price * quantity).toFixed(2);
  const weightPresets = [0.5, 1.0, 1.5, 2.0, 3.0, 5.0];
  const unitPresets = [1, 2, 3, 5, 10];

  return (
    <div className="product-details-page">
      <Navbar />

      <div className="container product-details-container">
        {/* Desktop Breadcrumb Navigation */}
        <div className="desktop-breadcrumb">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Back to Products
          </button>
          <div className="breadcrumb-path">
            <span onClick={() => navigate('/')}>Home</span>
            <span className="separator">/</span>
            <span onClick={() => navigate('/shop')}>Shop</span>
            <span className="separator">/</span>
            <span className="current">{product.name}</span>
          </div>
        </div>

        {/* Main Product Showcase Card */}
        <div className="product-showcase-card">
          {/* Gallery Section */}
          <div className="product-gallery-section">
            <div className="gallery-main-card">
              {/* Floating Top Nav / Badges over Image */}
              <div className="image-floating-top-left">
                <button 
                  className="image-float-back-btn" 
                  onClick={() => navigate(-1)} 
                  aria-label="Go Back"
                  title="Back"
                >
                  <ArrowLeft size={20} />
                </button>
                <span className="badge-freshness">
                  <Leaf size={14} /> 100% Fresh
                </span>
                {product.countInStock > 0 ? (
                  <span className={`badge-stock ${product.countInStock < 10 ? 'low-stock' : 'in-stock'}`}>
                    {product.countInStock < 10 ? `Only ${product.countInStock} Left` : 'In Stock'}
                  </span>
                ) : (
                  <span className="badge-stock out-of-stock">Sold Out</span>
                )}
              </div>

              {/* Floating Quick Action Icons on Top Right */}
              <div className="image-quick-actions">
                <button 
                  className={`image-action-circle-btn ${isFavorite ? 'favorite-active' : ''}`} 
                  onClick={toggleWishlist} 
                  aria-label="Wishlist"
                  title="Save to favorites"
                >
                  <Heart size={18} fill={isFavorite ? '#e74c3c' : 'none'} color={isFavorite ? '#e74c3c' : 'currentColor'} />
                </button>
                <button 
                  className="image-action-circle-btn" 
                  onClick={handleShare} 
                  aria-label="Share"
                  title="Share product"
                >
                  <Share2 size={18} />
                </button>
                {isWeightBased && (
                  <button 
                    className="image-action-btn scale-action" 
                    onClick={() => setIsScaleOpen(true)}
                    title="Interactive Weight Scale"
                    aria-label="Open Weight Scale"
                  >
                    <Scale size={18} />
                    <span>Scale</span>
                  </button>
                )}
                <button 
                  className="image-action-circle-btn" 
                  onClick={() => setIsLightboxOpen(true)}
                  title="Expand Fullscreen"
                  aria-label="Zoom Photo"
                >
                  <Maximize2 size={18} />
                </button>
              </div>

              {/* Product Hero Image */}
              <div className="product-hero-image-wrapper" onClick={() => setIsLightboxOpen(true)}>
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="product-hero-img"
                  loading="eager"
                />
              </div>
            </div>
          </div>

          {/* Product Info & Purchase Panel */}
          <div className="product-info-section">
            <div className="product-main-header">
              <div className="header-meta-row">
                <span className="product-category-tag">{categoryName}</span>
                <div className="desktop-share-actions">
                  <button 
                    className={`circle-icon-btn ${isFavorite ? 'active' : ''}`} 
                    onClick={toggleWishlist}
                    title={isFavorite ? "Remove favorite" : "Add to favorites"}
                  >
                    <Heart size={18} fill={isFavorite ? '#e74c3c' : 'none'} color={isFavorite ? '#e74c3c' : 'currentColor'} />
                  </button>
                  <button className="circle-icon-btn" onClick={handleShare} title="Share product">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>

              <h1 className="product-main-title">{product.name}</h1>

              <div className="rating-review-strip">
                <div className="rating-stars-pill">
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={14} 
                        fill={star <= (product.rating || 5) ? "#f59e0b" : "none"} 
                        color={star <= (product.rating || 5) ? "#f59e0b" : "#cbd5e1"} 
                      />
                    ))}
                  </div>
                  <span className="rating-score">{(product.rating || 5).toFixed(1)}</span>
                </div>
                <span className="review-count-badge">
                  {product.numReviews || 12} Reviews
                </span>
                <span className="origin-verified-badge">
                  <Sparkles size={13} /> Farm Picked
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="product-pricing-card">
              <div className="pricing-main-block">
                <div className="unit-price-display">
                  <span className="currency-symbol">$</span>
                  <span className="price-number">{product.price}</span>
                  <span className="price-unit-label">/ {product.unit}</span>
                </div>
                <div className="calculated-total-pill">
                  <span>Selected Total:</span>
                  <strong>${totalPrice}</strong>
                </div>
              </div>
            </div>

            {/* Quantity / Weight Selection Section */}
            <div className="purchase-controls-box">
              <div className="quantity-header-row">
                <span className="control-label">
                  {isWeightBased ? 'Select Weight / Quantity:' : 'Select Quantity:'}
                </span>
                {isWeightBased && (
                  <button 
                    className="scale-trigger-link"
                    onClick={() => setIsScaleOpen(true)}
                  >
                    <Scale size={14} /> Open Scale
                  </button>
                )}
              </div>

              {/* Preset Quick Chips */}
              <div className="preset-chips-scroll">
                {(isWeightBased ? weightPresets : unitPresets).map((preset) => {
                  const isSelected = quantity === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      className={`preset-chip ${isSelected ? 'active' : ''}`}
                      onClick={() => setPresetQuantity(preset)}
                    >
                      {preset} {isWeightBased ? product.unit : (preset === 1 ? 'item' : 'items')}
                    </button>
                  );
                })}
              </div>

              {/* Stepper + Big Add to Cart Row */}
              <div className="actions-control-row">
                <div className="modern-qty-stepper">
                  <button 
                    type="button"
                    className="stepper-btn minus"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= (isWeightBased ? 0.5 : 1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={18} />
                  </button>
                  
                  {isWeightBased ? (
                    <button 
                      type="button"
                      className="stepper-weight-val"
                      onClick={() => setIsScaleOpen(true)}
                      title="Tap to fine-tune weight"
                    >
                      <span className="val-text">{quantity.toFixed(2)}</span>
                      <span className="unit-text">{product.unit}</span>
                    </button>
                  ) : (
                    <span className="stepper-item-val">{quantity}</span>
                  )}

                  <button 
                    type="button"
                    className="stepper-btn plus"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= (product.countInStock || 100)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <button 
                  className={`modern-cart-btn ${addedAnimation ? 'cart-btn-bump' : ''}`}
                  onClick={handleAddToCart}
                  disabled={product.countInStock === 0}
                >
                  <ShoppingBag size={20} className="cart-btn-icon" />
                  <span className="cart-btn-text">
                    {product.countInStock === 0 ? 'Out of Stock' : `Add • $${totalPrice}`}
                  </span>
                </button>
              </div>
            </div>

            {/* Information Tabs */}
            <div className="product-details-tabs">
              <div className="tabs-header-bar">
                <button 
                  className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'storage' ? 'active' : ''}`}
                  onClick={() => setActiveTab('storage')}
                >
                  Storage & Freshness
                </button>
              </div>

              <div className="tab-content-panel">
                {activeTab === 'overview' && (
                  <div className="tab-pane fade-in">
                    <p className="product-description-text">
                      {product.description || `Handpicked fresh ${product.name} delivered straight from certified local farms. Rich in natural vitamins and flavor.`}
                    </p>
                    <div className="details-checklist">
                      <div className="check-item">
                        <Check size={16} className="check-icon" />
                        <span>Freshly harvested within the last 24 hours</span>
                      </div>
                      <div className="check-item">
                        <Check size={16} className="check-icon" />
                        <span>100% pesticide tested & verified organic standards</span>
                      </div>
                      <div className="check-item">
                        <Check size={16} className="check-icon" />
                        <span>Carefully hand-graded for peak ripeness & sweetness</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'storage' && (
                  <div className="tab-pane fade-in">
                    <div className="storage-guide-grid">
                      <div className="guide-box">
                        <strong>Optimal Storage</strong>
                        <span>Store in a cool, dry place or refrigerate between 4°C - 7°C for best flavor.</span>
                      </div>
                      <div className="guide-box">
                        <strong>Shelf Life</strong>
                        <span>Best consumed within 5-7 days from delivery for peak nutrient density.</span>
                      </div>
                      <div className="guide-box">
                        <strong>Preparation</strong>
                        <span>Rinse gently with cool water right before serving or cooking.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations Section */}
        {product && (
          <div className="product-recommendations-wrapper">
            <RecommendationRow 
              title="Frequently Bought Together" 
              type="related" 
              productId={product._id} 
            />
            <RecommendationRow 
              title="Similar Fresh Picks" 
              type="similar" 
              productId={product._id} 
            />
          </div>
        )}
      </div>

      {/* Modern Sticky Bottom Floating Bar for Mobile */}
      <div className="mobile-sticky-bottom-bar">
        <div className="sticky-bar-info">
          <div className="sticky-qty-chip">
            {quantity} {product.unit}
          </div>
          <div className="sticky-total-price">
            <span className="total-label">Total</span>
            <span className="total-val">${totalPrice}</span>
          </div>
        </div>

        <div className="sticky-bar-actions">
          <div className="sticky-stepper">
            <button 
              type="button" 
              onClick={() => handleQuantityChange(-1)} 
              disabled={quantity <= (isWeightBased ? 0.5 : 1)}
              aria-label="Decrease"
            >
              <Minus size={16} />
            </button>
            <button 
              type="button" 
              onClick={() => handleQuantityChange(1)} 
              disabled={quantity >= (product.countInStock || 100)}
              aria-label="Increase"
            >
              <Plus size={16} />
            </button>
          </div>

          <button 
            className={`sticky-add-cart-btn ${addedAnimation ? 'cart-btn-bump' : ''}`}
            onClick={handleAddToCart}
            disabled={product.countInStock === 0}
          >
            <ShoppingBag size={18} />
            <span>{product.countInStock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="product-lightbox-modal" onClick={() => setIsLightboxOpen(false)}>
          <button className="lightbox-close-btn" onClick={() => setIsLightboxOpen(false)} aria-label="Close">
            <X size={26} />
          </button>
          <div className="lightbox-img-wrapper" onClick={e => e.stopPropagation()}>
            <img src={product.image} alt={product.name} />
            <div className="lightbox-caption">{product.name}</div>
          </div>
        </div>
      )}

      {/* Weight Scale Modal */}
      {product && (
        <WeightScale 
          isOpen={isScaleOpen}
          onClose={() => setIsScaleOpen(false)}
          onConfirm={handleWeightConfirm}
          initialWeight={quantity}
          pricePerUnit={product.price}
          unit={product.unit}
        />
      )}
    </div>
  );
};

export default ProductDetails;
