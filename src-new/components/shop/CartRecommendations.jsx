import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import ProductCard from './ProductCard';
import api from '../../utils/api';
import { useCart } from '../../context/CartContext';
import './RecommendationRow.css'; // Reuse existing styles

const CartRecommendations = ({ limit = 4 }) => {
  const { cartItems } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    // Don't fetch if cart is empty
    if (cartItems.length === 0) {
      setProducts([]);
      return;
    }

    // Debounce the API call
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        setLoading(true);
        
        // Format cart items for the API: [{ productId, quantity }]
        const formattedItems = cartItems.map(item => ({
          productId: item._id,
          quantity: item.quantity
        }));

        const response = await api.post('/recommend/cart', { 
          cartItems: formattedItems,
          limit 
        });

        if (response.data && response.data.success && response.data.data) {
          // Extract product data from the wrapper object { product: {...}, score: ... }
          const items = response.data.data.map(item => item.product);
          setProducts(items);
        }
      } catch (error) {
        console.error('Error fetching cart recommendations:', error);
      } finally {
        setLoading(false);
      }
    }, 800); // 800ms delay

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [cartItems, limit]);

  if (products.length === 0) return null;

  return (
    <section className="recommendation-row cart-recommendations">
      <div className="row-header">
        <h2 className="row-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={24} color="var(--primary)" />
          Complete Your Order
        </h2>
      </div>
      
      <div className="row-grid">
        {products.map((product) => (
          <ProductCard 
            key={product._id} 
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
        ))}
      </div>
    </section>
  );
};

export default CartRecommendations;
