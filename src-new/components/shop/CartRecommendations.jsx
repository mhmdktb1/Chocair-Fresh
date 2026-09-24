import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import ProductCard from './ProductCard';
import api from '../../utils/api';
import { useCart } from '../../context/CartContext';
import { normalizeUnit } from '../../utils/unitHelper';
import './CartRecommendations.css';

const CartRecommendations = ({ limit = 8 }) => {
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
          productId: item._id || item.id,
          quantity: item.quantity
        }));

        const response = await api.post('/recommend/cart', { 
          cartItems: formattedItems,
          limit 
        });

        if (response.data && response.data.success && response.data.data) {
          // Extract product data from the wrapper object { product: {...}, score: ... }
          const items = response.data.data.map(item => item.product).filter(Boolean);
          setProducts(items);
        }
      } catch (error) {
        console.error('Error fetching cart recommendations:', error);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms delay

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [cartItems, limit]);

  if (products.length === 0) return null;

  return (
    <section className="cart-recommendations-section">
      <div className="cart-rec-header">
        <div className="cart-rec-title-wrap">
          <div className="cart-rec-icon-badge">
            <Sparkles size={18} />
          </div>
          <div className="cart-rec-headings">
            <h3 className="cart-rec-title">Complete Your Order</h3>
            <span className="cart-rec-subtitle">Frequently paired fresh harvest</span>
          </div>
        </div>
      </div>
      
      <div className="cart-rec-track">
        {products.map((product) => (
          <div key={product._id || product.id} className="cart-rec-card-item">
            <ProductCard 
              product={{
                ...product,
                _id: product._id || product.id,
                name: product.name,
                category: product.category,
                price: product.price,
                unit: normalizeUnit(product.unit),
                rating: product.rating || 4.9,
                reviews: product.reviews || 16,
                image: product.image,
                isNew: product.isNew || false
              }} 
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default CartRecommendations;
