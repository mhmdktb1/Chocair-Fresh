import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  ShoppingBag, 
  Sparkles, 
  ArrowRight,
  RotateCcw,
  Tag,
  Check,
  ChevronRight,
  SlidersHorizontal,
  Flame,
  LayoutGrid,
  List,
  Clock,
  ArrowLeft
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import ProductCard from '../components/shop/ProductCard';
import Loading from '../components/common/Loading';
import { useAdmin } from '../context/AdminContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { translations } from '../utils/translations';
import { formatCurrency } from '../utils/formatters';
import './Shop.css';

const getCategoryEmoji = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('fruit') || n.includes('apple') || n.includes('berry')) return '🍎';
  if (n.includes('veg') || n.includes('greens') || n.includes('salad')) return '🥦';
  if (n.includes('herb') || n.includes('mint') || n.includes('parsley')) return '🌿';
  if (n.includes('cooked') || n.includes('roasted')) return '🥜';
  if (n.includes('raw') || n.includes('almond') || n.includes('walnut')) return '🌰';
  if (n.includes('date') || n.includes('medjool')) return '🌴';
  if (n.includes('nut')) return '🌰';
  if (n.includes('dairy') || n.includes('milk') || n.includes('cheese') || n.includes('egg')) return '🥛';
  if (n.includes('deal') || n.includes('offer')) return '🔥';
  return '✨';
};

const Shop = () => {
  const { products, categories: adminCategories, loading, error } = useAdmin();
  const { cartItems, cartCount, cartTotal } = useCart();
  const { language } = useTheme();
  const t = translations[language] || translations.en;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'all';
  const shouldFocusSearch = searchParams.get('focus') === 'search';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [activeSpyCategory, setActiveSpyCategory] = useState('all');
  const [sortOption, setSortOption] = useState('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const searchInputRef = useRef(null);
  const categoryTrackRef = useRef(null);
  const sectionRefs = useRef({});

  // Sync category with URL search param
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    } else {
      setSelectedCategory('all');
    }
  }, [searchParams]);

  // Focus search input when requested via URL param (e.g. from bottom nav)
  useEffect(() => {
    if (shouldFocusSearch && searchInputRef.current) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [shouldFocusSearch]);

  // Categories list with count - dynamically derived from products AND adminCategories
  const categoriesList = useMemo(() => {
    const allCount = products.length;
    const allCat = { id: 'all', name: 'All Products', count: allCount, emoji: '✨' };

    // 1. Collect all category names from products
    const productCatNames = Array.from(
      new Set(
        products
          .map(p => p.category ? String(p.category).trim() : null)
          .filter(Boolean)
      )
    );

    // 2. Collect category names from adminCategories
    const adminCatNames = (adminCategories || [])
      .filter(c => c.isVisible !== false)
      .map(c => String(c.name).trim())
      .filter(Boolean);

    // 3. Union of all unique category names
    const allUniqueNames = Array.from(new Set([...adminCatNames, ...productCatNames]));

    const mapped = allUniqueNames.map(catName => {
      const adminCat = (adminCategories || []).find(
        c => String(c.name).trim().toLowerCase() === catName.toLowerCase()
      );
      const count = products.filter(p => 
        String(p.category || '').trim().toLowerCase() === catName.toLowerCase()
      ).length;

      return {
        id: adminCat?._id || catName,
        name: catName,
        image: adminCat?.image,
        emoji: getCategoryEmoji(catName),
        count
      };
    }).filter(c => c.count > 0);

    return [allCat, ...mapped];
  }, [adminCategories, products]);

  const selectedCategoryObj = useMemo(() => {
    return categoriesList.find(
      c => c.id === selectedCategory || c.name?.toLowerCase() === String(selectedCategory)?.toLowerCase()
    );
  }, [categoriesList, selectedCategory]);

  // Center active category tab in rail whenever selected category changes
  useEffect(() => {
    const activeId = selectedCategory === 'all' ? 'all' : (selectedCategoryObj?.id || selectedCategory);
    const activeBtn = document.getElementById(`tab-btn-${activeId}`);
    if (activeBtn && categoryTrackRef.current) {
      const track = categoryTrackRef.current;
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      const trackWidth = track.offsetWidth;
      track.scrollTo({
        left: btnLeft - (trackWidth / 2) + (btnWidth / 2),
        behavior: 'smooth'
      });
    }
  }, [selectedCategory, selectedCategoryObj]);

  // Filter & Sort Logic for full/filtered list
  const filteredProducts = useMemo(() => {
    let result = products;

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // 2. In Stock filter
    if (onlyInStock) {
      result = result.filter(p => p.stock === undefined || p.stock > 0);
    }

    // 3. On Sale filter
    if (onlyDiscounted) {
      result = result.filter(p => p.discount > 0);
    }

    // 4. Sorting
    const sorted = [...result];
    if (sortOption === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    else if (sortOption === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    else if (sortOption === 'name-asc') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOption === 'discount') sorted.sort((a, b) => (b.discount || 0) - (a.discount || 0));

    return sorted;
  }, [products, searchQuery, onlyInStock, onlyDiscounted, sortOption]);

  // Group products by category for the Toters horizontal rows
  const categorizedSections = useMemo(() => {
    const realCategories = categoriesList.filter(c => c.id !== 'all');
    
    const sections = realCategories.map(cat => {
      const items = filteredProducts.filter(p => 
        String(p.category || '').trim().toLowerCase() === String(cat.name).trim().toLowerCase()
      );
      return {
        ...cat,
        items
      };
    }).filter(sec => sec.items.length > 0);

    // If there are leftover products not matching any listed category, include them
    const categorizedProductIds = new Set(
      sections.flatMap(s => s.items.map(p => p._id || p.id))
    );
    const uncatItems = filteredProducts.filter(
      p => !categorizedProductIds.has(p._id || p.id)
    );

    if (uncatItems.length > 0) {
      sections.push({
        id: 'other',
        name: 'Fresh Harvest & More',
        emoji: '🌿',
        items: uncatItems,
        count: uncatItems.length
      });
    }

    return sections;
  }, [categoriesList, filteredProducts]);

  // ScrollSpy to track active section while scrolling in "All" view with smooth centering
  useEffect(() => {
    if (selectedCategory !== 'all' || searchQuery) return;

    let rafId = null;
    let lastSection = null;

    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const scrollPosition = window.scrollY + 200;
        let currentSection = 'all';

        // Check if user is near top
        if (window.scrollY < 120) {
          currentSection = 'all';
        } else {
          for (const section of categorizedSections) {
            const el = document.getElementById(`cat-section-${section.id}`);
            if (el) {
              const top = el.offsetTop;
              const height = el.offsetHeight;
              if (scrollPosition >= top && scrollPosition < top + height) {
                currentSection = section.id;
                break;
              }
            }
          }
        }

        setActiveSpyCategory(currentSection);

        // Only scroll the track if the highlighted section actually changed
        if (currentSection !== lastSection) {
          lastSection = currentSection;
          const activeBtn = document.getElementById(`tab-btn-${currentSection}`);
          if (activeBtn && categoryTrackRef.current) {
            const track = categoryTrackRef.current;
            const btnLeft = activeBtn.offsetLeft;
            const btnWidth = activeBtn.offsetWidth;
            const trackWidth = track.offsetWidth;
            const targetScrollLeft = btnLeft - (trackWidth / 2) + (btnWidth / 2);
            track.scrollTo({
              left: Math.max(0, targetScrollLeft),
              behavior: 'smooth'
            });
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [selectedCategory, searchQuery, categorizedSections]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val.trim()) {
        next.set('search', val);
      } else {
        next.delete('search');
      }
      next.delete('focus');
      return next;
    });
  };

  const clearSearch = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('search');
      next.delete('focus');
      return next;
    });
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleCategoryTabClick = (catId) => {
    if (catId === 'all') {
      setSelectedCategory('all');
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('category');
        return next;
      });
    } else {
      const catObj = categoriesList.find(c => c.id === catId || c.name.toLowerCase() === String(catId).toLowerCase());
      const catName = catObj ? catObj.name : catId;
      setSelectedCategory(catObj ? catObj.id : catId);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('category', catName);
        return next;
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSeeAllCategory = (catId, catName) => {
    setSelectedCategory(catId);
    setSearchParams({ category: catName });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFiltersCount = (onlyInStock ? 1 : 0) + (onlyDiscounted ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setOnlyInStock(false);
    setOnlyDiscounted(false);
    setSortOption('featured');
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isSpecificView = selectedCategory !== 'all' || Boolean(searchQuery);

  const specificProducts = useMemo(() => {
    if (!isSpecificView) return [];
    if (selectedCategory === 'all') return filteredProducts;
    const target = selectedCategoryObj?.name || selectedCategory;
    return filteredProducts.filter(p => 
      String(p.category || '').trim().toLowerCase() === String(target).trim().toLowerCase()
    );
  }, [isSpecificView, selectedCategory, selectedCategoryObj, filteredProducts]);

  return (
    <div className="modern-shop-page toters-layout">
      {/* Desktop-Only Navbar */}
      <div className="shop-desktop-navbar-wrapper">
        <Navbar />
      </div>

      {/* ==========================================
          UNIFIED STICKY SHOPPING DOCK (SEARCH + CATEGORIES + QUICK FILTERS)
          ========================================== */}
      <div className="toters-unified-sticky-dock">
        {/* Tier 1: Search Bar & Filter Controls */}
        <div className="toters-search-tier">
          <div className="container toters-search-tier-inner">
            <div className="toters-search-row">
              {isSpecificView && (
                <button 
                  type="button" 
                  className="toters-back-pill-btn" 
                  onClick={resetAllFilters}
                  aria-label="Back to all categories"
                  title="View all aisles"
                >
                  <ArrowLeft size={18} />
                </button>
              )}

              <div className="toters-search-box">
                <Search className="toters-search-icon" size={17} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t.searchPlaceholder || "Search farm fresh items..."}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="toters-search-input"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={clearSearch} 
                    className="toters-search-clear"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                type="button"
                className={`toters-filter-trigger-btn ${activeFiltersCount > 0 ? 'active' : ''}`}
                onClick={() => setShowFilterDrawer(true)}
                title="Filter & Sort Options"
              >
                <SlidersHorizontal size={17} />
                {activeFiltersCount > 0 && <span className="filter-badge-dot">{activeFiltersCount}</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: Category Snap Rail Pinned Directly Below Search */}
        <nav className="toters-category-snap-rail" aria-label="Aisle Categories">
          <div className="toters-rail-scroll-track" ref={categoryTrackRef}>
            {categoriesList.map((cat) => {
              // Explicitly chosen/filtered category
              const isChosen = selectedCategory !== 'all' && (
                selectedCategory === cat.id || 
                selectedCategory === cat.name || 
                selectedCategoryObj?.id === cat.id || 
                selectedCategoryObj?.name?.toLowerCase() === cat.name?.toLowerCase()
              );

              // ScrollSpy active category while browsing all aisles
              const isBrowsingHere = selectedCategory === 'all' && !searchQuery && (
                activeSpyCategory === cat.id || (activeSpyCategory === 'all' && cat.id === 'all')
              );

              const tabClass = isChosen 
                ? 'is-chosen' 
                : isBrowsingHere 
                  ? 'is-browsing' 
                  : '';

              return (
                <button
                  key={cat.id}
                  id={`tab-btn-${cat.id}`}
                  type="button"
                  onClick={() => handleCategoryTabClick(cat.id)}
                  className={`toters-category-tab ${tabClass}`}
                >
                  <span className="tab-emoji">{cat.emoji}</span>
                  <span className="tab-name">{cat.name}</span>
                  {cat.count > 0 && <span className="tab-count-pill">{cat.count}</span>}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* ==========================================
          4. MAIN TOTERS SHOP AISLE FEED
          ========================================== */}
      <main className="container toters-shop-main-feed">
        {loading ? (
          <div className="toters-loading-state">
            {[1, 2, 3].map(n => (
              <div key={n} className="toters-skeleton-section">
                <div className="skeleton-header-bar" />
                <div className="skeleton-row-track">
                  {[1, 2, 3, 4].map(k => (
                    <div key={k} className="skeleton-card" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="toters-empty-state-card">
            <div className="empty-icon-wrap">⚠️</div>
            <h3>Unable to load fresh aisles</h3>
            <p>Please check your connection or tap below to refresh.</p>
            <button type="button" onClick={() => window.location.reload()} className="toters-refresh-btn">
              Retry Harvest
            </button>
          </div>
        ) : isSpecificView ? (
          /* SINGLE CATEGORY OR SEARCH RESULTS: MULTI-COLUMN GRID */
          <div className="toters-specific-grid-view fade-in">
            <div className="specific-view-header">
              <div className="header-left">
                <h2 className="specific-title">
                  {searchQuery 
                    ? `Results for "${searchQuery}"` 
                    : `${selectedCategoryObj?.emoji || '🧺'} ${selectedCategoryObj?.name || 'Fresh Market'}`}
                </h2>
                <span className="specific-count-tag">{specificProducts.length} items available</span>
              </div>
              <button type="button" className="see-all-aisles-btn" onClick={resetAllFilters}>
                View All Aisles
              </button>
            </div>

            {specificProducts.length === 0 ? (
              <div className="toters-empty-state-card">
                <div className="empty-icon-wrap">🧺</div>
                <h3>No fresh items found</h3>
                <p>Try searching with another keyword or reset the active filter tags.</p>
                <button type="button" onClick={resetAllFilters} className="toters-refresh-btn">
                  Browse All Categories
                </button>
              </div>
            ) : (
              <div className="toters-grid-2col">
                {specificProducts.map((product) => (
                  <ProductCard
                    key={product.id || product._id}
                    product={{
                      ...product,
                      _id: product.id || product._id,
                      rating: product.rating || 4.9,
                      reviews: product.reviews || 16,
                      isNew: product.isNew || false,
                      discount: product.discount || 0
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TOTERS HORIZONTAL AISLES STREAM (BY CATEGORY) */
          <div className="toters-aisles-stream">
            {filteredProducts.length === 0 ? (
              <div className="toters-empty-state-card">
                <div className="empty-icon-wrap">🧺</div>
                <h3>No harvest currently available</h3>
                <p>Try resetting the filter tags to explore our full seasonal catalog.</p>
                <button type="button" onClick={resetAllFilters} className="toters-refresh-btn">
                  Show All Produce
                </button>
              </div>
            ) : categorizedSections.length === 0 ? (
              <div className="toters-grid-2col">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id || product._id}
                    product={{
                      ...product,
                      _id: product.id || product._id,
                      rating: product.rating || 4.9,
                      reviews: product.reviews || 16,
                      isNew: product.isNew || false,
                      discount: product.discount || 0
                    }}
                  />
                ))}
              </div>
            ) : (
              categorizedSections.map((section) => (
                <section 
                  key={section.id} 
                  id={`cat-section-${section.id}`} 
                  className="toters-category-row-section"
                >
                  {/* Category Header Row */}
                  <div className="toters-section-header">
                    <div className="section-title-wrap">
                      <span className="section-emoji-badge">{section.emoji}</span>
                      <div className="section-headings">
                        <h2 className="section-category-title">{section.name}</h2>
                        <span className="section-items-badge">{section.items.length} {section.items.length === 1 ? 'item' : 'items'}</span>
                      </div>
                    </div>
                    
                    <button 
                      type="button" 
                      className="toters-see-all-action"
                      onClick={() => handleSeeAllCategory(section.id, section.name)}
                    >
                      <span>See all</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  {/* Horizontal Touch Scroll Row */}
                  <div className="toters-horizontal-products-track">
                    {section.items.map((product) => (
                      <div key={product.id || product._id} className="toters-horizontal-card-item">
                        <ProductCard
                          product={{
                            ...product,
                            _id: product.id || product._id,
                            rating: product.rating || 4.9,
                            reviews: product.reviews || 16,
                            isNew: product.isNew || false,
                            discount: product.discount || 0
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        )}
      </main>

      {/* ==========================================
          5. BOTTOM SHEET FILTER & SORT MODAL
          ========================================== */}
      {showFilterDrawer && (
        <div className="toters-modal-overlay" onClick={() => setShowFilterDrawer(false)}>
          <div className="toters-bottom-sheet-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-handle-bar" />
            
            <div className="drawer-header-row">
              <h3 className="drawer-title">Filter & Sort Harvest</h3>
              <button 
                type="button" 
                className="drawer-close-icon"
                onClick={() => setShowFilterDrawer(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body-scroll">
              {/* Sort By Section */}
              <div className="drawer-group">
                <label className="drawer-group-label">Sort Products By</label>
                <div className="drawer-options-grid">
                  {[
                    { id: 'featured', label: 'Featured Picks' },
                    { id: 'price-asc', label: 'Price: Low to High' },
                    { id: 'price-desc', label: 'Price: High to Low' },
                    { id: 'discount', label: 'Biggest Discount' },
                    { id: 'name-asc', label: 'Name: A to Z' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`drawer-option-pill ${sortOption === opt.id ? 'active' : ''}`}
                      onClick={() => setSortOption(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles Section */}
              <div className="drawer-group">
                <label className="drawer-group-label">Product Availability</label>
                
                <div className="drawer-toggle-row" onClick={() => setOnlyDiscounted(!onlyDiscounted)}>
                  <div className="toggle-label-text">
                    <Flame size={16} className="fire-color" />
                    <span>Special Deals & Offers Only</span>
                  </div>
                  <input type="checkbox" checked={onlyDiscounted} readOnly />
                </div>

                <div className="drawer-toggle-row" onClick={() => setOnlyInStock(!onlyInStock)}>
                  <div className="toggle-label-text">
                    <Sparkles size={16} className="green-color" />
                    <span>In Stock Only</span>
                  </div>
                  <input type="checkbox" checked={onlyInStock} readOnly />
                </div>
              </div>
            </div>

            <div className="drawer-footer-actions">
              <button 
                type="button" 
                className="drawer-reset-btn"
                onClick={resetAllFilters}
              >
                Reset All
              </button>
              <button 
                type="button" 
                className="drawer-apply-btn"
                onClick={() => setShowFilterDrawer(false)}
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          6. FLOATING SLEEK CART BAR (MOBILE ONLY)
          ========================================== */}
      {cartCount > 0 && (
        <aside className="toters-floating-cart-dock" aria-label="Shopping Cart Summary">
          <div className="floating-cart-inner-pill" onClick={() => navigate('/cart')}>
            <div className="cart-left-meta">
              <div className="cart-icon-bubble">
                <ShoppingBag size={17} />
                <span className="cart-badge-number">{cartCount}</span>
              </div>
              <div className="cart-pricing-col">
                <span className="cart-items-count-text">
                  {cartCount} {cartCount === 1 ? 'fresh item' : 'fresh items'}
                </span>
                <strong className="cart-subtotal-val">{formatCurrency(cartTotal)}</strong>
              </div>
            </div>

            <div className="cart-right-action">
              <span>View Cart</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default Shop;
