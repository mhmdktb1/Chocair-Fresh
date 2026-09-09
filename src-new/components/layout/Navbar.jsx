import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, X, Search, ArrowRight, Sparkles, MessageCircle, Info, Package, ChevronRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [curtainOpen, setCurtainOpen] = useState(false);
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
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastScrollY;

          // Background blur and solid state threshold
          setScrolled(currentScrollY > 40);

          // Smart scroll logic with buffer threshold to avoid jitter
          if (currentScrollY > 180 && !curtainOpen && !searchOpen) {
            if (delta > 8) {
              // Scrolling down with clear intent -> hide
              setIsVisible(false);
              document.body.classList.add('nav-hidden');
            } else if (delta < -8) {
              // Scrolling up with clear intent -> show smoothly
              setIsVisible(true);
              document.body.classList.remove('nav-hidden');
            }
          } else {
            // Near the top -> always visible
            setIsVisible(true);
            document.body.classList.remove('nav-hidden');
          }

          lastScrollY = Math.max(0, currentScrollY);
          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [curtainOpen, searchOpen]);

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
    
    if (searchOpen || curtainOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [searchOpen, curtainOpen]);

  useEffect(() => {
    if (searchQuery.trim() && allProducts.length > 0) {
      const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5);
      setRecommendations(filtered);
    } else {
      setRecommendations([]);
    }
  }, [searchQuery, allProducts]);

  const handleLogout = () => {
    logout();
    setCurtainOpen(false);
    window.location.reload();
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
    const product = allProducts.find(p => p._id === productId);
    if (product) {
      navigate(`/shop?search=${encodeURIComponent(product.name)}`);
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  const toggleCurtain = (e) => {
    e.preventDefault();
    setCurtainOpen(!curtainOpen);
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${!isVisible ? 'navbar-hidden' : ''} ${curtainOpen ? 'curtain-active' : ''}`}>
        <div className="container navbar-container">
          
          {/* Mobile Left Search Button */}
          <button 
            className="icon-btn search-toggle" 
            onClick={() => setSearchOpen(true)}
            type="button"
            aria-label="Open Search"
          >
            <Search size={22} />
          </button>

          {/* Center Brand Logo with Integrated 3-Dashes in FRESH */}
          <button 
            className={`brand-logo-btn ${curtainOpen ? 'open' : ''}`}
            onClick={toggleCurtain}
            aria-label="Toggle Navigation Curtain"
          >
            <span className="brand-chocair">Chocair</span>
            <span className="brand-fresh">
              FR
              <span className="e-dash-group" title="Menu">
                <span className="dash-line line-1"></span>
                <span className="dash-line line-2"></span>
                <span className="dash-line line-3"></span>
              </span>
              SH
            </span>
          </button>

          {/* Desktop Full Navigation Links */}
          <div className="nav-links desktop-only">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/shop" className="nav-link">Shop</Link>
            <Link to="/#about" className="nav-link">About</Link>
            <Link to="/#contact" className="nav-link">Contact</Link>
          </div>

          {/* Right Action Icons (Cart & Account) */}
          <div className="nav-actions">
            {user ? (
              <Link to="/profile" className="icon-btn desktop-only" title="My Account">
                <User size={22} fill="#2e7d32" color="#2e7d32" />
              </Link>
            ) : (
              <Link to="/login" className="icon-btn desktop-only" title="Login">
                <User size={22} />
              </Link>
            )}

            <Link to="/cart" className="icon-btn cart-btn-top" aria-label="Cart">
              <ShoppingBag size={22} />
              {cartCount > 0 && <span className="badge">{cartCount > 99 ? '99+' : cartCount}</span>}
            </Link>
          </div>
        </div>
      </nav>

      {/* Full Screen Top Curtain Menu */}
      <div className={`curtain-drawer ${curtainOpen ? 'open' : ''}`}>
        <div className="curtain-header">
          <span className="curtain-title">Explore Chocair Fresh</span>
          <button className="curtain-close-btn" onClick={() => setCurtainOpen(false)} aria-label="Close">
            <X size={26} />
          </button>
        </div>

        <div className="curtain-content">
          <div className="curtain-hero-card" onClick={() => { setCurtainOpen(false); navigate('/shop'); }}>
            <div className="curtain-card-text">
              <span className="curtain-tag"><Sparkles size={13} /> 100% Organic</span>
              <h3>Fresh From Farm To Your Table</h3>
              <p>Explore handcrafted seasonal produce & daily harvest.</p>
            </div>
            <ArrowRight size={22} className="curtain-arrow" />
          </div>

          <div className="curtain-menu-grid">
            <Link to="/" className="curtain-nav-item" onClick={() => setCurtainOpen(false)}>
              <div className="c-icon-wrap"><Sparkles size={18} /></div>
              <div className="c-info">
                <strong>Home Feed</strong>
                <span>Recommended picks & updates</span>
              </div>
              <ChevronRight size={18} className="c-chevron" />
            </Link>

            <Link to="/shop" className="curtain-nav-item" onClick={() => setCurtainOpen(false)}>
              <div className="c-icon-wrap"><ShoppingBag size={18} /></div>
              <div className="c-info">
                <strong>Shop Catalog</strong>
                <span>Browse all organic categories</span>
              </div>
              <ChevronRight size={18} className="c-chevron" />
            </Link>

            <Link to="/profile" className="curtain-nav-item" onClick={() => setCurtainOpen(false)}>
              <div className="c-icon-wrap"><Package size={18} /></div>
              <div className="c-info">
                <strong>My Orders</strong>
                <span>Track current orders & history</span>
              </div>
              <ChevronRight size={18} className="c-chevron" />
            </Link>

            <Link to="/#about" className="curtain-nav-item" onClick={() => setCurtainOpen(false)}>
              <div className="c-icon-wrap"><Info size={18} /></div>
              <div className="c-info">
                <strong>Our Story</strong>
                <span>Learn about our mission & quality</span>
              </div>
              <ChevronRight size={18} className="c-chevron" />
            </Link>

            <a 
              href="https://wa.me/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="curtain-nav-item whatsapp-item" 
              onClick={() => setCurtainOpen(false)}
            >
              <div className="c-icon-wrap whatsapp-icon"><MessageCircle size={18} /></div>
              <div className="c-info">
                <strong>WhatsApp Support</strong>
                <span>Quick chat with our customer team</span>
              </div>
              <ChevronRight size={18} className="c-chevron" />
            </a>
          </div>

          <div className="curtain-footer">
            {user ? (
              <div className="curtain-user-bar">
                <div className="user-info">
                  <User size={18} />
                  <span>Signed in as <strong>{user.name || 'User'}</strong></span>
                </div>
                <button onClick={handleLogout} className="curtain-logout-btn">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="curtain-login-btn" onClick={() => setCurtainOpen(false)}>
                <User size={18} /> Sign In or Create Account
              </Link>
            )}
          </div>
        </div>
      </div>

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
