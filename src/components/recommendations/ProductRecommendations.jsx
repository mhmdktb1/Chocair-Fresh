import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingCart } from 'lucide-react';
import { getProductRecommendations } from '../../services/recommendationService';
import { useCart } from '../../context/CartContext';
import '../../styles/ProductRecommendations.css';

function ProductRecommendations({ productId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    if (!productId) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      const recs = await getProductRecommendations(productId, 4);
      setRecommendations(recs);
      setLoading(false);
    };

    fetchRecommendations();
  }, [productId]);

  const handleProductClick = (product) => {
    navigate(`/product/${product._id}`, { state: { product } });
    window.scrollTo(0, 0);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  if (loading) {
    return (
      <div className="product-recommendations">
        <div className="recommendations-header">
          <Sparkles className="rec-icon" />
          <h3>You Might Also Like</h3>
        </div>
        <div className="loading-text">Loading recommendations...</div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="product-recommendations">
      <div className="recommendations-header">
        <Sparkles className="rec-icon" />
        <h3>You Might Also Like</h3>
        <p>Products frequently bought together</p>
      </div>

      <div className="recommendations-grid">
        {recommendations.map((item) => (
          item.product && (
            <div
              key={item.product._id}
              className="rec-card"
              onClick={() => handleProductClick(item.product)}
            >
              <div className="rec-image">
                <img
                  src={item.product.image || '/assets/images/placeholder.jpg'}
                  alt={item.product.name}
                  onError={(e) => {
                    e.target.src = '/assets/images/placeholder.jpg';
                  }}
                />
              </div>
              <div className="rec-info">
                <h4>{item.product.name}</h4>
                <div className="rec-footer">
                  <span className="rec-price">${item.product.price?.toFixed(2)}</span>
                  <button
                    className="rec-add-btn"
                    onClick={(e) => handleAddToCart(e, item.product)}
                    aria-label="Add to cart"
                  >
                    <ShoppingCart size={16} />
                  </button>
                </div>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

export default ProductRecommendations;
