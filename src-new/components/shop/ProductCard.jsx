import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Eye, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  // Helper to generate random rating for demo purposes if not provided
  const rating = product.rating || 4.5;
  const reviews = product.reviews || 12;

  return (
    <div className="product-card group">
      {/* Image Container */}
      <div className="product-image-wrapper">
        <div className="product-badges">
          {product.isNew && <span className="badge badge-hot">New</span>}
          {product.discount > 0 && <span className="badge badge-sale">-{product.discount}%</span>}
        </div>
        
        <button className="wishlist-btn" aria-label="Add to wishlist">
          <Heart size={18} />
        </button>

        <Link to={`/product/${product._id}`}>
          <img src={product.image} alt={product.name} className="product-image" />
        </Link>
        
        {/* Overlay Actions */}
        <div className="product-actions-overlay">
          <Link to={`/product/${product._id}`} className="action-btn quick-view" title="Quick View">
            <Eye size={20} />
          </Link>
          <button 
            className="action-btn add-cart" 
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            title="Add to Cart"
          >
            <ShoppingBag size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="product-content">
        <div className="product-rating">
          <Star size={14} className="star-icon filled" />
          <span className="rating-value">{rating}</span>
          <span className="review-count">({reviews})</span>
        </div>
        
        <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
          <h3 className="product-name">{product.name}</h3>
        </Link>
        
        <div className="product-footer">
          <div className="price-wrapper">
            <span className="current-price">${product.price.toFixed(2)}</span>
            {product.oldPrice && (
              <span className="original-price">
                ${product.oldPrice.toFixed(2)}
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
