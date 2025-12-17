import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Plus, Minus, ShoppingCart, Heart } from "lucide-react";
import "../styles/ProductPage.css";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import ProductRecommendations from "../components/recommendations/ProductRecommendations";

function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  // product passed from navigation state or fallback demo
  const product = location.state?.product || {
    id,
    name: "Fresh Strawberries",
    price: 3.5,
    description:
      "Sweet, juicy Lebanese strawberries freshly handpicked every morning. Perfect for smoothies, desserts, and a healthy snack.",
    img: "/assets/images/products/strawberry.jpg",
  };

  const increase = () => setQuantity((q) => q + 1);
  const decrease = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const handleAddToCart = () => {
    addToCart(product, quantity);
    console.log("Added to cart:", product.name, "Quantity:", quantity);
    navigate("/cart");
  };

  const handleToggleFavorite = () => {
    toggleFavorite(product);
  };

  return (
    <div className="product-page">
      {/* Header */}
      <header className="product-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </button>
        <h2>Product Details</h2>
      </header>

      {/* Image */}
      <div className="product-image">
        <img src={product.img || product.image} alt={product.name} />
        <button 
          className="favorite-btn" 
          onClick={handleToggleFavorite}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Heart 
            size={24} 
            fill={isFavorite(product._id || product.id) ? '#2E7D32' : 'none'}
            stroke={isFavorite(product._id || product.id) ? '#2E7D32' : '#666'}
          />
        </button>
      </div>

      {/* Info Card */}
      <div className="product-info-card">
        <h1>{product.name}</h1>
        <p className="price">
          ${typeof product.price === 'string' ? parseFloat(product.price.replace('$', '')).toFixed(2) : product.price.toFixed(2)}
          {product.unit && <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: '400' }}> / {product.unit}</span>}
        </p>
        <p className="description">{product.description || product.desc || "Fresh, high-quality product from Chocair Fresh."}</p>

        <div className="quantity">
          <button onClick={decrease}><Minus /></button>
          <span>{quantity}</span>
          <button onClick={increase}><Plus /></button>
        </div>
      </div>

      {/* PRODUCT RECOMMENDATIONS */}
      <ProductRecommendations productId={product._id || product.id} />

      {/* Sticky Add to Cart Bar */}
      <div className="add-bar">
        <div className="add-info">
          <span>{quantity} {product.unit || 'item'}{quantity > 1 ? 's' : ''} × ${typeof product.price === 'string' ? parseFloat(product.price.replace('$', '')).toFixed(2) : product.price.toFixed(2)}</span>
          <strong>Total: ${(typeof product.price === 'string' ? parseFloat(product.price.replace('$', '')) * quantity : product.price * quantity).toFixed(2)}</strong>
        </div>
        <button className="add-btn" onClick={handleAddToCart}>
          <ShoppingCart size={18} /> Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ProductPage;
