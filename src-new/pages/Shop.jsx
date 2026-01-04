import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import ShopHero from '../components/shop/ShopHero';
import ProductCard from '../components/shop/ProductCard';
import Loading from '../components/common/Loading';
import { useAdmin } from '../context/AdminContext';
import './Shop.css';

const Shop = () => {
  const { products, categories: adminCategories, loading, error } = useAdmin();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [sortOption, setSortOption] = useState('default');
  const [isStuck, setIsStuck] = useState(false);
  const sentinelRef = React.useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(!entry.isIntersecting && entry.boundingClientRect.top < 100);
      },
      { rootMargin: '-81px 0px 0px 0px', threshold: 1.0 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, []);

  // Prepare Categories for the Rail
  const categories = useMemo(() => {
    const allCategory = { 
      id: 'all', 
      name: 'All', 
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200' 
    };
    
    const mappedCategories = adminCategories
      .filter(c => c.isVisible !== false)
      .map(c => ({
        id: c._id || c.name,
        name: c.name,
        image: c.image || 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&q=80&w=200' // Fallback image
      }));

    return [allCategory, ...mappedCategories];
  }, [adminCategories]);

  // Get selected category name for display
  const selectedCategoryName = useMemo(() => {
    const cat = categories.find(c => c.id === selectedCategoryId);
    return cat ? cat.name : 'Fresh Market';
  }, [categories, selectedCategoryId]);

  // Filter & Sort Logic
  const processedProducts = useMemo(() => {
    let result = products;

    // Apply search filter if query exists
    if (searchQuery.trim()) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    result = result.filter(p => {
      if (selectedCategoryId === 'all') return true;
      if (!p.category) return false;
      
      // Compare IDs
      return String(p.category) === String(selectedCategoryId);
    });
    
    // Apply sorting
    if (sortOption === 'price-asc') result.sort((a, b) => a.price - b.price);
    if (sortOption === 'price-desc') result.sort((a, b) => b.price - a.price);
    
    return result;
  }, [products, selectedCategoryId, sortOption, searchQuery]);

  return (
    <div className="shop-page-wrapper">
      <Navbar />
      
      <ShopHero 
        title={selectedCategoryId === 'all' ? 'Fresh Market' : selectedCategoryName}
        subtitle="Hand-picked quality for your healthy lifestyle"
      />

      {/* Sentinel to detect sticking */}
      <div ref={sentinelRef} style={{ height: '1px', width: '100%', visibility: 'hidden', marginTop: '-1px' }} />

      {/* Visual Category Rail - Sticky */}
      <section className={`category-rail-section sticky-rail ${isStuck ? 'is-stuck' : ''}`}>
        <div className="category-rail">
          {categories.map(cat => (
            <div 
              key={cat.id} 
              className={`category-item ${selectedCategoryId === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategoryId(cat.id)}
            >
              <div className="cat-image-ring">
                <img src={cat.image} alt={cat.name} />
              </div>
              <span className="cat-name">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="shop-wrapper">

        <div className="shop-content-layout">
          {/* Main Grid */}
          <main className="shop-main">
            <header className="shop-toolbar">
              <h2 className="section-heading">
                {searchQuery ? `Search: "${searchQuery}"` : selectedCategoryId === 'all' ? 'Fresh Market' : selectedCategoryName + ' Collection'}
              </h2>
              
              <div className="toolbar-filters">
                 <label className="filter-pill"><input type="checkbox" /> In Stock</label>
                 <label className="filter-pill"><input type="checkbox" /> On Sale</label>
              </div>

              <div className="toolbar-actions">
                <span className="result-count">{processedProducts.length} Products</span>
                <div className="sort-wrapper">
                  <select onChange={(e) => setSortOption(e.target.value)} value={sortOption}>
                    <option value="default">Sort by: Featured</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </header>

            {loading ? (
              <Loading fullScreen={false} text="Loading products..." />
            ) : error ? (
              <div className="empty-state">Error loading products.</div>
            ) : processedProducts.length === 0 ? (
              <div className="empty-state">No products found in this category.</div>
            ) : (
              <div className="premium-grid">
                {processedProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={{
                      ...product,
                      _id: product.id, // Ensure _id is present for ProductCard
                      rating: product.rating || 5,
                      reviews: product.reviews || 0,
                      isNew: product.isNew || false,
                      discount: product.discount || 0
                    }} 
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Shop;
