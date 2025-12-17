import React from 'react';
import { Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Button from '../common/Button';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img src={product.image} alt={product.name} className="product-image" />
        <button 
          className="quick-add-btn"
          onClick={() => addToCart(product)}
          aria-label="Add to cart"
        >
          <Plus size={20} />
        </button>
        {product.isNew && <span className="product-badge new">New</span>}
        {product.discount > 0 && <span className="product-badge discount">-{product.discount}%</span>}
      </div>
      
      <div className="product-info">
        <div className="product-category">{product.category}</div>
        <h3 className="product-title">{product.name}</h3>
        <div className="product-rating">
          {'★'.repeat(Math.floor(product.rating))}
          {'☆'.repeat(5 - Math.floor(product.rating))}
          <span className="rating-count">({product.reviews})</span>
        </div>
        
        <div className="product-footer">
          <div className="product-price">
            <span className="current-price">${product.price.toFixed(2)}</span>
            {product.oldPrice && <span className="old-price">${product.oldPrice.toFixed(2)}</span>}
          </div>
          <Button 
            variant="outline" 
            size="small" 
            className="add-btn"
            onClick={() => addToCart(product)}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
