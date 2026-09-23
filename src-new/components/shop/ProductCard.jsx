import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Eye, Star, Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { formatCurrency } from '../../utils/formatters';
import { normalizeUnit } from '../../utils/unitHelper';
import { getAssetUrl } from '../../utils/api';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { cartItems = [], addToCart, updateQuantity, removeFromCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  // Helper to generate random rating for demo purposes if not provided
  const rating = product.rating || 4.5;
  const reviews = product.reviews || 12;

  const cartItem = cartItems.find(item => item._id === product._id);
  const isFav = isFavorite(product._id);

  return (
    <div className="product-card group">
      {/* Image Container */}
      <div className="product-image-wrapper">
        <div className="product-badges">
          {product.isNew && <span className="badge badge-hot">New</span>}
          {product.discount > 0 && <span className="badge badge-sale">-{product.discount}%</span>}
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
            src={getAssetUrl(product.image) || '/assets/images/products/placeholder.jpg'} 
            alt={product.name} 
            className="product-image" 
            loading="lazy" 
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
                  if (cartItem.quantity <= 1) {
                    removeFromCart(product._id);
                  } else {
                    updateQuantity(product._id, cartItem.quantity - 1);
                  }
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
                  updateQuantity(product._id, cartItem.quantity + 1);
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
                addToCart({ ...product, unit: normalizeUnit(product.unit) });
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
        <div className="product-rating">
          <Star size={12} className="star-icon filled" />
          <span className="rating-value">{rating}</span>
          <span className="review-count">({reviews})</span>
        </div>
        
        <Link to={`/product/${product._id}`} state={{ product }} style={{ textDecoration: 'none' }}>
          <h3 className="product-name">{product.name}</h3>
        </Link>
        
        <div className="product-footer">
          <div className="price-wrapper">
            <span className="current-price">{formatCurrency(product.price)}</span>
            {product.oldPrice && (
              <span className="original-price">
                {formatCurrency(product.oldPrice)}
              </span>
            )}
          </div>
          <span className="unit-label">/ {normalizeUnit(product.unit)}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
