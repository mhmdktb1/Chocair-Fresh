import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  SlidersHorizontal, 
  ShoppingBag, 
  Sparkles, 
  TrendingUp, 
  ArrowRight,
  RotateCcw,
  Tag,
  Check
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import ProductCard from '../components/shop/ProductCard';
import Loading from '../components/common/Loading';
import { useAdmin } from '../context/AdminContext';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';
import './Shop.css';

const Shop = () => {
  const { products, categories: adminCategories, loading, error } = useAdmin();
  const { cartItems, cartCount, cartTotal } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'all';
  const shouldFocusSearch = searchParams.get('focus') === 'search';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortOption, setSortOption] = useState('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const searchInputRef = useRef(null);

  // Sync category with URL search param
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // Handle focus request from bottom nav
  useEffect(() => {
    if (shouldFocusSearch && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [shouldFocusSearch]);

  // Categories list with count
  const categoriesList = useMemo(() => {
    const allCount = products.length;
    const allCat = { id: 'all', name: 'All Products', count: allCount };

    const mapped = adminCategories
      .filter(c => c.isVisible !== false)
      .map(c => {
        const catName = c.name;
        const count = products.filter(p => 
          String(p.category || '').toLowerCase() === String(catName).toLowerCase()
        ).length;
        return {
          id: c._id || catName,
          name: catName,
          image: c.image,
          count
        };
      });

    return [allCat, ...mapped];
  }, [adminCategories, products]);

  // Filter & Sort Logic
  const processedProducts = useMemo(() => {
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

    // 2. Category Filter
    if (selectedCategory !== 'all') {
      const targetCategory = categoriesList.find(c => c.id === selectedCategory || c.name === selectedCategory)?.name || selectedCategory;
      result = result.filter(p => 
        String(p.category || '').toLowerCase() === String(targetCategory).toLowerCase()
      );
    }

    // 3. In Stock filter
    if (onlyInStock) {
      result = result.filter(p => p.stock === undefined || p.stock > 0);
    }

    // 4. On Sale filter
    if (onlyDiscounted) {
      result = result.filter(p => p.discount > 0);
    }

    // 5. Sorting
    const sorted = [...result];
    if (sortOption === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    else if (sortOption === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    else if (sortOption === 'name-asc') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOption === 'discount') sorted.sort((a, b) => (b.discount || 0) - (a.discount || 0));

    return sorted;
  }, [products, selectedCategory, categoriesList, searchQuery, onlyInStock, onlyDiscounted, sortOption]);

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

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (catId === 'all') {
        next.delete('category');
      } else {
        const catObj = categoriesList.find(c => c.id === catId);
        next.set('category', catObj ? catObj.name : catId);
      }
      return next;
    });
  };

  const activeFiltersCount = (onlyInStock ? 1 : 0) + (onlyDiscounted ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setOnlyInStock(false);
    setOnlyDiscounted(false);
    setSortOption('featured');
    setSearchParams({});
  };

  const selectedCategoryObj = categoriesList.find(c => c.id === selectedCategory || c.name === selectedCategory);
  const currentTitle = searchQuery 
    ? `Results for "${searchQuery}"` 
    : selectedCategoryObj?.name === 'All Products' 
      ? 'All Fresh Produce' 
      : `${selectedCategoryObj?.name || 'Fresh Market'} Collection`;

  return (
    <div className="modern-shop-page">
      <Navbar />

      {/* Modern Shop App Header */}
      <header className="shop-app-header">
        <div className="container shop-header-inner">
          <div className="shop-title-row">
            <div>
              <div className="shop-header-badge">
                <Sparkles size={13} />
                <span>100% Organic & Farm Harvest</span>
              </div>
              <h1 className="shop-title">{currentTitle}</h1>
            </div>
            <span className="shop-count-pill">{processedProducts.length} Items</span>
          </div>

          {/* Live Search Bar */}
          <div className="shop-search-wrapper">
            <Search className="shop-search-icon" size={20} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search fruits, vegetables, greens..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="shop-search-input"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={clearSearch} 
                className="shop-search-clear"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Sticky Horizontal Category Rail Chips */}
      <nav className="shop-categories-dock" aria-label="Product Categories">
        <div className="container">
          <div className="categories-scroll-track">
            {categoriesList.map((cat) => {
              const isActive = selectedCategory === cat.id || selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`category-chip ${isActive ? 'active' : ''}`}
                >
                  <span className="chip-name">{cat.name}</span>
                  {cat.count > 0 && <span className="chip-badge">{cat.count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container shop-body-container">
        {/* Quick Filter & Sort Pill Bar */}
        <div className="shop-control-bar">
          <div className="quick-filter-pills">
            <button
              type="button"
              onClick={() => setOnlyDiscounted(!onlyDiscounted)}
              className={`filter-tag-pill ${onlyDiscounted ? 'active' : ''}`}
            >
              <Tag size={14} />
              <span>On Sale</span>
              {onlyDiscounted && <Check size={12} />}
            </button>

            <button
              type="button"
              onClick={() => setOnlyInStock(!onlyInStock)}
              className={`filter-tag-pill ${onlyInStock ? 'active' : ''}`}
            >
              <Sparkles size={14} />
              <span>In Stock</span>
              {onlyInStock && <Check size={12} />}
            </button>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="filter-reset-pill"
                title="Reset all filters"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="sort-control-group">
            <span className="sort-label">Sort:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="shop-sort-select"
              aria-label="Sort products"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="discount">Top Discounts</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="shop-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="shop-skeleton-card">
                <div className="skeleton-img-box" />
                <div className="skeleton-text-line short" />
                <div className="skeleton-text-line" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="shop-empty-state">
            <div className="empty-state-icon">⚠️</div>
            <h3>Unable to load fresh inventory</h3>
            <p>Please check your connection or refresh the page.</p>
            <button 
              type="button" 
              onClick={() => window.location.reload()} 
              className="empty-state-btn"
            >
              Retry
            </button>
          </div>
        ) : processedProducts.length === 0 ? (
          <div className="shop-empty-state">
            <div className="empty-state-icon">🧺</div>
            <h3>No matching harvest found</h3>
            <p>Try searching for a different item or resetting active filters.</p>
            <button 
              type="button" 
              onClick={resetAllFilters} 
              className="empty-state-btn"
            >
              Show All Products
            </button>
          </div>
        ) : (
          <div className="shop-grid">
            {processedProducts.map((product) => (
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
      </main>

      {/* Floating Quick Cart Bar on Mobile */}
      {cartCount > 0 && (
        <aside className="mobile-floating-cart-bar" aria-label="Cart Overview">
          <div className="floating-cart-content" onClick={() => navigate('/cart')}>
            <div className="cart-summary-left">
              <div className="floating-cart-badge">
                <ShoppingBag size={18} />
                <span>{cartCount}</span>
              </div>
              <div className="cart-summary-text">
                <span className="cart-item-count">{cartCount} {cartCount === 1 ? 'item' : 'items'} in basket</span>
                <strong className="cart-total-amount">{formatCurrency(cartTotal)}</strong>
              </div>
            </div>
            <div className="cart-checkout-action">
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
