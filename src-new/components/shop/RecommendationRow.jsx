import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import ProductCard from './ProductCard';
import api from '../../utils/api';
import './RecommendationRow.css';

const RecommendationRow = ({ title, type, productId = null, limit = 8 }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        let response;

        switch (type) {
          case 'popular': // Best Sellers
            response = await api.get(`/recommend/trending?limit=${limit}`);
            break;
          case 'new': // Trending Now
            response = await api.get(`/recommend/new?limit=${limit}`);
            break;
          case 'personalized': // Just For You
            response = await api.get(`/recommend/personalized?limit=${limit}`);
            break;
          case 'related': // Frequently Bought Together
            if (productId) {
              response = await api.post('/recommend/product', { productId, limit });
            }
            break;
          default:
            return;
        }

        if (response.data && response.data.success && response.data.data) {
          // Extract product data from the wrapper object { product: {...}, score: ... }
          const items = response.data.data.map(item => item.product);
          setProducts(items);
        }
      } catch (error) {
        console.error(`Error fetching ${type} recommendations:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [type, productId, limit]);

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

  if (loading) return <div className="rec-row-loading"></div>;
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
            <button className="view-all-link">
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
                  _id: product._id,
                  name: product.name,
                  category: product.category,
                  price: product.price,
                  unit: product.unit,
                  rating: 5,
                  reviews: 0,
                  image: product.image,
                  isNew: false,
                  discount: 0
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
