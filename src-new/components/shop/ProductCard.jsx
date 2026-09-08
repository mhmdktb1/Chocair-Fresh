import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Eye, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { cartItems = [], addToCart, updateQuantity, removeFromCart } = useCart();

  // Helper to generate random rating for demo purposes if not provided
  const rating = product.rating || 4.5;
  const reviews = product.reviews || 12;

  const cartItem = cartItems.find(item => item._id === product._id);

  return (
    <div className="product-card group">
      {/* Image Container */}
      <div className="product-image-wrapper">
        <div className="product-badges">
          {product.isNew && <span className="badge badge-hot">New</span>}
          {product.discount > 0 && <span className="badge badge-sale">-{product.discount}%</span>}
        </div>

        <Link to={`/product/${product._id}`}>
          <img src={product.image} alt={product.name} className="product-image" loading="lazy" />
        </Link>
        
        {/* Overlay Actions */}
        <div className="product-actions-overlay">
          <Link to={`/product/${product._id}`} className="action-btn quick-view" title="Quick View">
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
                <Minus size={12} />
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
                <Plus size={12} />
              </button>
            </div>
          ) : (
            <button 
              type="button"
              className="action-btn add-cart" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(product);
              }}
              title="Add to Cart"
              aria-label={`Add ${product.name} to cart`}
            >
              <Plus size={16} />
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
        
        <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
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
          {product.unit && <span className="unit-label">/ {product.unit}</span>}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
