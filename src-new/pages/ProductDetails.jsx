import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Minus, 
  Plus, 
  X, 
  Heart, 
  Share2, 
  Scale, 
  Maximize2 
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useCart } from '../context/CartContext';
import { useCategories } from '../hooks/useCategories';
import api from '../utils/api';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import WeightScale from '../components/shop/WeightScale';
import TotersProductRow from '../components/shop/TotersProductRow';
import { toast } from 'react-toastify';
import './ProductDetails.css';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { categories } = useCategories();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isScaleOpen, setIsScaleOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [imageError, setImageError] = useState(false);
  const [isScrolledHeader, setIsScrolledHeader] = useState(false);

  // Check wishlist state from localStorage
  useEffect(() => {
    try {
      const savedWishlist = JSON.parse(localStorage.getItem('cf_wishlist') || '[]');
      setIsFavorite(savedWishlist.includes(id));
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  // Track scroll for top sticky header bar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledHeader(window.scrollY > 120);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setImageError(false);
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

        // Set default quantity or sync from cart if already added
        const inCart = cartItems.find(item => item._id === data._id);
        if (inCart) {
          setQuantity(inCart.quantity);
        } else if (data.unit === 'kg' || data.unit === 'g' || data.unit === '1kg') {
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
  const existingCartItem = cartItems.find(item => item._id === product?._id);

  const handleQuantityChange = (delta) => {
    const step = isWeightBased ? 0.5 : 1;
    let newQty = quantity + (delta * step);
    newQty = Math.round(newQty * 100) / 100;
    const minQty = isWeightBased ? 0.5 : 1;
    
    if (newQty >= minQty && newQty <= (product?.countInStock || 100)) {
      setQuantity(newQty);
      if (existingCartItem) {
        updateQuantity(product._id, newQty);
      }
    }
  };

  const setPresetQuantity = (qty) => {
    if (product && qty <= (product.countInStock || 100)) {
      setQuantity(qty);
      if (existingCartItem) {
        updateQuantity(product._id, qty);
      }
    }
  };

  const handleWeightConfirm = (weight) => {
    setQuantity(weight);
    if (existingCartItem) {
      updateQuantity(product._id, weight);
    }
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

  const handleAddToCartOrUpdate = () => {
    if (!product) return;
    if (!existingCartItem) {
      addToCart(product, quantity);
      toast.success(`Added ${quantity} ${product.unit || 'items'} to cart!`, { icon: '🛒' });
    } else {
      updateQuantity(product._id, quantity);
      toast.success(`Cart updated to ${quantity} ${product.unit || 'items'}!`, { icon: '✅' });
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

  // Formatting helpers for Toters display
  const totalPrice = (product.price * quantity).toFixed(2);
  const lbpPrice = Math.round(product.price * 89500).toLocaleString('en-US');
  const points = Math.round(product.price * 105);

  const formatUnitDisplay = (qty, unit) => {
    const isW = ['kg', 'g', '1kg'].includes(unit?.toLowerCase());
    if (isW) {
      if (qty >= 1) return `${Math.round(qty * 1000)} g`;
      return `${Math.round(qty * 1000)} g`;
    }
    return `${qty} ${unit || 'piece'}`;
  };

  const weightPresets = [0.5, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0];
  const unitPresets = [1, 2, 3, 5, 10];
  const displayImage = !imageError && product.image ? product.image : FALLBACK_IMAGE;

  return (
    <div className="product-details-page toters-mode">
      <Navbar />

      {/* Toters Sticky App Bar (Mobile & Desktop) */}
      <header className={`toters-app-header ${isScrolledHeader ? 'scrolled' : ''}`}>
        <button 
          className="toters-circle-icon-btn" 
          onClick={() => navigate(-1)} 
          aria-label="Close"
          title="Close"
        >
          <X size={20} />
        </button>

        <div className="toters-header-title">
          {isScrolledHeader ? product.name : ''}
        </div>

        <div className="toters-header-actions">
          <button 
            className="toters-circle-icon-btn" 
            onClick={handleShare} 
            aria-label="Share"
            title="Share"
          >
            <Share2 size={18} />
          </button>
          <button 
            className={`toters-circle-icon-btn ${isFavorite ? 'favorite-active' : ''}`} 
            onClick={toggleWishlist} 
            aria-label="Wishlist"
            title="Save to favorites"
          >
            <Heart size={18} fill={isFavorite ? '#e74c3c' : 'none'} color={isFavorite ? '#e74c3c' : 'currentColor'} />
          </button>
        </div>
      </header>

      {/* Main Toters Content Container */}
      <div className="toters-product-page-content">
        {/* Clean Hero Product Image Area */}
        <div className="toters-hero-image-area" onClick={() => setIsLightboxOpen(true)}>
          <img 
            src={displayImage} 
            alt={product.name} 
            className="toters-hero-img"
            loading="eager"
            onError={() => setImageError(true)}
          />
          <button 
            className="toters-zoom-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            title="Fullscreen Zoom"
          >
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Toters Product Details Sheet */}
        <div className="toters-info-sheet">
          <div className="toters-info-header">
            <h1 className="toters-product-name">{product.name}</h1>
            <div className="toters-unit-subtitle">
              {product.unit === 'kg' ? '500 g' : (product.unit || '500 g')}
            </div>

            <div className="toters-price-strip">
              <span className="toters-primary-price">${Number(product.price).toFixed(2)}</span>
              <span className="toters-lbp-price">LBP {lbpPrice}</span>
              <span className="toters-points-pill">
                <span className="gold-tag">Gold</span> {points} Pts
              </span>
            </div>
          </div>

          {/* Preset Weight / Quantity Chips */}
          <div className="toters-presets-section">
            <div className="toters-presets-label">
              <span>{isWeightBased ? 'Choose Weight:' : 'Choose Quantity:'}</span>
              {isWeightBased && (
                <button 
                  className="toters-scale-link"
                  onClick={() => setIsScaleOpen(true)}
                >
                  <Scale size={14} /> Digital Scale
                </button>
              )}
            </div>

            <div className="toters-chips-scroll">
              {(isWeightBased ? weightPresets : unitPresets).map((preset) => {
                const isSelected = quantity === preset;
                const label = isWeightBased 
                  ? (preset >= 1 ? `${preset * 1000} g` : `${preset * 1000} g`)
                  : `${preset} ${preset === 1 ? 'item' : 'items'}`;
                return (
                  <button
                    key={preset}
                    type="button"
                    className={`toters-preset-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => setPresetQuantity(preset)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toters Similar Items Row */}
          <TotersProductRow 
            title="Similar Items" 
            type="similar" 
            productId={product._id} 
            category={product.category}
          />

          {/* Toters People Also Bought Row */}
          <TotersProductRow 
            title="People Also Bought" 
            type="related" 
            productId={product._id} 
          />

          {/* Special Instructions Box */}
          <div className="toters-instructions-card">
            <label htmlFor="special-notes" className="toters-instructions-title">
              Any special instructions?
            </label>
            <textarea
              id="special-notes"
              className="toters-instructions-textarea"
              placeholder="Tell us here."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Toters Sticky Bottom Dock */}
      <div className="toters-sticky-bottom-bar">
        {/* Left Quantity / Weight Stepper */}
        <div className="toters-stepper-control">
          <button 
            type="button" 
            className="toters-step-btn minus"
            onClick={() => handleQuantityChange(-1)} 
            disabled={quantity <= (isWeightBased ? 0.5 : 1)}
            aria-label="Decrease"
          >
            <Minus size={20} />
          </button>

          <span 
            className="toters-step-value"
            onClick={() => isWeightBased && setIsScaleOpen(true)}
            title={isWeightBased ? "Tap to open scale" : ""}
          >
            {formatUnitDisplay(quantity, product.unit)}
          </span>

          <button 
            type="button" 
            className="toters-step-btn plus"
            onClick={() => handleQuantityChange(1)} 
            disabled={quantity >= (product.countInStock || 100)}
            aria-label="Increase"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Right Toters Vibrant Green Cart Button */}
        <button 
          className="toters-cart-action-btn"
          onClick={handleAddToCartOrUpdate}
          disabled={product.countInStock === 0}
        >
          <span className="btn-state-text">
            {product.countInStock === 0 ? 'Out of Stock' : (existingCartItem ? 'In Cart' : 'Add to Cart')}
          </span>
          <span className="btn-price-text">${totalPrice}</span>
        </button>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="product-lightbox-modal" onClick={() => setIsLightboxOpen(false)}>
          <button className="lightbox-close-btn" onClick={() => setIsLightboxOpen(false)} aria-label="Close">
            <X size={26} />
          </button>
          <div className="lightbox-img-wrapper" onClick={e => e.stopPropagation()}>
            <img src={displayImage} alt={product.name} />
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
