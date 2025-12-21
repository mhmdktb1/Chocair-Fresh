import React, { useState, useMemo } from 'react';
import Navbar from '../components/layout/Navbar';
import CategoryRail from '../components/shop/CategoryRail';
import ShopToolbar from '../components/shop/ShopToolbar';
import ProductGrid from '../components/shop/ProductGrid';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import './Shop.css';

const Shop = () => {
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const { categories: rawCategories, loading: categoriesLoading } = useCategories();
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('default');

  // Prepare Categories for the Rail
  const categories = useMemo(() => {
    const allCategory = { 
      id: 'all', 
      name: 'All', 
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200' 
    };
    
    const mappedCategories = (rawCategories || [])
      .filter(c => c.isVisible !== false)
      .map(c => ({
        id: c._id || c.name,
        name: c.name,
        image: c.image || 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&q=80&w=200' // Fallback image
      }));

    return [allCategory, ...mappedCategories];
  }, [rawCategories]);

  // Filter & Sort Logic
  const processedProducts = useMemo(() => {
    let result = products.filter(p => selectedCategory === 'All' || p.category === selectedCategory);
    
    if (sortOption === 'price-asc') result.sort((a, b) => a.price - b.price);
    if (sortOption === 'price-desc') result.sort((a, b) => b.price - a.price);
    
    return result;
  }, [products, selectedCategory, sortOption]);

  const loading = productsLoading || categoriesLoading;
  const error = productsError;

  return (
    <div className="shop-page-wrapper">
      <Navbar />
      <div className="shop-wrapper">
        
        {/* Visual Category Rail */}
        <CategoryRail 
          categories={categories} 
          selectedCategory={selectedCategory} 
          onSelectCategory={setSelectedCategory} 
        />

        <div className="shop-content-layout">
          {/* Main Grid */}
          <main className="shop-main">
            <ShopToolbar 
              categoryName={selectedCategory}
              productCount={processedProducts.length}
              sortOption={sortOption}
              onSortChange={setSortOption}
            />

            <ProductGrid 
              products={processedProducts} 
              loading={loading} 
              error={error} 
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Shop;
