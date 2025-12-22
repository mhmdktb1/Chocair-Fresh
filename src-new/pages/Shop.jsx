import React, { useState, useMemo } from 'react';
import Navbar from '../components/layout/Navbar';
import ShopHero from '../components/shop/ShopHero';
import ProductCard from '../components/shop/ProductCard';
import { useAdmin } from '../context/AdminContext';
import './Shop.css';

const Shop = () => {
  const { products, categories: adminCategories, loading, error } = useAdmin();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('default');

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

  // Filter & Sort Logic
  const processedProducts = useMemo(() => {
    let result = products.filter(p => selectedCategory === 'All' || p.category === selectedCategory);
    
    if (sortOption === 'price-asc') result.sort((a, b) => a.price - b.price);
    if (sortOption === 'price-desc') result.sort((a, b) => b.price - a.price);
    
    return result;
  }, [products, selectedCategory, sortOption]);

  return (
    <div className="shop-page-wrapper">
      <Navbar />
      
      <ShopHero 
        title={selectedCategory === 'All' ? 'Fresh Market' : selectedCategory}
        subtitle="Hand-picked quality for your healthy lifestyle"
      >
        {/* Visual Category Rail inside Hero */}
        <section className="category-rail-section">
          <div className="category-rail">
            {categories.map(cat => (
              <div 
                key={cat.id} 
                className={`category-item ${selectedCategory === cat.name ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                <div className="cat-image-ring">
                  <img src={cat.image} alt={cat.name} />
                </div>
                <span className="cat-name">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>
      </ShopHero>

      <div className="shop-wrapper">

        <div className="shop-content-layout">
          {/* Main Grid */}
          <main className="shop-main">
            <header className="shop-toolbar">
              <h2 className="section-heading">{selectedCategory} Collection</h2>
              
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
              <div className="empty-state">Loading products...</div>
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
