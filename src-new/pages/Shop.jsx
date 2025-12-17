import React, { useState, useEffect } from 'react';
import ProductCard from '../components/shop/ProductCard';
import Navbar from '../components/layout/Navbar';
import { useAdmin } from '../context/AdminContext';
import './Shop.css';

const Shop = () => {
  const { products, categories: adminCategories, loading, error } = useAdmin();
  const [filter, setFilter] = useState('All');
  
  // Use categories from AdminContext
  // Filter out hidden categories if necessary, assuming we only want visible ones
  const categories = ['All', ...adminCategories
    .filter(c => c.isVisible !== false) // Optional: respect visibility
    .map(c => c.name)];
  
  const filteredProducts = filter === 'All' 
    ? products 
    : products.filter(p => p.category === filter);

  return (
    <div className="shop-page">
      <Navbar />
      
      <div className="shop-header">
        <div className="container">
          <h1 className="shop-title">Our Products</h1>
          <p className="shop-subtitle">Fresh from the farm to your table</p>
        </div>
      </div>

      <div className="container shop-content">
        <div className="shop-filters">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`filter-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2rem', color: '#666' }}>
            Loading products...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#f44336' }}>
            {error}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2rem', color: '#666' }}>
            No products found.
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={{
                  _id: product.id,
                  name: product.name,
                  category: product.category,
                  price: product.price,
                  rating: 5, // Default rating for now
                  reviews: 0, // Default reviews
                  image: product.image,
                  isNew: false,
                  discount: 0
                }} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;