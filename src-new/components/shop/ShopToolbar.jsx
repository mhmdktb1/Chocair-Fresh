import React from 'react';

const ShopToolbar = ({ 
  categoryName, 
  productCount, 
  sortOption, 
  onSortChange,
  showFilters = true // Optional if we want to hide filters
}) => {
  return (
    <header className="shop-toolbar">
      <h2 className="section-heading">{categoryName} Collection</h2>
      
      {showFilters && (
        <div className="toolbar-filters">
           <label className="filter-pill"><input type="checkbox" /> In Stock</label>
           <label className="filter-pill"><input type="checkbox" /> On Sale</label>
        </div>
      )}

      <div className="toolbar-actions">
        <span className="result-count">{productCount} Products</span>
        <div className="sort-wrapper">
          <select onChange={(e) => onSortChange(e.target.value)} value={sortOption}>
            <option value="default">Sort by: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>
    </header>
  );
};

export default ShopToolbar;
