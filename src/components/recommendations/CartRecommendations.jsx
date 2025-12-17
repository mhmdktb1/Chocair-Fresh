import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getCartRecommendations } from '../../services/recommendationService';
import { useCart } from '../../context/CartContext';
import '../../styles/CartRecommendations.css';

function CartRecommendations({ cartItems }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      setLoading(true);
      const productIds = cartItems.map(item => item._id || item.id);
      const recs = await getCartRecommendations(productIds, 6);
      setRecommendations(recs);
      setLoading(false);
    };

    fetchRecommendations();
  }, [cartItems]);

  const handleProductClick = (product) => {
    navigate(`/product/${product._id}`, { state: { product } });
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  if (loading) {
    return null;
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="cart-recommendations">
      <h3 className="cart-rec-title">
        <Plus size={20} />
        Complete Your Order
      </h3>
      <p className="cart-rec-subtitle">Customers also bought these items</p>

      <div className="cart-rec-grid">
        {recommendations.map((item) => (
          item.product && (
            <div
              key={item.product._id}
              className="cart-rec-card"
              onClick={() => handleProductClick(item.product)}
            >
              <div className="cart-rec-image">
                <img
                  src={item.product.image || '/assets/images/placeholder.jpg'}
                  alt={item.product.name}
                  onError={(e) => {
                    e.target.src = '/assets/images/placeholder.jpg';
                  }}
                />
              </div>
              <div className="cart-rec-info">
                <h4>{item.product.name}</h4>
                <span className="cart-rec-price">${item.product.price?.toFixed(2)}</span>
                <button
                  className="cart-rec-add"
                  onClick={(e) => handleAddToCart(e, item.product)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

export default CartRecommendations;
