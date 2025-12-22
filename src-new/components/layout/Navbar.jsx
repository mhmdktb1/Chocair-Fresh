import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, LogOut, Search, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true); // New state for visibility
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const searchInputRef = useRef(null);
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Background transparency logic
      setScrolled(currentScrollY > 50);

      // Smart scroll logic: Hide on scroll down, show on scroll up
      // Only hide after scrolling down significantly (300px) to avoid hiding on initial scroll
      if (currentScrollY > lastScrollY && currentScrollY > 300) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Fetch products for search recommendations
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setAllProducts(response.data);
      } catch (error) {
        console.error('Failed to fetch products for search', error);
      }
    };

    if (searchOpen && allProducts.length === 0) {
      fetchProducts();
    }
  }, [searchOpen, allProducts.length]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    
    // Lock body scroll when search is open
    if (searchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [searchOpen]);

  useEffect(() => {
    if (searchQuery.trim() && allProducts.length > 0) {
      const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5); // Limit to 5 recommendations
      setRecommendations(filtered);
    } else {
      setRecommendations([]);
    }
  }, [searchQuery, allProducts]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleRecommendationClick = (productId) => {
    // Navigate to product detail (if you have a product detail page) or shop with search
    // For now, let's go to shop with search since we might not have product detail page ready
    // Or if you have product detail: navigate(`/product/${productId}`);
    // Assuming we want to filter shop:
    const product = allProducts.find(p => p._id === productId);
    if (product) {
      navigate(`/shop?search=${encodeURIComponent(product.name)}`);
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${!isVisible ? 'navbar-hidden' : ''}`}>
        <div className="container navbar-container">
          <Link to="/" className="logo">
            Chocair<span className="highlight">Fresh</span>
          </Link>

          <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/shop" className="nav-link">Shop</Link>
            <Link to="/#about" className="nav-link">About</Link>
            <Link to="/#contact" className="nav-link">Contact</Link>
            
            <div className="mobile-actions">
              {user ? (
                <>
                  <Link to="/profile" className="nav-link">My Account</Link>
                  <button 
                    onClick={handleLogout} 
                    className="nav-link" 
                    style={{
                      background: 'none', 
                      border: 'none', 
                      textAlign: 'left', 
                      padding: '0', 
                      font: 'inherit', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="nav-link">Login</Link>
              )}
            </div>
          </div>

          <div className="nav-actions">
            <button 
              className="icon-btn search-toggle" 
              onClick={() => setSearchOpen(true)}
              type="button"
              aria-label="Open Search"
            >
              <Search size={24} />
            </button>

            <Link to="/cart" className="icon-btn">
              <ShoppingBag size={24} />
              {cartCount > 0 && <span className="badge">{cartCount}</span>}
            </Link>
            
            {user ? (
              <Link to="/profile" className="icon-btn desktop-only" title="My Account">
                <User size={24} fill="#2e7d32" color="#2e7d32" />
              </Link>
            ) : (
              <Link to="/login" className="icon-btn desktop-only">
                <User size={24} />
              </Link>
            )}
            
            <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Full Screen Search Overlay */}
      <div className={`search-overlay ${searchOpen ? 'active' : ''}`}>
        <div className="search-backdrop" onClick={() => setSearchOpen(false)}></div>
        
        <button className="close-search" onClick={() => setSearchOpen(false)}>
          <X size={32} />
        </button>

        <div className="search-content">
          <div className="search-box-container">
            <form onSubmit={handleSearchSubmit} className="search-form">
              <Search className="search-icon-large" size={28} />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="What are you looking for?" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-large"
              />
              <button type="submit" className="search-submit-btn">
                <ArrowRight size={24} />
              </button>
            </form>
          </div>

          {recommendations.length > 0 && (
            <div className="search-recommendations">
              <h3 className="recommendations-title">Suggestions</h3>
              <div className="recommendations-list">
                {recommendations.map(product => (
                  <div 
                    key={product._id} 
                    className="recommendation-item"
                    onClick={() => handleRecommendationClick(product._id)}
                  >
                    <div className="rec-image">
                      <img src={product.image} alt={product.name} />
                    </div>
                    <div className="rec-info">
                      <span className="rec-name">{product.name}</span>
                      <span className="rec-category">{product.category}</span>
                    </div>
                    <span className="rec-price">${product.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
