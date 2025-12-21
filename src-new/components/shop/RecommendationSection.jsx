import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import ProductCard from './ProductCard';
import './RecommendationSection.css';

const RecommendationSection = ({ currentProductId }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!currentProductId) return;
      
      try {
        setLoading(true);
        const response = await api.post('/recommend/product', { 
          productId: currentProductId,
          limit: 4 
        });
        
        if (response.data.success && response.data.data) {
          setRecommendations(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch recommendations", err);
        // Don't show error to user, just hide section or show fallback
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentProductId]);

  if (loading) return <div className="recommendation-loading">Loading suggestions...</div>;
  if (recommendations.length === 0) return null;

  return (
    <div className="recommendation-section">
      <h2 className="recommendation-title">You Might Also Like</h2>
      <div className="recommendation-grid">
        {recommendations.map((item) => (
          <ProductCard 
            key={item.product._id} 
            product={{
              _id: item.product._id,
              name: item.product.name,
              category: item.product.category,
              price: item.product.price,
              unit: item.product.unit, // Ensure unit is passed if available in backend response
              rating: 5, // Default
              reviews: 0, // Default
              image: item.product.image,
              isNew: false,
              discount: 0
            }} 
          />
        ))}
      </div>
    </div>
  );
};

export default RecommendationSection;
