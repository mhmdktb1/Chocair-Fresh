import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import ProductCard from './ProductCard';
import api from '../../utils/api';
import { useProducts } from '../../hooks/useProducts';
import { normalizeUnit } from '../../utils/unitHelper';
import './RecommendationRow.css';

const toCard = (p) => ({ ...p, _id: p._id || p.id });

const extractItems = (response) => {
  if (response?.data?.success && Array.isArray(response.data.data)) {
    return response.data.data
      .map((item) => (item.product ? toCard(item.product) : null))
      .filter(Boolean);
  }
  if (Array.isArray(response?.data)) return response.data.map(toCard);
  if (Array.isArray(response?.data?.products)) return response.data.products.map(toCard);
  return [];
};

const RecommendationRow = ({ title, subtitle = null, type, category = null, viewAllLink = null, productId = null, limit = 8, cartItems = [], items = [] }) => {
  const navigate = useNavigate();
  const { products: catalog } = useProducts();
  const [fetched, setFetched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef(null);

  const catalogById = useMemo(
    () => new Map(catalog.map((p) => [String(p._id || p.id), p])),
    [catalog]
  );

  const hasManualItems = Array.isArray(items) && items.length > 0 && (type === 'manual' || type === 'category');
  const isCategoryRow = !hasManualItems && (type === 'category' || Boolean(category));
  const targetCategory = String(category || title || '').trim().toLowerCase();
  // Category rows are served straight from the already-loaded catalog when available.
  const catalogCanServe = isCategoryRow && catalog.length > 0;

  const derived = useMemo(() => {
    if (hasManualItems) {
      // Prefer live catalog data so seasonal picks show current price/stock/discount.
      return items
        .filter(Boolean)
        .map((p) => catalogById.get(String(p._id || p.id)) || p)
        .map(toCard);
    }
    if (catalogCanServe) {
      return catalog
        .filter((p) => String(p.category || '').trim().toLowerCase() === targetCategory)
        .slice(0, limit)
        .map(toCard);
    }
    return null;
  }, [hasManualItems, items, catalogById, catalogCanServe, catalog, targetCategory, limit]);

  const itemsKey = hasManualItems ? items.map((p) => p?._id || p?.id).join(',') : '';
  const cartKey = (cartItems || []).map((c) => `${c._id || c.id}:${c.quantity || c.qty || 1}`).join(',');

  useEffect(() => {
    if (hasManualItems || catalogCanServe) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    const fetchRecommendations = async () => {
      try {
        setLoading(true);

        if (isCategoryRow) {
          const catRes = await api.get(`/products?category=${encodeURIComponent(category || title)}&limit=${limit}`);
          if (isMounted) setFetched(extractItems(catRes).slice(0, limit));
          return;
        }

        let response;
        switch (type) {
          case 'popular':
            response = await api.get(`/recommend/trending?limit=${limit}`);
            break;
          case 'new':
            response = await api.get(`/recommend/new?limit=${limit}`);
            break;
          case 'top-rated':
            response = await api.get(`/recommend/top-rated?limit=${limit}`);
            break;
          case 'personalized':
          case 'for-you':
            response = await api.get(`/recommend/personalized?limit=${limit}`);
            break;
          case 'related':
            if (productId) {
              response = await api.post('/recommend/product', { productId, limit, type: 'associations' });
            }
            break;
          case 'similar':
            if (productId) {
              response = await api.post('/recommend/product', { productId, limit, type: 'similar' });
            }
            break;
          case 'cart':
            if (cartItems && cartItems.length > 0) {
              response = await api.post('/recommend/cart', { cartItems, limit });
            }
            break;
          default:
            break;
        }

        let loadedItems = extractItems(response);

        // Cold start: if ML recommendations are empty, show the general catalog instead
        if (loadedItems.length === 0 && ['popular', 'new', 'personalized', 'for-you'].includes(type)) {
          const fallbackRes = await api.get(`/products?limit=${limit}`);
          loadedItems = extractItems(fallbackRes).slice(0, limit);
        }

        if (isMounted) setFetched(loadedItems);
      } catch (error) {
        console.error(`Error fetching ${type} recommendations:`, error);
        try {
          const fallbackRes = await api.get(`/products?limit=${limit}`);
          if (isMounted) setFetched(extractItems(fallbackRes).slice(0, limit));
        } catch (e) {
          console.error('Fallback failed', e);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecommendations();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, productId, limit, category, title, itemsKey, cartKey, hasManualItems, catalogCanServe, isCategoryRow]);

  const products = derived || fetched;

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
      setScrollProgress(progress);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -320 : 320;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!derived && loading && products.length === 0) {
    return (
      <section className="recommendation-row skeleton-row">
        <div className="container">
          <div className="row-header">
            <div className="header-left">
              <h2 className="row-title skeleton-title">{title}</h2>
              <div className="title-underline"></div>
            </div>
          </div>
          <div className="row-scroll-container">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="scroll-item skeleton-card">
                <div className="skeleton-image"></div>
                <div className="skeleton-line short"></div>
                <div className="skeleton-line"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="recommendation-row">
      <div className="container">
        <div className="row-header">
          <div className="header-left">
            <h2 className="row-title">{title}</h2>
            <div className="title-underline"></div>
          </div>
          
          <div className="header-controls">
            <button 
              className="view-all-link" 
              onClick={() => navigate(viewAllLink || (category ? `/shop?category=${encodeURIComponent(category)}` : '/shop'))}
            >
              View All
            </button>
            <div className="nav-buttons">
              <button className="nav-btn" onClick={() => scroll('left')} aria-label="Scroll left">
                <ArrowLeft size={20} />
              </button>
              <button className="nav-btn" onClick={() => scroll('right')} aria-label="Scroll right">
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
        
        <div 
          className="row-scroll-container" 
          ref={scrollRef}
          onScroll={handleScroll}
        >
          {products.map((product) => (
            <div key={product._id} className="scroll-item">
              <ProductCard 
                product={{
                  ...product,
                  _id: product._id,
                  name: product.name,
                  category: product.category,
                  price: product.price,
                  unit: normalizeUnit(product.unit),
                  rating: product.rating !== undefined ? product.rating : 5,
                  reviews: product.numReviews !== undefined ? product.numReviews : (product.reviews || 0),
                  image: product.image,
                  countInStock: product.countInStock !== undefined ? product.countInStock : 99,
                  isNew: product.isNew || false
                }} 
              />
            </div>
          ))}
        </div>

        <div className="scroll-progress-track">
          <div 
            className="scroll-progress-bar" 
            style={{ width: `${Math.max(5, scrollProgress)}%` }} // Min width 5% for visibility
          ></div>
        </div>
      </div>
    </section>
  );
};

export default RecommendationRow;
