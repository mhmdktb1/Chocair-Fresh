import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, ArrowLeft, Star, Truck, ShieldCheck, Clock, Scale } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useCart } from '../context/CartContext';
import { get } from '../utils/api';
import Button from '../components/common/Button';
import WeightScale from '../components/shop/WeightScale';
import RecommendationRow from '../components/shop/RecommendationRow';
import './ProductDetails.css';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isScaleOpen, setIsScaleOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await get(`/products/${id}`);
        setProduct(data);
        // Set default quantity based on unit
        if (data.unit === 'kg' || data.unit === 'g') {
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
    
    // Round to avoid floating point errors
    newQty = Math.round(newQty * 100) / 100;

    const minQty = isWeightBased ? 0.5 : 1;
    
    if (newQty >= minQty && newQty <= (product?.countInStock || 100)) {
      setQuantity(newQty);
    }
  };

  const handleWeightConfirm = (weight) => {
    setQuantity(weight);
    setIsScaleOpen(false);
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      // Optional: Show success message or toast
      alert(`Added ${quantity} ${product.unit || 'items'} to cart!`);
    }
  };

  if (loading) {
    return (
      <div className="product-details-page">
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading deliciousness...</p>
        </div>
      </div>
    );
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

  return (
    <div className="product-details-page">
      <Navbar />
      
      <div className="container product-details-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>

        <div className="product-grid">
          {/* Product Images */}
          <div className="product-gallery">
            <div className="main-image">
              <img src={product.image} alt={product.name} />
            </div>
            {/* If we had multiple images, thumbnails would go here */}
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="product-header">
              <span className="product-category">{product.category}</span>
              <h1 className="product-title">{product.name}</h1>
              <div className="product-rating">
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={16} 
                      fill={star <= (product.rating || 5) ? "#ffc107" : "none"} 
                      color={star <= (product.rating || 5) ? "#ffc107" : "#ddd"} 
                    />
                  ))}
                </div>
                <span className="review-count">({product.numReviews || 0} reviews)</span>
              </div>
            </div>

            <div className="product-price-section">
              <span className="current-price">
                ${product.price}
                <span className="price-unit"> / {product.unit}</span>
              </span>
              {product.countInStock > 0 ? (
                <span className="stock-status in-stock">In Stock</span>
              ) : (
                <span className="stock-status out-of-stock">Out of Stock</span>
              )}
            </div>

            <p className="product-description">
              {product.description || 'No description available for this product.'}
            </p>

            <div className="product-features">
              <div className="feature-item">
                <Truck size={20} />
                <span>Fast Delivery</span>
              </div>
              <div className="feature-item">
                <ShieldCheck size={20} />
                <span>Quality Guarantee</span>
              </div>
              <div className="feature-item">
                <Clock size={20} />
                <span>Fresh Daily</span>
              </div>
            </div>

            <div className="product-actions">
              <div className="quantity-selector">
                <button 
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= (isWeightBased ? 0.5 : 1)}
                >
                  <Minus size={18} />
                </button>
                
                {isWeightBased ? (
                  <button 
                    className="weight-display-btn"
                    onClick={() => setIsScaleOpen(true)}
                    title="Click to open scale"
                  >
                    <Scale size={16} />
                    <span>{quantity.toFixed(2)} {product.unit}</span>
                  </button>
                ) : (
                  <span className="qty-display">{quantity}</span>
                )}

                <button 
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.countInStock}
                >
                  <Plus size={18} />
                </button>
              </div>

              <Button 
                className="add-to-cart-btn-large" 
                onClick={handleAddToCart}
                disabled={product.countInStock === 0}
              >
                <ShoppingBag size={20} style={{ marginRight: '8px' }} />
                {product.countInStock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        </div>
        
        {product && (
          <div style={{ marginTop: '4rem', borderTop: '1px solid #eee' }}>
            <RecommendationRow 
              title="Frequently Bought Together" 
              type="related" 
              productId={product._id} 
            />
          </div>
        )}
      </div>

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
