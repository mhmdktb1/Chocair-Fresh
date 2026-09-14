import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Save, Image as ImageIcon, Type, Layout, Search, X, Plus } from 'lucide-react';
import './HomeEditor.css';

const HomeEditor = () => {
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [formData, setFormData] = useState({
    hero: { 
      title: '', 
      subtitle: '', 
      backgroundImage: '',
      stats: [
        { label: '', value: '' },
        { label: '', value: '' },
        { label: '', value: '' }
      ]
    },
    bundle: { title: '', description: '', price: 0, image: '' },
    story: { title: '', subtitle: '', description: '', image: '' },
    seasonal: { title: '', products: [] },
    featuredCategories: []
  });

  useEffect(() => {
    fetchSettings();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products?limit=1000'); // Get all products
      // Handle both array response and paginated response structure
      if (Array.isArray(data)) {
        setAllProducts(data);
      } else {
        setAllProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to load products", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/home-config');
      const data = response.data;
      if (data) {
        // Ensure stats array has 3 items
        if (!data.hero.stats || data.hero.stats.length === 0) {
            data.hero.stats = [
                { label: 'Happy Customers', value: '20k+' },
                { label: 'Fresh Products', value: '500+' },
                { label: 'Fast Delivery', value: '24h' }
            ];
        }
        // Ensure seasonal exists
        if (!data.seasonal) {
            data.seasonal = { title: 'Seasonal Favorites', products: [] };
        }
        setFormData(data);
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load home settings");
      setLoading(false);
    }
  };

  const handleChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const handleStatChange = (index, field, value) => {
    const newStats = [...formData.hero.stats];
    newStats[index][field] = value;
    setFormData(prev => ({
      ...prev,
      hero: { ...prev.hero, stats: newStats }
    }));
  };

  const handleAddProduct = (product) => {
    // Check if already added
    if (formData.seasonal.products.some(p => p._id === product._id)) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      seasonal: {
        ...prev.seasonal,
        products: [...prev.seasonal.products, product]
      }
    }));
    setProductSearch(''); // Clear search
  };

  const handleRemoveProduct = (productId) => {
    setFormData(prev => ({
      ...prev,
      seasonal: {
        ...prev.seasonal,
        products: prev.seasonal.products.filter(p => p._id !== productId)
      }
    }));
  };

  const handleSave = async () => {
    try {
      await api.put('/home-config', formData);
      toast.success("Homepage updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update homepage");
    }
  };

  if (loading) {
    return (
      <div className="admin-empty-state">
        <Layout size={40} color="#cbd5e1" />
        <h4>Loading store configurations...</h4>
      </div>
    );
  }

  return (
    <div className="home-editor-container">
      <div className="editor-header">
        <div>
          <h2 className="editor-title">Storefront Content (CMS)</h2>
          <p className="editor-subtitle">Customize homepage promotions, story, bundles, and seasonal picks</p>
        </div>
        <button onClick={handleSave} className="save-btn">
          <Save size={18} />
          <span>Save Changes</span>
        </button>
      </div>
      
      <div className="editor-content">
        {/* Hero Section */}
        <div className="editor-section">
          <h3 className="section-title">
            <span className="section-icon-wrap">
              <Layout size={18} />
            </span>
            <span>Hero Banner & Value Props</span>
          </h3>

          <div className="form-group">
            <label className="form-label">Headline Title</label>
            <input 
              className="form-input"
              placeholder="e.g. Pure Farm Freshness Delivered To Your Door"
              value={formData.hero.title}
              onChange={(e) => handleChange('hero', 'title', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sub-headline Description</label>
            <textarea 
              className="form-textarea"
              rows="2"
              placeholder="e.g. Hand-picked organic fruits and vegetables..."
              value={formData.hero.subtitle}
              onChange={(e) => handleChange('hero', 'subtitle', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Background Banner Image URL</label>
            <input 
              className="form-input"
              value={formData.hero.backgroundImage}
              onChange={(e) => handleChange('hero', 'backgroundImage', e.target.value)}
              placeholder="https://... or /assets/images/hero/..."
            />
            {formData.hero.backgroundImage && (
              <img 
                src={formData.hero.backgroundImage} 
                alt="Hero Preview" 
                className="image-preview-thumbnail"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <p className="image-preview-help">Recommended high resolution banner (1920x800px)</p>
          </div>
          
          <div className="form-group">
            <label className="form-label">Highlights / Trust Badges (3 stats)</label>
            <div className="stats-grid">
              {formData.hero.stats.map((stat, index) => (
                <div key={index} className="stat-card">
                  <input 
                    className="form-input stat-input-val"
                    placeholder="Value (e.g. 20k+)"
                    value={stat.value}
                    onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                  />
                  <input 
                    className="form-input stat-input-label"
                    placeholder="Label (e.g. Happy Users)"
                    value={stat.label}
                    onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bundle Section */}
        <div className="editor-section">
          <h3 className="section-title">
            <span className="section-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Type size={18} />
            </span>
            <span>Promotional Bundle Box</span>
          </h3>
          <div className="form-group">
            <label className="form-label">Bundle Title</label>
            <input 
              className="form-input"
              placeholder="e.g. Family Harvest Weekly Box"
              value={formData.bundle.title}
              onChange={(e) => handleChange('bundle', 'title', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              className="form-textarea"
              rows="2"
              placeholder="Contains 10kg of seasonal favorites..."
              value={formData.bundle.description}
              onChange={(e) => handleChange('bundle', 'description', e.target.value)}
            />
          </div>
          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">Bundle Price ($)</label>
              <input 
                type="number"
                step="0.01"
                className="form-input"
                placeholder="24.99"
                value={formData.bundle.price}
                onChange={(e) => handleChange('bundle', 'price', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bundle Image URL</label>
              <input 
                className="form-input"
                value={formData.bundle.image}
                onChange={(e) => handleChange('bundle', 'image', e.target.value)}
                placeholder="/assets/images/bundle.jpg"
              />
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="editor-section">
          <h3 className="section-title">
            <span className="section-icon-wrap" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <ImageIcon size={18} />
            </span>
            <span>Brand Story & Heritage</span>
          </h3>
          <div className="form-group">
            <label className="form-label">Section Title</label>
            <input 
              className="form-input"
              placeholder="e.g. From Orchard To Your Kitchen"
              value={formData.story.title}
              onChange={(e) => handleChange('story', 'title', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Subtitle</label>
            <input 
              className="form-input"
              placeholder="e.g. Quality Grown With Care"
              value={formData.story.subtitle}
              onChange={(e) => handleChange('story', 'subtitle', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Story Narrative</label>
            <textarea 
              className="form-textarea"
              rows="3"
              placeholder="Share your farm roots and fresh pledge..."
              value={formData.story.description}
              onChange={(e) => handleChange('story', 'description', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Story Image URL</label>
            <input 
              className="form-input"
              value={formData.story.image}
              onChange={(e) => handleChange('story', 'image', e.target.value)}
              placeholder="https://..."
            />
            {formData.story.image && (
              <img 
                src={formData.story.image} 
                alt="Story Preview" 
                className="image-preview-thumbnail"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
          </div>
        </div>

        {/* Seasonal Section */}
        <div className="editor-section">
          <h3 className="section-title">
            <span className="section-icon-wrap" style={{ background: '#fce7f3', color: '#db2777' }}>
              <Layout size={18} />
            </span>
            <span>Seasonal Favorites Selection</span>
          </h3>

          <div className="form-group">
            <label className="form-label">Section Title</label>
            <input 
              className="form-input"
              placeholder="e.g. Summer Harvest Picks"
              value={formData.seasonal.title}
              onChange={(e) => handleChange('seasonal', 'title', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Featured Products in Carousel ({formData.seasonal.products.length})</label>
            <div className="selected-products-grid">
              {formData.seasonal.products.map(product => (
                <div key={product._id} className="selected-product-card">
                  <img 
                    src={product.image || '/assets/images/products/placeholder.jpg'} 
                    alt={product.name} 
                    className="selected-product-img" 
                    onError={(e) => { e.currentTarget.src = '/assets/images/products/placeholder.jpg'; }}
                  />
                  <div className="selected-product-info">
                    <span className="selected-product-name">{product.name}</span>
                    <button 
                      className="remove-product-btn"
                      onClick={() => handleRemoveProduct(product._id)}
                      title="Remove from seasonal"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {formData.seasonal.products.length === 0 && (
                <div className="no-products-msg" style={{ gridColumn: '1 / -1' }}>
                  No seasonal products chosen yet. Search and add below.
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Add Product to Seasonal</label>
            <div className="product-search-container">
              <div className="input-with-icon">
                <Search size={18} className="input-icon" />
                <input 
                  className="form-input"
                  placeholder="Type product name to add..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
              
              {productSearch && (
                <div className="product-search-results">
                  {allProducts
                    .filter(p => p.name?.toLowerCase().includes(productSearch.toLowerCase()))
                    .slice(0, 6)
                    .map(product => (
                      <div 
                        key={product._id} 
                        className="search-result-item"
                        onClick={() => handleAddProduct(product)}
                      >
                        <img 
                          src={product.image || '/assets/images/products/placeholder.jpg'} 
                          alt={product.name} 
                          onError={(e) => { e.currentTarget.src = '/assets/images/products/placeholder.jpg'; }}
                        />
                        <span>{product.name}</span>
                        <Plus size={16} className="add-icon" />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeEditor;
