import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import './CategoryMarquee.css';

const defaultCategories = [
  { id: '1', name: 'Fruits', icon: '🍎', color: '#ff7675', bg: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)', badge: 'Fresh' },
  { id: '2', name: 'Vegetables', icon: '🥦', color: '#00b894', bg: 'linear-gradient(135deg, #55efc4 0%, #81ecec 100%)', badge: 'Organic' },
  { id: '3', name: 'Herbs', icon: '🌿', color: '#00cec9', bg: 'linear-gradient(135deg, #81ecec 0%, #00b894 100%)', badge: 'Aromatic' },
  { id: '4', name: 'Raw Nuts', icon: '🌰', color: '#e17055', bg: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)', badge: 'Natural' },
  { id: '5', name: 'Cooked Nuts', icon: '🥜', color: '#d63031', bg: 'linear-gradient(135deg, #ff7675 0%, #d63031 100%)', badge: 'Roasted' },
  { id: '6', name: 'Dates', icon: '🌴', color: '#6c5ce7', bg: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)', badge: 'Premium' },
];

const getCategoryVisuals = (name) => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('fruit') || lower.includes('apple') || lower.includes('berry')) {
    return { icon: '🍎', bg: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)', badge: 'Fresh' };
  }
  if (lower.includes('veg') || lower.includes('salad') || lower.includes('green')) {
    return { icon: '🥦', bg: 'linear-gradient(135deg, #55efc4 0%, #81ecec 100%)', badge: 'Organic' };
  }
  if (lower.includes('herb') || lower.includes('spice') || lower.includes('mint') || lower.includes('parsley')) {
    return { icon: '🌿', bg: 'linear-gradient(135deg, #81ecec 0%, #00b894 100%)', badge: 'Aromatic' };
  }
  if (lower.includes('raw nut') || lower.includes('almond') || lower.includes('walnut')) {
    return { icon: '🌰', bg: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)', badge: 'Natural' };
  }
  if (lower.includes('cooked nut') || lower.includes('roasted') || lower.includes('peanut') || lower.includes('pistachio')) {
    return { icon: '🥜', bg: 'linear-gradient(135deg, #ff7675 0%, #d63031 100%)', badge: 'Roasted' };
  }
  if (lower.includes('date') || lower.includes('medjool') || lower.includes('ajwa')) {
    return { icon: '🌴', bg: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)', badge: 'Premium' };
  }
  if (lower.includes('nut')) {
    return { icon: '🌰', bg: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)', badge: 'Healthy' };
  }
  return { icon: '✨', bg: 'linear-gradient(135deg, #55efc4 0%, #00b894 100%)', badge: 'Fresh' };
};

const CategoryMarquee = ({ categories: propCategories }) => {
  const navigate = useNavigate();
  const { categories: fetchedCategories } = useCategories();

  const displayCategories = React.useMemo(() => {
    const source = (propCategories && propCategories.length > 0)
      ? propCategories
      : (fetchedCategories && fetchedCategories.length > 0)
        ? fetchedCategories
        : defaultCategories;

    return source.map((c, index) => {
      const name = typeof c === 'string' ? c : c.name || `Category ${index + 1}`;
      const visuals = getCategoryVisuals(name);
      return {
        id: c._id || c.id || `cat-${index}`,
        name,
        icon: c.icon || visuals.icon,
        bg: c.bg || visuals.bg,
        badge: c.badge || visuals.badge,
      };
    });
  }, [propCategories, fetchedCategories]);

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
          {displayCategories.map((cat) => (
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
          {/* Repeat items for seamless loop */}
          {[...displayCategories, ...displayCategories, ...displayCategories].map((cat, index) => (
            <div 
              key={`${cat.id}-${index}`} 
              className="marquee-item"
              onClick={() => handleCategoryClick(cat.name)}
              onKeyDown={(e) => handleKeyDown(e, cat.name)}
              role="listitem"
              tabIndex={index < displayCategories.length ? 0 : -1}
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