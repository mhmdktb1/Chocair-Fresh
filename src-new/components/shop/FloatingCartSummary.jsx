import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';
import { getAssetUrl } from '../../utils/api';
import './FloatingCartSummary.css';

const FloatingCartSummary = ({ productPage = false }) => {
  const { cartItems, cartCount, cartTotal } = useCart();
  const navigate = useNavigate();

  if (cartCount === 0) return null;

  return (
    <aside
      className={`floating-cart-summary-dock${productPage ? ' product-page-cart-dock' : ''}`}
      aria-label="Shopping Cart Summary"
    >
      <button
        type="button"
        className="floating-cart-summary-pill"
        onClick={() => navigate('/cart')}
        aria-label={`View cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}, total ${formatCurrency(cartTotal)}`}
      >
        <span className="floating-cart-summary-items">
          <span className="floating-cart-summary-thumbnails" aria-hidden="true">
            {cartItems.slice(0, 3).map((item, index) => (
              <span
                key={item._id || item.id || index}
                className="floating-cart-summary-thumbnail"
                style={{ zIndex: 10 - index }}
              >
                <img
                  src={getAssetUrl(item.image) || '/assets/images/products/placeholder.jpg'}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.src = '/assets/images/products/placeholder.jpg';
                  }}
                />
              </span>
            ))}
          </span>
          <span className="floating-cart-summary-info">
            <span className="floating-cart-summary-count">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </span>
            <span className="floating-cart-summary-total">{formatCurrency(cartTotal)}</span>
          </span>
        </span>
        <span className="floating-cart-summary-arrow" aria-hidden="true">
          <ChevronRight size={18} strokeWidth={3} />
        </span>
      </button>
    </aside>
  );
};

export default FloatingCartSummary;
