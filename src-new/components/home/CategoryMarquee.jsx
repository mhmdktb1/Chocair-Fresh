import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CategoryMarquee.css';

const categories = [
  { id: 1, name: 'Fresh Fruits', icon: '🍎' },
  { id: 2, name: 'Vegetables', icon: '🥦' },
  { id: 3, name: 'Dairy & Eggs', icon: '🥛' },
  { id: 4, name: 'Bakery', icon: '🥖' },
  { id: 5, name: 'Meat & Seafood', icon: '🥩' },
  { id: 6, name: 'Beverages', icon: '🥤' },
  { id: 7, name: 'Snacks', icon: '🍿' },
  { id: 8, name: 'Organic', icon: '🌿' },
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
      <div className="marquee-container" role="region">
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