import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ShoppingCart } from 'lucide-react';
import { getTrendingProducts } from '../../services/recommendationService';
import { useCart } from '../../context/CartContext';
import '../../styles/TrendingProducts.css';

function TrendingProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      const trendingProducts = await getTrendingProducts(8);
      setProducts(trendingProducts);
      setLoading(false);
    };

    fetchTrending();
  }, []);

  const handleProductClick = (product) => {
    navigate(`/product/${product._id}`, { state: { product } });
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  if (loading) {
    return (
      <section className="trending-section">
        <div className="container">
          <div className="section-header">
            <TrendingUp className="section-icon" />
            <h2 className="section-title">
              Trending <span>Now</span>
            </h2>
          </div>
          <div className="loading-spinner">Loading trending products...</div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="trending-section">
      <div className="container">
        <div className="section-header">
          <TrendingUp className="section-icon" />
          <h2 className="section-title">
            Trending <span>Now</span>
          </h2>
          <p className="section-subtitle">
            Most popular products loved by our customers
          </p>
        </div>

        <div className="trending-grid">
          {products.map((item) => (
            item.product && (
              <div
                key={item.product._id}
                className="trending-card"
                onClick={() => handleProductClick(item.product)}
              >
                <div className="trending-image">
                  <img
                    src={item.product.image || '/assets/images/placeholder.jpg'}
                    alt={item.product.name}
                    onError={(e) => {
                      e.target.src = '/assets/images/placeholder.jpg';
                    }}
                  />
                  <div className="trending-badge">
                    <TrendingUp size={14} />
                    Hot
                  </div>
                </div>
                <div className="trending-info">
                  <h3 className="trending-name">{item.product.name}</h3>
                  <p className="trending-brand">{item.product.brand || ''}</p>
                  <div className="trending-footer">
                    <div className="trending-price">
                      <span className="price-amount">${item.product.price?.toFixed(2)}</span>
                      {item.product.unit && (
                        <span className="price-unit">/ {item.product.unit}</span>
                      )}
                    </div>
                    <button
                      className="trending-cart-btn"
                      onClick={(e) => handleAddToCart(e, item.product)}
                      aria-label="Add to cart"
                    >
                      <ShoppingCart size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>

        <div className="trending-cta">
          <button
            className="view-all-btn"
            onClick={() => navigate('/products')}
          >
            View All Products
          </button>
        </div>
      </div>
    </section>
  );
}

export default TrendingProducts;
