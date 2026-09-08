import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products = [], loading, error }) => {
  if (loading) {
    return (
      <div className="premium-grid">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="skeleton-card" style={{ minHeight: '260px' }}>
            <div className="skeleton-image" style={{ height: '180px' }}></div>
            <div className="skeleton-line short" style={{ marginTop: '10px' }}></div>
            <div className="skeleton-line"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>
          Unable to reach fresh inventory right now.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            marginTop: '1rem', 
            background: 'var(--primary)', 
            color: '#fff', 
            padding: '0.6rem 1.5rem', 
            borderRadius: '50px', 
            fontWeight: 700 
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
        <p>No fresh produce found in this category.</p>
      </div>
    );
  }

  return (
    <div className="premium-grid">
      {products.map(product => (
        <ProductCard 
          key={product._id || product.id} 
          product={{
            ...product,
            _id: product._id || product.id,
            rating: product.rating || 5,
            reviews: product.reviews || 0,
            isNew: product.isNew || false,
            discount: product.discount || 0
          }} 
        />
      ))}
    </div>
  );
};

export default ProductGrid;
