import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, loading, error }) => {
  if (loading) {
    return <div className="empty-state">Loading products...</div>;
  }

  if (error) {
    return <div className="empty-state">Error loading products.</div>;
  }

  if (products.length === 0) {
    return <div className="empty-state">No products found in this category.</div>;
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
