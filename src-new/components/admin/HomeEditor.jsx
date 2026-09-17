import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { 
  Save, 
  Image as ImageIcon, 
  Type, 
  Layout, 
  Search, 
  X, 
  Plus, 
  Sparkles, 
  Gift, 
  Flame, 
  ExternalLink,
  CheckCircle2,
  Sliders,
  Shield,
  Truck,
  Leaf,
  Clock,
  Award,
  Mail,
  BookOpen,
  ChevronRight,
  Eye
} from 'lucide-react';
import './HomeEditor.css';

const HomeEditor = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');
  const [allProducts, setAllProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');

  const [formData, setFormData] = useState({
    hero: { 
      title: 'FRESHER. CLEANER. BETTER.', 
      subtitle: 'Carefully selected fresh produce, every day.', 
      backgroundImage: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1200&q=80',
      badge: '',
      badgeIcon: '',
      ctaText: 'Shop Now',
      ctaLink: '/shop',
      secondaryText: 'Explore Produce',
      secondaryLink: '/shop',
      accentTag: '',
      ratingText: '',
      theme: 'emerald',
      stats: [
        { label: 'Happy Customers', value: '20k+' },
        { label: 'Fresh Products', value: '500+' },
        { label: 'Fast Delivery', value: '24h' }
      ]
    },
    promos: {
      enabled: true,
      boxCard: {
        badge: 'Hot Offer',
        discountTag: 'Save 25%',
        title: 'Weekly Organic Harvest Box',
        description: 'Freshly harvested local vegetables & berries',
        ctaText: 'Shop Box',
        ctaLink: '/shop?category=Organic',
        emoji: '🥗'
      },
      couponCard: {
        badge: 'New Customer',
        discountTag: '$10 OFF',
        title: 'Use Code at Checkout',
        description: 'Valid on your first order over $35',
        code: 'FRESH30',
        emoji: '🎟️'
      }
    },
    bundle: { 
      enabled: true,
      title: 'Organic Summer Berry Bundle', 
      description: 'Get a curated selection of our freshest strawberries, blueberries, and raspberries. Perfect for smoothies, desserts, or healthy snacking.', 
      price: 29.99, 
      originalPrice: 45.00,
      saveAmount: 'Save $15.01',
      claimedPercentage: 84,
      stockLeftText: 'Only 16 bundles left',
      image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1000&q=80',
      link: '/shop?discount=true'
    },
    story: { 
      enabled: true,
      title: 'Cultivating Goodness', 
      subtitle: 'Fresh from the farm, straight to your table.', 
      description: 'Chocair Fresh started with a simple mission: bridging the gap between local farmers and your kitchen. We believe everyone deserves authentic, chemical-free produce.', 
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      yearsOfService: '15+'
    },
    features: {
      enabled: true,
      pillText: 'Key Benefits',
      title: 'Why Choose Us',
      items: [
        { title: '100% Organic', description: 'Certified organic produce sourced directly from sustainable local farms.', icon: 'Leaf', color: '#2ecc71' },
        { title: 'Fast Delivery', description: 'Same-day delivery for orders placed before 2 PM. Freshness guaranteed.', icon: 'Truck', color: '#3498db' },
        { title: 'Quality Check', description: 'Every item is hand-picked and quality checked before it reaches your door.', icon: 'ShieldCheck', color: '#9b59b6' },
        { title: '24/7 Support', description: 'Our dedicated support team is always here to help you with your needs.', icon: 'Clock', color: '#e67e22' }
      ]
    },
    newsletter: {
      enabled: true,
      badge: 'Join The Club',
      title: 'Get Fresh Updates',
      description: 'Subscribe to our newsletter and get 10% off your first order. Plus, receive weekly healthy recipes and exclusive deals.'
    },
    seasonal: { 
      title: 'Seasonal Favorites', 
      subtitle: 'Picked at the peak of flavor this season',
      products: [] 
    },
    featuredCategories: []
  });

  useEffect(() => {
    fetchSettings();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products?limit=1000');
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
        setFormData(prev => ({
          ...prev,
          ...data,
          hero: {
            ...prev.hero,
            ...(data.hero || {}),
            stats: (data.hero?.stats && data.hero.stats.length === 3) 
              ? data.hero.stats 
              : prev.hero.stats
          },
          promos: {
            ...prev.promos,
            ...(data.promos || {}),
            boxCard: { ...prev.promos.boxCard, ...(data.promos?.boxCard || {}) },
            couponCard: { ...prev.promos.couponCard, ...(data.promos?.couponCard || {}) }
          },
          bundle: {
            ...prev.bundle,
            ...(data.bundle || {})
          },
          story: {
            ...prev.story,
            ...(data.story || {})
          },
          features: {
            ...prev.features,
            ...(data.features || {}),
            items: (data.features?.items && data.features.items.length > 0)
              ? data.features.items
              : prev.features.items
          },
          newsletter: {
            ...prev.newsletter,
            ...(data.newsletter || {})
          },
          seasonal: {
            ...prev.seasonal,
            ...(data.seasonal || {}),
            products: data.seasonal?.products || []
          }
        }));
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load home settings");
      setLoading(false);
    }
  };

  const handleDeepChange = (pathArray, value) => {
    setFormData(prev => {
      const updated = { ...prev };
      let cur = updated;
      for (let i = 0; i < pathArray.length - 1; i++) {
        cur[pathArray[i]] = { ...cur[pathArray[i]] };
        cur = cur[pathArray[i]];
      }
      cur[pathArray[pathArray.length - 1]] = value;
      return updated;
    });
  };

  const handleStatChange = (index, field, value) => {
    const newStats = [...formData.hero.stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      hero: { ...prev.hero, stats: newStats }
    }));
  };

  const handleFeatureItemChange = (index, field, value) => {
    const newItems = [...formData.features.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      features: { ...prev.features, items: newItems }
    }));
  };

  const handleAddProduct = (product) => {
    if (formData.seasonal.products?.some(p => (p._id || p.id) === (product._id || product.id))) {
      toast.info("Product is already in the seasonal list");
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      seasonal: {
        ...prev.seasonal,
        products: [...(prev.seasonal.products || []), product]
      }
    }));
    setProductSearch('');
    toast.success(`Added ${product.name} to seasonal list`);
  };

  const handleRemoveProduct = (productId) => {
    setFormData(prev => ({
      ...prev,
      seasonal: {
        ...prev.seasonal,
        products: prev.seasonal.products.filter(p => (p._id || p.id) !== productId)
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/home-config', formData);
      localStorage.setItem('homeConfigCache', JSON.stringify(formData));
      toast.success("Homepage CMS updated and published successfully!");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update homepage");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-empty-state">
        <Layout size={40} color="#cbd5e1" />
        <h4>Loading store CMS configurations...</h4>
      </div>
    );
  }

  const tabs = [
    { id: 'hero', label: 'Hero & Banner', icon: Layout },
    { id: 'promos', label: 'Promo Banners & Coupon', icon: Gift },
    { id: 'bundle', label: 'Flash Deal & Bundle', icon: Flame },
    { id: 'seasonal', label: 'Seasonal Curated Picks', icon: Sparkles },
    { id: 'story', label: 'Brand Story', icon: BookOpen },
    { id: 'features', label: 'Store Benefits', icon: Award },
    { id: 'newsletter', label: 'Newsletter Bar', icon: Mail }
  ];

  return (
    <div className="home-editor-container">
      {/* CMS Top Header */}
      <div className="editor-header">
        <div>
          <h2 className="editor-title">Storefront Content Management (CMS)</h2>
          <p className="editor-subtitle">
            Configure live homepage content, promotional banners, deals, and recommendations in real-time.
          </p>
        </div>
        <div className="editor-header-actions">
          <a 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="preview-store-btn"
            title="Open live storefront in new tab"
          >
            <Eye size={16} />
            <span>View Live Store</span>
          </a>
          <button 
            onClick={handleSave} 
            className="save-btn"
            disabled={saving}
          >
            <Save size={18} />
            <span>{saving ? 'Saving...' : 'Publish Changes'}</span>
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="cms-tabs-bar" role="tablist">
        {tabs.map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`cms-tab-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={isActive}
            >
              <IconComp size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      
      <div className="editor-content">
        
        {/* ==================================================== */}
        {/* TAB 1: HERO & BANNER */}
        {/* ==================================================== */}
        {activeTab === 'hero' && (
          <div className="editor-section animate-fade-in">
            <h3 className="section-title">
              <span className="section-icon-wrap" style={{ background: '#ecfdf5', color: '#10b981' }}>
                <Layout size={18} />
              </span>
              <span>Hero Showcase & Trust Strip</span>
            </h3>

            <div className="grid-2-col">
              <div className="form-group">
                <label className="form-label">Top Pill Badge Text</label>
                <input 
                  className="form-input"
                  placeholder="e.g. 100% Organic & Farm Fresh"
                  value={formData.hero.badge || ''}
                  onChange={(e) => handleDeepChange(['hero', 'badge'], e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Badge Icon</label>
                <select 
                  className="form-input"
                  value={formData.hero.badgeIcon || 'sparkle'}
                  onChange={(e) => handleDeepChange(['hero', 'badgeIcon'], e.target.value)}
                >
                  <option value="sparkle">✨ Sparkle</option>
                  <option value="zap">⚡ Zap / Lightning</option>
                  <option value="truck">🚚 Delivery Truck</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Main Headline Title</label>
              <input 
                className="form-input"
                placeholder="e.g. Handpicked Nature, Straight to Your Door"
                value={formData.hero.title || ''}
                onChange={(e) => handleDeepChange(['hero', 'title'], e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sub-headline Description</label>
              <textarea 
                className="form-textarea"
                rows="2"
                placeholder="Crisp organic vegetables, luscious seasonal fruits..."
                value={formData.hero.subtitle || ''}
                onChange={(e) => handleDeepChange(['hero', 'subtitle'], e.target.value)}
              />
            </div>

            <div className="grid-2-col">
              <div className="form-group">
                <label className="form-label">Primary CTA Button Text</label>
                <input 
                  className="form-input"
                  placeholder="Shop Daily Harvest"
                  value={formData.hero.ctaText || ''}
                  onChange={(e) => handleDeepChange(['hero', 'ctaText'], e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Primary CTA Link</label>
                <input 
                  className="form-input"
                  placeholder="/shop"
                  value={formData.hero.ctaLink || ''}
                  onChange={(e) => handleDeepChange(['hero', 'ctaLink'], e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2-col">
              <div className="form-group">
                <label className="form-label">Secondary Button Text</label>
                <input 
                  className="form-input"
                  placeholder="Explore Categories"
                  value={formData.hero.secondaryText || ''}
                  onChange={(e) => handleDeepChange(['hero', 'secondaryText'], e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Secondary Button Link</label>
                <input 
                  className="form-input"
                  placeholder="/shop"
                  value={formData.hero.secondaryLink || ''}
                  onChange={(e) => handleDeepChange(['hero', 'secondaryLink'], e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2-col">
              <div className="form-group">
                <label className="form-label">Floating Image Accent Tag</label>
                <input 
                  className="form-input"
                  placeholder="⚡ Delivered in 25–35 mins"
                  value={formData.hero.accentTag || ''}
                  onChange={(e) => handleDeepChange(['hero', 'accentTag'], e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rating Trust Text</label>
                <input 
                  className="form-input"
                  placeholder="4.9 ★ (2.5k+ Reviews)"
                  value={formData.hero.ratingText || ''}
                  onChange={(e) => handleDeepChange(['hero', 'ratingText'], e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Hero Feature Image URL</label>
              <input 
                className="form-input"
                value={formData.hero.backgroundImage || ''}
                onChange={(e) => handleDeepChange(['hero', 'backgroundImage'], e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
              {formData.hero.backgroundImage && (
                <div className="image-preview-wrapper">
                  <img 
                    src={formData.hero.backgroundImage} 
                    alt="Hero Banner Preview" 
                    className="image-preview-thumbnail"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Trust Highlights / Stats Bar (3 items)</label>
              <div className="stats-grid">
                {formData.hero.stats.map((stat, index) => (
                  <div key={index} className="stat-card">
                    <input 
                      className="form-input stat-input-val"
                      placeholder="Value (e.g. 20k+)"
                      value={stat.value || ''}
                      onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                    />
                    <input 
                      className="form-input stat-input-label"
                      placeholder="Label (e.g. Happy Users)"
                      value={stat.label || ''}
                      onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: PROMO CARDS & COUPON */}
        {/* ==================================================== */}
        {activeTab === 'promos' && (
          <div className="editor-section animate-fade-in">
            <div className="section-title-with-toggle">
              <h3 className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                <span className="section-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <Gift size={18} />
                </span>
                <span>Promotional Twin Banners & Coupon</span>
              </h3>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={formData.promos?.enabled !== false} 
                  onChange={(e) => handleDeepChange(['promos', 'enabled'], e.target.checked)} 
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="promo-cards-editor-grid">
              {/* Card 1 */}
              <div className="promo-editor-card">
                <div className="card-editor-tag">Card 1: Promotional Harvest Box</div>
                
                <div className="grid-2-col">
                  <div className="form-group">
                    <label className="form-label">Badge Text</label>
                    <input 
                      className="form-input" 
                      value={formData.promos.boxCard.badge || ''}
                      onChange={(e) => handleDeepChange(['promos', 'boxCard', 'badge'], e.target.value)}
                      placeholder="Hot Offer"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Discount Tag</label>
                    <input 
                      className="form-input" 
                      value={formData.promos.boxCard.discountTag || ''}
                      onChange={(e) => handleDeepChange(['promos', 'boxCard', 'discountTag'], e.target.value)}
                      placeholder="Save 25%"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Card Title</label>
                  <input 
                    className="form-input" 
                    value={formData.promos.boxCard.title || ''}
                    onChange={(e) => handleDeepChange(['promos', 'boxCard', 'title'], e.target.value)}
                    placeholder="Weekly Organic Harvest Box"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Card Subtitle / Description</label>
                  <input 
                    className="form-input" 
                    value={formData.promos.boxCard.description || ''}
                    onChange={(e) => handleDeepChange(['promos', 'boxCard', 'description'], e.target.value)}
                    placeholder="Freshly harvested local vegetables & berries"
                  />
                </div>

                <div className="grid-2-col">
                  <div className="form-group">
                    <label className="form-label">CTA Text</label>
                    <input 
                      className="form-input" 
                      value={formData.promos.boxCard.ctaText || ''}
                      onChange={(e) => handleDeepChange(['promos', 'boxCard', 'ctaText'], e.target.value)}
                      placeholder="Shop Box"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CTA Destination Link</label>
                    <input 
                      className="form-input" 
                      value={formData.promos.boxCard.ctaLink || ''}
                      onChange={(e) => handleDeepChange(['promos', 'boxCard', 'ctaLink'], e.target.value)}
                      placeholder="/shop?category=Organic"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Graphic Emoji</label>
                  <input 
                    className="form-input" 
                    value={formData.promos.boxCard.emoji || '🥗'}
                    onChange={(e) => handleDeepChange(['promos', 'boxCard', 'emoji'], e.target.value)}
                    placeholder="🥗"
                  />
                </div>
              </div>

              {/* Card 2 */}
              <div className="promo-editor-card">
                <div className="card-editor-tag">Card 2: 1-Tap Coupon Voucher</div>
                
                <div className="grid-2-col">
                  <div className="form-group">
                    <label className="form-label">Badge Text</label>
                    <input 
                      className="form-input" 
                      value={formData.promos.couponCard.badge || ''}
                      onChange={(e) => handleDeepChange(['promos', 'couponCard', 'badge'], e.target.value)}
                      placeholder="New Customer"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Discount Tag</label>
                    <input 
                      className="form-input" 
                      value={formData.promos.couponCard.discountTag || ''}
                      onChange={(e) => handleDeepChange(['promos', 'couponCard', 'discountTag'], e.target.value)}
                      placeholder="$10 OFF"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Coupon Code (1-Tap Copy)</label>
                  <input 
                    className="form-input code-input" 
                    value={formData.promos.couponCard.code || ''}
                    onChange={(e) => handleDeepChange(['promos', 'couponCard', 'code'], e.target.value.toUpperCase())}
                    placeholder="FRESH30"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input 
                    className="form-input" 
                    value={formData.promos.couponCard.title || ''}
                    onChange={(e) => handleDeepChange(['promos', 'couponCard', 'title'], e.target.value)}
                    placeholder="Use Code at Checkout"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Validity Note / Description</label>
                  <input 
                    className="form-input" 
                    value={formData.promos.couponCard.description || ''}
                    onChange={(e) => handleDeepChange(['promos', 'couponCard', 'description'], e.target.value)}
                    placeholder="Valid on your first order over $35"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Graphic Emoji</label>
                  <input 
                    className="form-input" 
                    value={formData.promos.couponCard.emoji || '🎟️'}
                    onChange={(e) => handleDeepChange(['promos', 'couponCard', 'emoji'], e.target.value)}
                    placeholder="🎟️"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: FLASH DEAL & BUNDLE */}
        {/* ==================================================== */}
        {activeTab === 'bundle' && (
          <div className="editor-section animate-fade-in">
            <div className="section-title-with-toggle">
              <h3 className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                <span className="section-icon-wrap" style={{ background: '#ffedd5', color: '#ea580c' }}>
                  <Flame size={18} />
                </span>
                <span>Flash Deal & Bundle Box</span>
              </h3>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={formData.bundle?.enabled !== false} 
                  onChange={(e) => handleDeepChange(['bundle', 'enabled'], e.target.checked)} 
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Deal Title</label>
              <input 
                className="form-input"
                placeholder="e.g. Organic Summer Berry Bundle"
                value={formData.bundle.title || ''}
                onChange={(e) => handleDeepChange(['bundle', 'title'], e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea 
                className="form-textarea"
                rows="2"
                placeholder="Get a curated selection of our freshest strawberries, blueberries, and raspberries..."
                value={formData.bundle.description || ''}
                onChange={(e) => handleDeepChange(['bundle', 'description'], e.target.value)}
              />
            </div>

            <div className="grid-3-col">
              <div className="form-group">
                <label className="form-label">Sale Price ($)</label>
                <input 
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="29.99"
                  value={formData.bundle.price || ''}
                  onChange={(e) => handleDeepChange(['bundle', 'price'], Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Original Price ($)</label>
                <input 
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="45.00"
                  value={formData.bundle.originalPrice || ''}
                  onChange={(e) => handleDeepChange(['bundle', 'originalPrice'], Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Save Amount Pill</label>
                <input 
                  className="form-input"
                  placeholder="Save $15.01"
                  value={formData.bundle.saveAmount || ''}
                  onChange={(e) => handleDeepChange(['bundle', 'saveAmount'], e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2-col">
              <div className="form-group">
                <label className="form-label">Claimed Percentage (Progress Bar %)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  placeholder="84"
                  value={formData.bundle.claimedPercentage || 84}
                  onChange={(e) => handleDeepChange(['bundle', 'claimedPercentage'], Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Stock Left Status Text</label>
                <input 
                  className="form-input"
                  placeholder="Only 16 bundles left"
                  value={formData.bundle.stockLeftText || ''}
                  onChange={(e) => handleDeepChange(['bundle', 'stockLeftText'], e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2-col">
              <div className="form-group">
                <label className="form-label">Bundle Image URL</label>
                <input 
                  className="form-input"
                  value={formData.bundle.image || ''}
                  onChange={(e) => handleDeepChange(['bundle', 'image'], e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Claim Button Destination Link</label>
                <input 
                  className="form-input"
                  value={formData.bundle.link || ''}
                  onChange={(e) => handleDeepChange(['bundle', 'link'], e.target.value)}
                  placeholder="/shop?discount=true"
                />
              </div>
            </div>

            {formData.bundle.image && (
              <div className="image-preview-wrapper">
                <img 
                  src={formData.bundle.image} 
                  alt="Bundle Preview" 
                  className="image-preview-thumbnail"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: SEASONAL CURATED PICKS */}
        {/* ==================================================== */}
        {activeTab === 'seasonal' && (
          <div className="editor-section animate-fade-in">
            <h3 className="section-title">
              <span className="section-icon-wrap" style={{ background: '#fce7f3', color: '#db2777' }}>
                <Sparkles size={18} />
              </span>
              <span>Seasonal Harvest Curated Picks</span>
            </h3>

            <div className="form-group">
              <label className="form-label">Section Row Title</label>
              <input 
                className="form-input"
                placeholder="e.g. Seasonal Harvest Picks"
                value={formData.seasonal.title || ''}
                onChange={(e) => handleDeepChange(['seasonal', 'title'], e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Curated Products in Row ({formData.seasonal.products?.length || 0})
              </label>
              
              <div className="selected-products-grid">
                {formData.seasonal.products?.map(product => (
                  <div key={product._id || product.id} className="selected-product-card">
                    <img 
                      src={product.image || '/assets/images/products/placeholder.jpg'} 
                      alt={product.name} 
                      className="selected-product-img" 
                      onError={(e) => { e.currentTarget.src = '/assets/images/products/placeholder.jpg'; }}
                    />
                    <div className="selected-product-info">
                      <span className="selected-product-name">{product.name}</span>
                      <button 
                        type="button"
                        className="remove-product-btn"
                        onClick={() => handleRemoveProduct(product._id || product.id)}
                        title="Remove from seasonal row"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {(!formData.seasonal.products || formData.seasonal.products.length === 0) && (
                  <div className="no-products-msg" style={{ gridColumn: '1 / -1' }}>
                    No seasonal products selected yet. Search and add products below.
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Add Product to Seasonal Row</label>
              <div className="product-search-container">
                <div className="input-with-icon">
                  <Search size={18} className="input-icon" />
                  <input 
                    className="form-input search-box-clean"
                    placeholder="Search product by name to add..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
                
                {productSearch && (
                  <div className="product-search-results">
                    {allProducts
                      .filter(p => p.name?.toLowerCase().includes(productSearch.toLowerCase()))
                      .slice(0, 8)
                      .map(product => (
                        <div 
                          key={product._id || product.id} 
                          className="search-result-item"
                          onClick={() => handleAddProduct(product)}
                        >
                          <img 
                            src={product.image || '/assets/images/products/placeholder.jpg'} 
                            alt={product.name} 
                            onError={(e) => { e.currentTarget.src = '/assets/images/products/placeholder.jpg'; }}
                          />
                          <div className="search-result-text">
                            <span className="search-result-name">{product.name}</span>
                            <span className="search-result-price">${Number(product.price || 0).toFixed(2)} / {product.unit || 'kg'}</span>
                          </div>
                          <Plus size={16} className="add-icon" />
                        </div>
                      ))}
                    {allProducts.filter(p => p.name?.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                      <div className="search-no-results">No matching products found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: BRAND STORY */}
        {/* ==================================================== */}
        {activeTab === 'story' && (
          <div className="editor-section animate-fade-in">
            <div className="section-title-with-toggle">
              <h3 className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                <span className="section-icon-wrap" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                  <BookOpen size={18} />
                </span>
                <span>Brand Story & Heritage (About Section)</span>
              </h3>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={formData.story?.enabled !== false} 
                  onChange={(e) => handleDeepChange(['story', 'enabled'], e.target.checked)} 
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="grid-2-col">
              <div className="form-group">
                <label className="form-label">Headline Title</label>
                <input 
                  className="form-input"
                  placeholder="e.g. Cultivating Goodness"
                  value={formData.story.title || ''}
                  onChange={(e) => handleDeepChange(['story', 'title'], e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Experience Badge (e.g. 15+)</label>
                <input 
                  className="form-input"
                  placeholder="15+"
                  value={formData.story.yearsOfService || '15+'}
                  onChange={(e) => handleDeepChange(['story', 'yearsOfService'], e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Subtitle</label>
              <input 
                className="form-input"
                placeholder="e.g. Fresh from the farm, straight to your table."
                value={formData.story.subtitle || ''}
                onChange={(e) => handleDeepChange(['story', 'subtitle'], e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Story Narrative</label>
              <textarea 
                className="form-textarea"
                rows="4"
                placeholder="Share your farm roots and fresh pledge..."
                value={formData.story.description || ''}
                onChange={(e) => handleDeepChange(['story', 'description'], e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Story Image URL</label>
              <input 
                className="form-input"
                value={formData.story.image || ''}
                onChange={(e) => handleDeepChange(['story', 'image'], e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
              {formData.story.image && (
                <div className="image-preview-wrapper">
                  <img 
                    src={formData.story.image} 
                    alt="Story Preview" 
                    className="image-preview-thumbnail"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: STORE BENEFITS / FEATURES */}
        {/* ==================================================== */}
        {activeTab === 'features' && (
          <div className="editor-section animate-fade-in">
            <div className="section-title-with-toggle">
              <h3 className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                <span className="section-icon-wrap" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                  <Award size={18} />
                </span>
                <span>Store Key Benefits & Value Props</span>
              </h3>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={formData.features?.enabled !== false} 
                  onChange={(e) => handleDeepChange(['features', 'enabled'], e.target.checked)} 
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="grid-2-col">
              <div className="form-group">
                <label className="form-label">Header Pill</label>
                <input 
                  className="form-input"
                  placeholder="Key Benefits"
                  value={formData.features.pillText || 'Key Benefits'}
                  onChange={(e) => handleDeepChange(['features', 'pillText'], e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Section Title</label>
                <input 
                  className="form-input"
                  placeholder="Why Choose Us"
                  value={formData.features.title || 'Why Choose Us'}
                  onChange={(e) => handleDeepChange(['features', 'title'], e.target.value)}
                />
              </div>
            </div>

            <div className="feature-cards-editor-grid">
              {formData.features.items?.map((item, index) => (
                <div key={index} className="feature-edit-box">
                  <div className="feature-box-header">
                    <span>Card {index + 1}</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input 
                      className="form-input"
                      value={item.title || ''}
                      onChange={(e) => handleFeatureItemChange(index, 'title', e.target.value)}
                      placeholder="e.g. 100% Organic"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea 
                      className="form-textarea"
                      rows="2"
                      value={item.description || ''}
                      onChange={(e) => handleFeatureItemChange(index, 'description', e.target.value)}
                      placeholder="Short feature description..."
                    />
                  </div>
                  <div className="grid-2-col">
                    <div className="form-group">
                      <label className="form-label">Icon</label>
                      <select 
                        className="form-input"
                        value={item.icon || 'Leaf'}
                        onChange={(e) => handleFeatureItemChange(index, 'icon', e.target.value)}
                      >
                        <option value="Leaf">🌿 Leaf / Organic</option>
                        <option value="Truck">🚚 Truck / Delivery</option>
                        <option value="ShieldCheck">🛡️ Shield / Quality</option>
                        <option value="Clock">⏰ Clock / 24/7</option>
                        <option value="Award">🏆 Award / Best</option>
                        <option value="Heart">❤️ Heart / Healthy</option>
                        <option value="Zap">⚡ Zap / Speed</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Accent Color</label>
                      <input 
                        type="color"
                        className="form-input color-picker-input"
                        value={item.color || '#2ecc71'}
                        onChange={(e) => handleFeatureItemChange(index, 'color', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 7: NEWSLETTER BAR */}
        {/* ==================================================== */}
        {activeTab === 'newsletter' && (
          <div className="editor-section animate-fade-in">
            <div className="section-title-with-toggle">
              <h3 className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                <span className="section-icon-wrap" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                  <Mail size={18} />
                </span>
                <span>Newsletter Banner</span>
              </h3>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={formData.newsletter?.enabled !== false} 
                  onChange={(e) => handleDeepChange(['newsletter', 'enabled'], e.target.checked)} 
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Badge Pill</label>
              <input 
                className="form-input"
                placeholder="Join The Club"
                value={formData.newsletter.badge || 'Join The Club'}
                onChange={(e) => handleDeepChange(['newsletter', 'badge'], e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Headline Title</label>
              <input 
                className="form-input"
                placeholder="Get Fresh Updates"
                value={formData.newsletter.title || 'Get Fresh Updates'}
                onChange={(e) => handleDeepChange(['newsletter', 'title'], e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Offer Text</label>
              <textarea 
                className="form-textarea"
                rows="2"
                placeholder="Subscribe to our newsletter and get 10% off your first order..."
                value={formData.newsletter.description || ''}
                onChange={(e) => handleDeepChange(['newsletter', 'description'], e.target.value)}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default HomeEditor;
