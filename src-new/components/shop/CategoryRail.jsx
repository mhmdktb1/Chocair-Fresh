import React from 'react';
import { getAssetUrl } from '../../utils/api';
import './CategoryRail.css'; // We'll need to ensure styles are moved or available

const CategoryRail = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <section className="category-rail-section">
      <div className="category-rail">
        {categories.map(cat => (
          <div 
            key={cat.id} 
            className={`category-item ${selectedCategory === cat.name ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.name)}
          >
            <div className="cat-image-ring">
              <img 
                src={getAssetUrl(cat.image) || '/assets/images/categories/placeholder.jpg'} 
                alt={cat.name} 
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <span className="cat-name">{cat.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoryRail;
