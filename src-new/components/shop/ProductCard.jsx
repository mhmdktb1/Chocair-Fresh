import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Eye, Star, Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { formatCurrency } from '../../utils/formatters';
import { normalizeUnit } from '../../utils/unitHelper';
import { getAssetUrl } from '../../utils/api';
import { getArabicProductName } from '../../utils/productTranslation';
import useLongPress from '../../hooks/useLongPress';
import ProductQuickPopup from './ProductQuickPopup';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { cartItems = [], addToCart, updateQuantity, removeFromCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const arabicName = product.nameAr || getArabicProductName(product);

  // Helper to generate random rating for demo purposes if not provided
  const rating = product.rating || 4.5;
  const reviews = product.reviews || 12;

  const cartItem = cartItems.find(item => item._id === product._id);
  const isFav = isFavorite(product._id);

  // Discount calculations
  const currentPrice = product.finalPrice !== undefined ? Number(product.finalPrice) : Number(product.price || 0);
  const originalPrice = product.originalPrice !== undefined ? Number(product.originalPrice) : (product.oldPrice !== undefined ? Number(product.oldPrice) : currentPrice);
  const isDiscounted = Boolean(product.isDiscounted || (originalPrice > currentPrice && currentPrice > 0));
  const discountPercent = product.discountPercent || (isDiscounted && originalPrice > 0 ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : (product.discount || 0));
  const unit = normalizeUnit(product.unit);
  const imageSrc = getAssetUrl(product.image) || '/assets/images/products/placeholder.jpg';

  const handleAddToCart = () => {
    addToCart({ 
      ...product, 
      price: currentPrice,
      originalPrice: originalPrice,
      isDiscounted: isDiscounted,
      discountPercent: discountPercent,
      unit 
    });
  };

  const handleDecrease = () => {
    if (!cartItem) return;
    if (cartItem.quantity <= 1) {
      removeFromCart(product._id);
    } else {
      updateQuantity(product._id, cartItem.quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (cartItem) updateQuantity(product._id, cartItem.quantity + 1);
  };

  // Mobile long-press opens a contextual quick-view; a normal tap still navigates.
  const [popupAnchor, setPopupAnchor] = useState(null);
  const closePopup = useCallback(() => setPopupAnchor(null), []);
  const longPressHandlers = useLongPress(setPopupAnchor);

  return (
    <div className="product-card group" {...longPressHandlers}>
      {/* Image Container */}
      <div className="product-image-wrapper">
        <div className="product-badges">
          {product.isNew && <span className="badge badge-hot">New</span>}
          {isDiscounted && discountPercent > 0 && <span className="badge badge-sale">-{discountPercent}%</span>}
        </div>

        {/* Wishlist / Favorite Button */}
        <button
          type="button"
          className={`wishlist-btn ${isFav ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product);
          }}
          title={isFav ? "Remove from favorites" : "Save to favorites"}
          aria-label={isFav ? "Remove from favorites" : "Save to favorites"}
        >
          <Heart size={18} fill={isFav ? '#e74c3c' : 'none'} color={isFav ? '#e74c3c' : 'currentColor'} />
        </button>

        <Link to={`/product/${product._id}`} state={{ product }}>
          <img 
            src={imageSrc} 
            alt={product.name} 
            className="product-image" 
            loading="lazy" 
            decoding="async"
            onError={(e) => { e.currentTarget.src = '/assets/images/products/placeholder.jpg'; }}
          />
        </Link>
        
        {/* Overlay Actions */}
        <div className="product-actions-overlay">
          <Link to={`/product/${product._id}`} state={{ product }} className="action-btn quick-view" title="Quick View">
            <Eye size={18} />
          </Link>
          
          {cartItem ? (
            <div className="product-card-stepper" onClick={(e) => e.stopPropagation()}>
              <button 
                type="button"
                className="card-stepper-btn minus"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDecrease();
                }}
                aria-label="Decrease quantity"
              >
                <Minus size={12} strokeWidth={2.5} />
              </button>
              <span className="card-stepper-qty">{cartItem.quantity}</span>
              <button 
                type="button"
                className="card-stepper-btn plus"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleIncrease();
                }}
                aria-label="Increase quantity"
              >
                <Plus size={12} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button 
              type="button"
              className="action-btn add-cart" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToCart();
              }}
              title="Add to Cart"
              aria-label={`Add ${product.name} to cart`}
            >
              <Plus size={16} strokeWidth={2.8} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="product-content">
        <div className="product-pricing-row">
          <span className="current-price">{formatCurrency(currentPrice)}</span>
          {isDiscounted && originalPrice > currentPrice && (
            <span className="original-price">
              {formatCurrency(originalPrice)}
            </span>
          )}
        </div>

        <Link to={`/product/${product._id}`} state={{ product }} className="product-name-link">
          <h3 className="product-name" title={`${product.name}${arabicName ? ` | ${arabicName}` : ''}`}>
            <span className="product-name-en">{product.name}</span>
            {arabicName && (
              <span className="product-name-ar" dir="rtl">{arabicName}</span>
            )}
          </h3>
        </Link>
        
        <div className="product-unit-row">
          <span className="product-unit-label">{unit}</span>
        </div>
      </div>

      {popupAnchor && (
        <ProductQuickPopup
          anchorEl={popupAnchor}
          onClose={closePopup}
          product={product}
          arabicName={arabicName}
          imageSrc={imageSrc}
          unit={unit}
          currentPrice={currentPrice}
          originalPrice={originalPrice}
          isDiscounted={isDiscounted}
          discountPercent={discountPercent}
          cartItem={cartItem}
          onAdd={handleAddToCart}
          onIncrease={handleIncrease}
          onDecrease={handleDecrease}
        />
      )}
    </div>
  );
};

export default ProductCard;
