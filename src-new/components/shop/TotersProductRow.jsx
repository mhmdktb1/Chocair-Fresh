import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import api, { getAssetUrl } from '../../utils/api';
import { normalizeUnit, formatQuantityWithUnit } from '../../utils/unitHelper';
import './TotersProductRow.css';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

const TotersProductRow = ({ title, type, productId = null, category = null, limit = 10 }) => {
  const navigate = useNavigate();
  const { cartItems, addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchItems = async () => {
      try {
        setLoading(true);
        const t = Date.now();
        let response;

        if (type === 'similar' && productId) {
          response = await api.post(`/recommend/product?t=${t}`, { productId, limit, type: 'similar' });
        } else if (type === 'related' && productId) {
          response = await api.post(`/recommend/product?t=${t}`, { productId, limit, type: 'associations' });
        } else if (category) {
          response = await api.get(`/products?category=${category}&limit=${limit}&t=${t}`);
        } else {
          response = await api.get(`/products?limit=${limit}&t=${t}`);
        }

        let loaded = [];
        if (response?.data?.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
          loaded = response.data.data
            .map(item => (item.product ? { ...item.product, _id: item.product._id || item.product.id } : null))
            .filter(Boolean);
        } else if (Array.isArray(response?.data?.products)) {
          loaded = response.data.products.map(p => ({ ...p, _id: p._id || p.id }));
        } else if (Array.isArray(response?.data)) {
          loaded = response.data.map(p => ({ ...p, _id: p._id || p.id }));
        }

        // Fallback to general catalog if empty
        if (loaded.length === 0) {
          const fallback = await api.get(`/products?limit=${limit}`);
          const fallbackData = Array.isArray(fallback.data) ? fallback.data : fallback.data?.products || [];
          loaded = fallbackData.map(p => ({ ...p, _id: p._id || p.id })).slice(0, limit);
        }

        // Filter out current product
        if (productId) {
          loaded = loaded.filter(p => String(p._id) !== String(productId));
        }

        if (isMounted) {
          setProducts(loaded);
        }
      } catch (err) {
        console.error('Failed to load toters recommendation row', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchItems();

    return () => {
      isMounted = false;
    };
  }, [type, productId, category, limit]);

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  const handleQuickAdd = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ ...item, unit: normalizeUnit(item.unit) }, 1);
  };

  if (!loading && products.length === 0) return null;

  return (
    <div className="toters-row-container">
      <div className="toters-row-header">
        <h3 className="toters-row-title">{title}</h3>
        <button 
          className="toters-header-arrow-btn" 
          onClick={handleScrollRight}
          aria-label="Scroll items"
        >
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="toters-carousel-scroll" ref={scrollRef}>
        {loading && products.length === 0 ? (
          [1, 2, 3, 4].map(n => (
            <div key={n} className="toters-item-card skeleton">
              <div className="toters-img-box skeleton-box"></div>
              <div className="toters-skeleton-line short"></div>
              <div className="toters-skeleton-line"></div>
            </div>
          ))
        ) : (
          products.map(item => {
            const inCartItem = cartItems.find(c => c._id === item._id);
            const normU = normalizeUnit(item.unit);
            const unitLabel = `Per ${normU}`;

            return (
              <div 
                key={item._id} 
                className="toters-item-card"
                onClick={() => {
                  navigate(`/product/${item._id}`, { state: { product: item } });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="toters-img-box">
                  <img 
                    src={getAssetUrl(item.image) || FALLBACK_IMAGE} 
                    alt={item.name} 
                    loading="lazy"
                    onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                  />

                  {inCartItem ? (
                    <div className="toters-in-cart-badge">
                      {formatQuantityWithUnit(inCartItem.quantity, normU)}
                    </div>
                  ) : (
                    <button 
                      className="toters-quick-add-btn"
                      onClick={(e) => handleQuickAdd(e, item)}
                      aria-label={`Add ${item.name}`}
                      title="Add to cart"
                    >
                      <Plus size={18} />
                    </button>
                  )}
                </div>

                <div className="toters-item-info">
                  <div className="toters-item-price">${Number(item.price).toFixed(2)}</div>
                  <div className="toters-item-name" title={item.name}>{item.name}</div>
                  <div className="toters-item-unit">{unitLabel}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TotersProductRow;