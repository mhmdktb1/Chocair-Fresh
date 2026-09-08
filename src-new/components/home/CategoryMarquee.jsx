import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import './CategoryMarquee.css';

const categories = [
  { id: 1, name: 'Fresh Fruits', icon: '🍎', color: '#ff7675', bg: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)', badge: 'Fresh' },
  { id: 2, name: 'Vegetables', icon: '🥦', color: '#00b894', bg: 'linear-gradient(135deg, #55efc4 0%, #81ecec 100%)', badge: 'Organic' },
  { id: 3, name: 'Dairy & Eggs', icon: '🥛', color: '#0984e3', bg: 'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)', badge: 'Daily' },
  { id: 4, name: 'Bakery', icon: '🥖', color: '#e17055', bg: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)', badge: 'Artisan' },
  { id: 5, name: 'Meat & Seafood', icon: '🥩', color: '#d63031', bg: 'linear-gradient(135deg, #ff7675 0%, #d63031 100%)', badge: 'Premium' },
  { id: 6, name: 'Beverages', icon: '🥤', color: '#6c5ce7', bg: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)', badge: 'Cold' },
  { id: 7, name: 'Snacks', icon: '🍿', color: '#fdcb6e', bg: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)', badge: 'Crispy' },
  { id: 8, name: 'Organic', icon: '🌿', color: '#00cec9', bg: 'linear-gradient(135deg, #55efc4 0%, #00b894 100%)', badge: '100% Bio' },
];

const CategoryMarquee = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName) => {
    navigate(`/shop?category=${encodeURIComponent(categoryName)}`);
  };

  const handleKeyDown = (e, categoryName) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCategoryClick(categoryName);
    }
  };

  return (
    <section className="category-marquee-section" aria-label="Product categories">
      {/* Mobile-Only Category App Rail */}
      <div className="mobile-category-rail-wrapper">
        <div className="mobile-category-header">
          <div className="mobile-category-title-group">
            <span className="mobile-section-badge">
              <Sparkles size={11} /> Explore
            </span>
            <h2 className="mobile-category-title">Shop by Category</h2>
          </div>
          <button 
            className="mobile-see-all-btn" 
            onClick={() => navigate('/shop')}
            aria-label="See all categories"
          >
            <span>See All</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="mobile-category-grid" role="list">
          {categories.map((cat) => (
            <div 
              key={`mob-${cat.id}`} 
              className="mobile-category-card"
              onClick={() => handleCategoryClick(cat.name)}
              role="listitem"
              tabIndex={0}
              aria-label={`Shop ${cat.name}`}
            >
              <div className="mobile-category-bubble" style={{ background: cat.bg }}>
                <span className="mobile-category-icon" aria-hidden="true">{cat.icon}</span>
                {cat.badge && <span className="mobile-cat-microbadge">{cat.badge}</span>}
              </div>
              <span className="mobile-category-name">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Marquee Track */}
      <div className="marquee-container desktop-marquee-only" role="region">
        <div className="marquee-track" role="list">
          {/* Double the items for seamless loop */}
          {[...categories, ...categories, ...categories].map((cat, index) => (
            <div 
              key={`${cat.id}-${index}`} 
              className="marquee-item"
              onClick={() => handleCategoryClick(cat.name)}
              onKeyDown={(e) => handleKeyDown(e, cat.name)}
              role="listitem"
              tabIndex={index < categories.length ? 0 : -1}
              aria-label={`Browse ${cat.name}`}
            >
              <span className="marquee-icon" aria-hidden="true">{cat.icon}</span>
              <span className="marquee-text">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryMarquee;