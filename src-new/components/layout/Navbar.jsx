import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  User, 
  X, 
  Search, 
  ArrowRight, 
  Sparkles, 
  MessageCircle, 
  Info, 
  Package, 
  ChevronRight, 
  Flame,
  CheckCircle,
  CornerDownLeft
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { translations } from '../../utils/translations';
import api from '../../utils/api';
import './Navbar.css';

const CATEGORY_EMOJIS = {
  'All': '✨',
  'Fruits': '�',
  'Seasonal Fruits': '🍉',
  'Seasonal Fruit': '🍉',
  'Vegetables': '🥦',
  'Herbs': '🌿',
  'Raw Nuts': '🥜',
  'Cooked Nuts': '🌰',
  'Dates': '🌴'
};

const TRENDING_TAGS = [
  { label: 'Strawberries', emoji: '🍓' },
  { label: 'Avocado', emoji: '🥑' },
  { label: 'Fresh Mint', emoji: '🌿' },
  { label: 'Medjool Dates', emoji: '🌴' },
  { label: 'Raw Almonds', emoji: '🥜' },
  { label: 'Tomatoes', emoji: '🍅' },
  { label: 'Cucumbers', emoji: '🥒' }
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [recommendations, setRecommendations] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const { language } = useTheme();
  const t = translations[language] || translations.en;
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

  // Global keyboard shortcut for Search (Cmd+K / Ctrl+K / Esc)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape' && searchOpen) {
        e.preventDefault();
        setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [searchOpen]);

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
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
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

  // Filter recommendations based on search query + category
  useEffect(() => {
    if (allProducts.length === 0) {
      setRecommendations([]);
      return;
    }

    let filtered = allProducts;

    if (activeCategory !== 'All') {
      filtered = filtered.filter(p => 
        p.category && p.category.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    setRecommendations(filtered.slice(0, 8));
    setSelectedIndex(-1);
  }, [searchQuery, activeCategory, allProducts]);

  const handleLogout = () => {
    logout();
    setCurtainOpen(false);
    window.location.reload();
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (selectedIndex >= 0 && recommendations[selectedIndex]) {
      handleRecommendationClick(recommendations[selectedIndex]._id);
      return;
    }
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}${activeCategory !== 'All' ? `&category=${encodeURIComponent(activeCategory)}` : ''}`);
      setSearchOpen(false);
      setSearchQuery('');
    } else if (activeCategory !== 'All') {
      navigate(`/shop?category=${encodeURIComponent(activeCategory)}`);
      setSearchOpen(false);
    }
  };

  const handleRecommendationClick = (productId) => {
    const product = allProducts.find(p => p._id === productId);
    if (product) {
      navigate(`/product/${productId}`);
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleTrendingTagClick = (tagLabel) => {
    setSearchQuery(tagLabel);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < recommendations.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : recommendations.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSearchOpen(false);
    }
  };

  const toggleCurtain = (e) => {
    e.preventDefault();
    setCurtainOpen(!curtainOpen);
  };

  const categories = ['All', 'Fruits', 'Seasonal Fruits', 'Vegetables', 'Herbs', 'Raw Nuts', 'Cooked Nuts', 'Dates'];

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
            <Link to="/" className="nav-link">{t.home}</Link>
            <Link to="/shop" className="nav-link">{t.shop}</Link>
            <Link to="/#about" className="nav-link">{t.about}</Link>
            <Link to="/#contact" className="nav-link">{t.contact}</Link>
          </div>

          {/* Desktop Modern Search Bar Trigger */}
          <div 
            className="nav-search-trigger desktop-only"
            onClick={() => setSearchOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="Open search"
            title="Search products (Ctrl+K)"
          >
            <Search size={15} className="nav-search-trigger-icon" />
            <span className="nav-search-trigger-text">
              {t.searchPlaceholder || "Search fruits, veggies, nuts..."}
            </span>
            <span className="nav-search-trigger-shortcut">
              <kbd>⌘</kbd><kbd>K</kbd>
            </span>
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
              href="https://wa.me/96171966828" 
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

      {/* Modern Spotlight Search Overlay */}
      <div className={`modern-search-overlay ${searchOpen ? 'active' : ''}`} role="dialog" aria-modal="true">
        <div className="modern-search-backdrop" onClick={() => setSearchOpen(false)}></div>

        <div className="modern-search-spotlight">
          {/* Top Search Input Box */}
          <div className="modern-search-header">
            <div className="modern-search-input-wrapper">
              <Search size={20} className="modern-search-lens-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="modern-search-input-field"
                placeholder={t.searchPlaceholder || "Search fresh fruits, veggies, fresh herbs, nuts..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                aria-label="Search items"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="modern-search-clear-btn"
                  onClick={() => { setSearchQuery(''); if (searchInputRef.current) searchInputRef.current.focus(); }}
                  aria-label="Clear search query"
                >
                  <X size={15} />
                </button>
              )}
              <button 
                type="button" 
                className="modern-search-esc-badge"
                onClick={() => setSearchOpen(false)}
                title="Close (ESC)"
              >
                ESC
              </button>
            </div>

            {/* Category Filter Chips Bar */}
            <div className="modern-search-categories-bar">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`search-cat-chip ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  <span className="chip-emoji">{CATEGORY_EMOJIS[cat] || '✨'}</span>
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Body: Results, Trending, or Empty State */}
          <div className="modern-search-body">
            {/* If user hasn't typed anything yet */}
            {!searchQuery.trim() && (
              <div className="modern-search-empty-prompt">
                <div className="modern-search-section-header">
                  <span className="section-title">
                    <Flame size={14} className="fire-icon" /> Popular & Trending
                  </span>
                </div>
                <div className="trending-tags-grid">
                  {TRENDING_TAGS.map(tag => (
                    <button
                      key={tag.label}
                      type="button"
                      className="trending-tag-pill"
                      onClick={() => handleTrendingTagClick(tag.label)}
                    >
                      <span className="trend-emoji">{tag.emoji}</span>
                      <span className="trend-text">{tag.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Live Instant Search Results */}
            {recommendations.length > 0 && (
              <div className="modern-search-results-section">
                <div className="modern-search-section-header">
                  <span className="section-title">
                    <Sparkles size={14} className="sparkle-icon" />
                    {searchQuery ? `Products matching "${searchQuery}"` : `${activeCategory} Harvest`}
                  </span>
                  <span className="results-count-pill">{recommendations.length} available</span>
                </div>

                <div className="modern-search-results-list">
                  {recommendations.map((product, idx) => (
                    <div
                      key={product._id}
                      className={`modern-search-item ${selectedIndex === idx ? 'highlighted' : ''}`}
                      onClick={() => handleRecommendationClick(product._id)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <div className="item-thumb-wrapper">
                        <img 
                          src={product.image || '/assets/images/placeholder.jpg'} 
                          alt={product.name}
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=150&auto=format&fit=crop&q=80'; }}
                        />
                      </div>
                      <div className="item-meta">
                        <div className="item-title-row">
                          <span className="item-name">{product.name}</span>
                          {product.category && (
                            <span className="item-cat-tag">
                              {CATEGORY_EMOJIS[product.category] || '🌱'} {product.category}
                            </span>
                          )}
                        </div>
                        {product.description && (
                          <p className="item-description-preview">{product.description}</p>
                        )}
                      </div>
                      <div className="item-action-group">
                        <span className="item-price">
                          ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                        </span>
                        <button className="item-select-arrow" aria-label="View product">
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State when search has no matches */}
            {searchQuery.trim() && recommendations.length === 0 && (
              <div className="modern-search-no-results">
                <div className="no-results-icon-wrap">
                  <Search size={28} />
                </div>
                <h4>No fresh items found</h4>
                <p>We couldn't find any products matching <strong>"{searchQuery}"</strong>{activeCategory !== 'All' ? ` in ${activeCategory}` : ''}.</p>
                <div className="no-results-actions">
                  <button
                    type="button"
                    className="btn-browse-shop"
                    onClick={() => {
                      navigate('/shop');
                      setSearchOpen(false);
                    }}
                  >
                    Browse Entire Catalog
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modern Search Footer */}
          <div className="modern-search-footer">
            <div className="footer-shortcuts">
              <span className="shortcut-item"><kbd>↵</kbd> to select</span>
              <span className="shortcut-item"><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
              <span className="shortcut-item"><kbd>esc</kbd> to close</span>
            </div>
            {searchQuery.trim() && (
              <button 
                type="button" 
                className="footer-view-all-btn"
                onClick={handleSearchSubmit}
              >
                <span>View all results in Shop</span>
                <CornerDownLeft size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
