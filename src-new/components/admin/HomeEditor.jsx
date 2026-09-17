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
  Eye,
  Trash2,
  EyeOff,
  PlusCircle,
  TrendingUp,
  MessageSquare,
  Star,
  Layers,
  Check,
  Palette
} from 'lucide-react';
import './HomeEditor.css';

const HomeEditor = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('layout');
  const [allProducts, setAllProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    hero: { 
      enabled: true,
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
    categoryMarquee: {
      enabled: true
    },
    featuredCategories: [],
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
    trending: {
      enabled: true,
      title: 'Trending Right Now'
    },
    seasonal: { 
      enabled: true,
      title: 'Seasonal Favorites', 
      subtitle: 'Picked at the peak of flavor this season',
      products: [] 
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
    testimonials: {
      enabled: true,
      title: 'What Our Customers Say'
    },
    newsletter: {
      enabled: true,
      badge: 'Join The Club',
      title: 'Get Fresh Updates',
      description: 'Subscribe to our newsletter and get 10% off your first order. Plus, receive weekly healthy recipes and exclusive deals.'
    },
    comments: {
      enabled: true
    },
    customSections: []
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
            enabled: data.hero?.enabled !== undefined ? data.hero.enabled : true,
            stats: (data.hero?.stats && data.hero.stats.length === 3) 
              ? data.hero.stats 
              : prev.hero.stats
          },
          categoryMarquee: {
            ...prev.categoryMarquee,
            ...(data.categoryMarquee || {}),
            enabled: data.categoryMarquee?.enabled !== undefined ? data.categoryMarquee.enabled : true
          },
          promos: {
            ...prev.promos,
            ...(data.promos || {}),
            enabled: data.promos?.enabled !== undefined ? data.promos.enabled : true,
            boxCard: { ...prev.promos.boxCard, ...(data.promos?.boxCard || {}) },
            couponCard: { ...prev.promos.couponCard, ...(data.promos?.couponCard || {}) }
          },
          trending: {
            ...prev.trending,
            ...(data.trending || {}),
            enabled: data.trending?.enabled !== undefined ? data.trending.enabled : true
          },
          bundle: {
            ...prev.bundle,
            ...(data.bundle || {}),
            enabled: data.bundle?.enabled !== undefined ? data.bundle.enabled : true
          },
          story: {
            ...prev.story,
            ...(data.story || {}),
            enabled: data.story?.enabled !== undefined ? data.story.enabled : true
          },
          features: {
            ...prev.features,
            ...(data.features || {}),
            enabled: data.features?.enabled !== undefined ? data.features.enabled : true,
            items: (data.features?.items && data.features.items.length > 0)
              ? data.features.items
              : prev.features.items
          },
          testimonials: {
            ...prev.testimonials,
            ...(data.testimonials || {}),
            enabled: data.testimonials?.enabled !== undefined ? data.testimonials.enabled : true
          },
          newsletter: {
            ...prev.newsletter,
            ...(data.newsletter || {}),
            enabled: data.newsletter?.enabled !== undefined ? data.newsletter.enabled : true
          },
          comments: {
            ...prev.comments,
            ...(data.comments || {}),
            enabled: data.comments?.enabled !== undefined ? data.comments.enabled : true
          },
          seasonal: {
            ...prev.seasonal,
            ...(data.seasonal || {}),
            enabled: data.seasonal?.enabled !== undefined ? data.seasonal.enabled : true,
            products: data.seasonal?.products || []
          },
          customSections: Array.isArray(data.customSections) ? data.customSections : []
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

  const toggleSectionEnabled = (sectionKey, isEnabled) => {
    setFormData(prev => ({
      ...prev,
      [sectionKey]: {
        ...(prev[sectionKey] || {}),
        enabled: isEnabled !== undefined ? isEnabled : !(prev[sectionKey]?.enabled !== false)
      }
    }));
    const stateStr = isEnabled ? "enabled and added to" : "removed from";
    toast.info(`Section ${sectionKey} ${stateStr} homepage`);
  };

  const removeSection = (sectionKey) => {
    setFormData(prev => ({
      ...prev,
      [sectionKey]: {
        ...(prev[sectionKey] || {}),
        enabled: false
      }
    }));
    toast.warn(`Section removed from homepage storefront. You can re-add it anytime.`);
  };

  const restoreSection = (sectionKey) => {
    setFormData(prev => ({
      ...prev,
      [sectionKey]: {
        ...(prev[sectionKey] || {}),
        enabled: true
      }
    }));
    toast.success(`Section restored to homepage storefront!`);
  };

  const handleAddCustomSection = () => {
    const newSection = {
      id: `custom-${Date.now()}`,
      enabled: true,
      badge: 'Special Feature',
      title: 'Seasonal Organic Special',
      subtitle: 'Experience farm-fresh produce picked at the peak of flavor.',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80',
      ctaText: 'Explore Collection',
      ctaLink: '/shop',
      theme: 'emerald'
    };

    setFormData(prev => ({
      ...prev,
      customSections: [...(prev.customSections || []), newSection]
    }));

    setShowAddModal(false);
    setActiveTab('custom');
    toast.success("New custom promotion section added to homepage!");
  };

  const handleUpdateCustomSection = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      customSections: (prev.customSections || []).map(sec => 
        sec.id === id ? { ...sec, [field]: value } : sec
      )
    }));
  };

  const handleDeleteCustomSection = (id) => {
    setFormData(prev => ({
      ...prev,
      customSections: (prev.customSections || []).filter(sec => sec.id !== id)
    }));
    toast.warn("Custom section permanently removed");
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

  // Master Section Definitions
  const standardSections = [
    { key: 'hero', name: 'Hero Showcase & Slides', desc: 'Main full-bleed header with animated copy & high-res visuals', icon: Layout, tab: 'hero' },
    { key: 'categoryMarquee', name: 'Category Rail & Marquee', desc: 'Top interactive icon rail for quick category browsing', icon: Layers, tab: 'layout' },
    { key: 'promos', name: 'Promo Twin Cards & Coupon', desc: 'Harvest box spotlight and 1-tap copy discount code', icon: Gift, tab: 'promos' },
    { key: 'trending', name: 'Trending Recommendations', desc: 'ML engine & popular product carousel', icon: TrendingUp, tab: 'layout' },
    { key: 'seasonal', name: 'Seasonal Curated Picks', desc: 'Handpicked harvest selections curated by admin', icon: Sparkles, tab: 'seasonal' },
    { key: 'bundle', name: 'Flash Deal & Bundle Box', desc: 'Limited time discounted product bundle with countdown and savings pill', icon: Flame, tab: 'bundle' },
    { key: 'features', name: 'Store Benefits & Value Props', desc: 'Key store pillars (100% Organic, Fast Delivery, Quality Check, 24/7 Support)', icon: Award, tab: 'features' },
    { key: 'story', name: 'Brand Story & Heritage', desc: 'Farm roots, founder pledge, and background story', icon: BookOpen, tab: 'story' },
    { key: 'testimonials', name: 'Customer Testimonials', desc: 'Authentic buyer reviews and ratings showcase', icon: Star, tab: 'layout' },
    { key: 'newsletter', name: 'Newsletter VIP Bar', desc: 'Email subscription box with 10% discount hook', icon: Mail, tab: 'newsletter' },
    { key: 'comments', name: 'Community Discussion', desc: 'Interactive customer feedback and reviews forum', icon: MessageSquare, tab: 'layout' }
  ];

  const tabs = [
    { id: 'layout', label: 'All Sections & Layout', icon: Layers },
    { id: 'hero', label: 'Hero Showcase', icon: Layout },
    { id: 'promos', label: 'Promo Banners & Coupon', icon: Gift },
    { id: 'bundle', label: 'Flash Deal & Bundle', icon: Flame },
    { id: 'seasonal', label: 'Seasonal Curated Picks', icon: Sparkles },
    { id: 'story', label: 'Brand Story', icon: BookOpen },
    { id: 'features', label: 'Store Benefits', icon: Award },
    { id: 'newsletter', label: 'Newsletter Bar', icon: Mail },
    { id: 'custom', label: `Custom Sections (${formData.customSections?.length || 0})`, icon: Palette }
  ];

  // Helper banner inside section editor tabs
  const renderSectionVisibilityHeader = (sectionKey, title, tabIcon = Layout) => {
    const isEnabled = formData[sectionKey]?.enabled !== false;
    const IconComponent = tabIcon;

    return (
      <div className={`section-control-banner ${isEnabled ? 'is-active' : 'is-removed'}`}>
        <div className="section-control-info">
          <div className="section-control-icon-pill">
            <IconComponent size={18} />
          </div>
          <div>
            <div className="section-control-title-row">
              <h3 className="section-control-title">{title}</h3>
              <span className={`status-badge-pill ${isEnabled ? 'live' : 'hidden'}`}>
                {isEnabled ? <Check size={12} /> : <EyeOff size={12} />}
                <span>{isEnabled ? 'Live on Storefront' : 'Hidden / Removed'}</span>
              </span>
            </div>
            <p className="section-control-desc">
              {isEnabled 
                ? 'This section is currently visible to visitors on the live homepage.' 
                : 'This section is currently hidden from the homepage. Turn on to restore.'}
            </p>
          </div>
        </div>

        <div className="section-control-actions">
          {isEnabled ? (
            <button 
              type="button" 
              className="remove-section-action-btn"
              onClick={() => removeSection(sectionKey)}
              title="Remove section completely from homepage"
            >
              <Trash2 size={15} />
              <span>Remove Section</span>
            </button>
          ) : (
            <button 
              type="button" 
              className="restore-section-action-btn"
              onClick={() => restoreSection(sectionKey)}
              title="Add section back to homepage"
            >
              <PlusCircle size={15} />
              <span>Add / Show on Homepage</span>
            </button>
          )}

          <label className="toggle-switch" title="Toggle section visibility">
            <input 
              type="checkbox" 
              checked={isEnabled} 
              onChange={(e) => toggleSectionEnabled(sectionKey, e.target.checked)} 
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="home-editor-container">
      {/* CMS Top Header */}
      <div className="editor-header">
        <div>
          <h2 className="editor-title">Storefront Content & Section Manager (CMS)</h2>
          <p className="editor-subtitle">
            Add, remove, reconfigure, and customize live homepage sections in real time.
          </p>
        </div>
        <div className="editor-header-actions">
          <button
            type="button"
            className="add-section-top-btn"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            <span>Add Section</span>
          </button>
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
        {/* TAB 0: ALL SECTIONS & LAYOUT MASTER OVERVIEW */}
        {/* ==================================================== */}
        {activeTab === 'layout' && (
          <div className="editor-section animate-fade-in">
            <div className="layout-overview-header">
              <div>
                <h3 className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                  <span className="section-icon-wrap" style={{ background: '#ecfdf5', color: '#10b981' }}>
                    <Layers size={18} />
                  </span>
                  <span>Homepage Sections & Architecture</span>
                </h3>
                <p className="layout-overview-subtitle">
                  Manage the active sections displayed on your homepage. Remove any unwanted sections or add new ones.
                </p>
              </div>
              <button 
                type="button" 
                className="add-section-btn-inline"
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={16} />
                <span>+ Add Section</span>
              </button>
            </div>

            <div className="sections-manager-grid">
              {standardSections.map((sec) => {
                const IconComponent = sec.icon;
                const isEnabled = formData[sec.key]?.enabled !== false;

                return (
                  <div key={sec.key} className={`section-manager-card ${isEnabled ? 'is-live' : 'is-hidden'}`}>
                    <div className="sec-card-header">
                      <div className="sec-card-icon-wrap">
                        <IconComponent size={20} />
                      </div>
                      <div className="sec-card-titles">
                        <div className="sec-card-title-row">
                          <h4 className="sec-card-title">{sec.name}</h4>
                          <span className={`status-pill ${isEnabled ? 'live' : 'hidden'}`}>
                            {isEnabled ? 'Active' : 'Removed'}
                          </span>
                        </div>
                        <p className="sec-card-desc">{sec.desc}</p>
                      </div>
                    </div>

                    <div className="sec-card-footer">
                      <div className="sec-card-toggle-wrap">
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={isEnabled} 
                            onChange={(e) => toggleSectionEnabled(sec.key, e.target.checked)} 
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <span className="toggle-label-text">
                          {isEnabled ? 'Shown on Homepage' : 'Hidden'}
                        </span>
                      </div>

                      <div className="sec-card-action-buttons">
                        {sec.tab !== 'layout' && (
                          <button 
                            type="button" 
                            className="sec-btn-edit"
                            onClick={() => setActiveTab(sec.tab)}
                          >
                            <span>Edit Content</span>
                            <ChevronRight size={14} />
                          </button>
                        )}

                        {isEnabled ? (
                          <button 
                            type="button" 
                            className="sec-btn-remove"
                            onClick={() => removeSection(sec.key)}
                            title="Remove section from homepage"
                          >
                            <Trash2 size={14} />
                            <span>Remove</span>
                          </button>
                        ) : (
                          <button 
                            type="button" 
                            className="sec-btn-add"
                            onClick={() => restoreSection(sec.key)}
                            title="Add section to homepage"
                          >
                            <Plus size={14} />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Custom Sections in Layout */}
              {Array.isArray(formData.customSections) && formData.customSections.map((cSec, index) => (
                <div key={cSec.id || index} className={`section-manager-card custom-type ${cSec.enabled !== false ? 'is-live' : 'is-hidden'}`}>
                  <div className="sec-card-header">
                    <div className="sec-card-icon-wrap" style={{ background: '#fdf4ff', color: '#c026d3' }}>
                      <Palette size={20} />
                    </div>
                    <div className="sec-card-titles">
                      <div className="sec-card-title-row">
                        <h4 className="sec-card-title">{cSec.title || `Custom Section ${index + 1}`}</h4>
                        <span className="custom-type-tag">Custom Promo</span>
                        <span className={`status-pill ${cSec.enabled !== false ? 'live' : 'hidden'}`}>
                          {cSec.enabled !== false ? 'Active' : 'Removed'}
                        </span>
                      </div>
                      <p className="sec-card-desc">{cSec.subtitle || 'Custom banner / promotion card'}</p>
                    </div>
                  </div>

                  <div className="sec-card-footer">
                    <div className="sec-card-toggle-wrap">
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={cSec.enabled !== false} 
                          onChange={(e) => handleUpdateCustomSection(cSec.id, 'enabled', e.target.checked)} 
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <span className="toggle-label-text">
                        {cSec.enabled !== false ? 'Shown on Homepage' : 'Hidden'}
                      </span>
                    </div>

                    <div className="sec-card-action-buttons">
                      <button 
                        type="button" 
                        className="sec-btn-edit"
                        onClick={() => setActiveTab('custom')}
                      >
                        <span>Edit</span>
                        <ChevronRight size={14} />
                      </button>
                      <button 
                        type="button" 
                        className="sec-btn-remove"
                        onClick={() => handleDeleteCustomSection(cSec.id)}
                        title="Delete custom section"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="add-section-bottom-card" onClick={() => setShowAddModal(true)}>
              <div className="add-section-circle">
                <Plus size={24} />
              </div>
              <div className="add-section-text">
                <h4>+ Add Another Section</h4>
                <p>Choose from built-in sections or create a brand new custom promotional banner.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* ==================================================== */}
        {/* TAB 1: HERO & BANNER */}
        {/* ==================================================== */}
        {activeTab === 'hero' && (
          <div className="editor-section animate-fade-in">
            {renderSectionVisibilityHeader('hero', 'Hero Showcase & Slides', Layout)}

            <div className="form-group">
              <label className="form-label">Main Headline Title</label>
              <input 
                className="form-input"
                placeholder="e.g. FRESHER. CLEANER. BETTER."
                value={formData.hero.title || ''}
                onChange={(e) => handleDeepChange(['hero', 'title'], e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sub-headline Description</label>
              <textarea 
                className="form-textarea"
                rows="2"
                placeholder="Carefully selected fresh produce, every day."
                value={formData.hero.subtitle || ''}
                onChange={(e) => handleDeepChange(['hero', 'subtitle'], e.target.value)}
              />
            </div>

            <div className="grid-2-col">
              <div className="form-group">
                <label className="form-label">Primary CTA Button Text</label>
                <input 
                  className="form-input"
                  placeholder="Shop Now"
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
                  placeholder="Explore Produce"
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
            {renderSectionVisibilityHeader('promos', 'Promotional Twin Banners & Coupon', Gift)}

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
            {renderSectionVisibilityHeader('bundle', 'Flash Deal & Bundle Box', Flame)}

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
            {renderSectionVisibilityHeader('seasonal', 'Seasonal Harvest Curated Picks', Sparkles)}

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
            {renderSectionVisibilityHeader('story', 'Brand Story & Heritage', BookOpen)}

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
            {renderSectionVisibilityHeader('features', 'Store Key Benefits & Value Props', Award)}

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
            {renderSectionVisibilityHeader('newsletter', 'Newsletter VIP Banner', Mail)}

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

        {/* ==================================================== */}
        {/* TAB 8: CUSTOM SECTIONS */}
        {/* ==================================================== */}
        {activeTab === 'custom' && (
          <div className="editor-section animate-fade-in">
            <div className="section-title-with-toggle">
              <h3 className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                <span className="section-icon-wrap" style={{ background: '#fdf4ff', color: '#c026d3' }}>
                  <Palette size={18} />
                </span>
                <span>Custom Promotional & Content Sections</span>
              </h3>
              <button 
                type="button" 
                className="add-section-top-btn"
                onClick={handleAddCustomSection}
              >
                <Plus size={16} />
                <span>+ Add Custom Section</span>
              </button>
            </div>

            {(!formData.customSections || formData.customSections.length === 0) ? (
              <div className="empty-custom-state">
                <Palette size={36} color="#cbd5e1" />
                <h4>No custom sections yet</h4>
                <p>Create promotional banners, seasonal announcements, or custom content blocks.</p>
                <button 
                  type="button" 
                  className="save-btn" 
                  style={{ background: '#0f172a' }}
                  onClick={handleAddCustomSection}
                >
                  <Plus size={16} />
                  <span>Create First Custom Section</span>
                </button>
              </div>
            ) : (
              <div className="custom-sections-list">
                {formData.customSections.map((sec, idx) => (
                  <div key={sec.id || idx} className="custom-section-card-editor">
                    <div className="custom-sec-header">
                      <div className="custom-sec-title-wrap">
                        <span className="custom-sec-number">Section #{idx + 1}</span>
                        <h4>{sec.title || 'Untitled Custom Section'}</h4>
                      </div>
                      <div className="custom-sec-controls">
                        <label className="toggle-switch" title="Toggle section visibility">
                          <input 
                            type="checkbox" 
                            checked={sec.enabled !== false} 
                            onChange={(e) => handleUpdateCustomSection(sec.id, 'enabled', e.target.checked)} 
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <button 
                          type="button" 
                          className="delete-custom-sec-btn"
                          onClick={() => handleDeleteCustomSection(sec.id)}
                          title="Remove custom section completely"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid-2-col">
                      <div className="form-group">
                        <label className="form-label">Badge Tag (e.g. Special Offer)</label>
                        <input 
                          className="form-input"
                          value={sec.badge || ''}
                          onChange={(e) => handleUpdateCustomSection(sec.id, 'badge', e.target.value)}
                          placeholder="Special Offer"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Color Theme</label>
                        <select 
                          className="form-input"
                          value={sec.theme || 'emerald'}
                          onChange={(e) => handleUpdateCustomSection(sec.id, 'theme', e.target.value)}
                        >
                          <option value="emerald">Emerald Green (Brand)</option>
                          <option value="forest">Deep Forest Green</option>
                          <option value="amber">Warm Amber / Harvest</option>
                          <option value="dark">Modern Dark Slate</option>
                          <option value="light">Clean Soft White</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Section Title</label>
                      <input 
                        className="form-input"
                        value={sec.title || ''}
                        onChange={(e) => handleUpdateCustomSection(sec.id, 'title', e.target.value)}
                        placeholder="Seasonal Organic Special"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Subtitle / Description</label>
                      <textarea 
                        className="form-textarea"
                        rows="2"
                        value={sec.subtitle || ''}
                        onChange={(e) => handleUpdateCustomSection(sec.id, 'subtitle', e.target.value)}
                        placeholder="Experience farm-fresh produce picked at the peak of flavor."
                      />
                    </div>

                    <div className="grid-2-col">
                      <div className="form-group">
                        <label className="form-label">Button Text</label>
                        <input 
                          className="form-input"
                          value={sec.ctaText || ''}
                          onChange={(e) => handleUpdateCustomSection(sec.id, 'ctaText', e.target.value)}
                          placeholder="Explore Collection"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Button Destination URL</label>
                        <input 
                          className="form-input"
                          value={sec.ctaLink || ''}
                          onChange={(e) => handleUpdateCustomSection(sec.id, 'ctaLink', e.target.value)}
                          placeholder="/shop"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Banner Image URL</label>
                      <input 
                        className="form-input"
                        value={sec.image || ''}
                        onChange={(e) => handleUpdateCustomSection(sec.id, 'image', e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                      />
                      {sec.image && (
                        <div className="image-preview-wrapper" style={{ marginTop: '0.5rem' }}>
                          <img 
                            src={sec.image} 
                            alt="Custom Preview" 
                            className="image-preview-thumbnail"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ==================================================== */}
      {/* ADD SECTION MODAL POPUP */}
      {/* ==================================================== */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="add-section-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Add Section to Homepage</h3>
                <p className="modal-subtitle">Choose a built-in storefront block or add a custom promotional banner.</p>
              </div>
              <button 
                type="button" 
                className="close-modal-btn"
                onClick={() => setShowAddModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Option A: Create Custom Promo */}
              <div className="add-modal-section-group">
                <h4 className="group-title">Custom Content</h4>
                <div 
                  className="add-option-card custom-highlight"
                  onClick={handleAddCustomSection}
                >
                  <div className="option-icon-box" style={{ background: '#fdf4ff', color: '#c026d3' }}>
                    <Palette size={22} />
                  </div>
                  <div className="option-info">
                    <h5>+ Create Custom Promotional Banner</h5>
                    <p>Add a new full-width card with custom headline, badge, image, theme, and CTA link.</p>
                  </div>
                  <button type="button" className="option-add-btn">
                    <span>Add</span>
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {/* Option B: Standard Sections */}
              <div className="add-modal-section-group">
                <h4 className="group-title">Storefront Sections</h4>
                <div className="standard-options-grid">
                  {standardSections.map(sec => {
                    const IconComponent = sec.icon;
                    const isEnabled = formData[sec.key]?.enabled !== false;

                    return (
                      <div 
                        key={sec.key} 
                        className={`add-option-card ${isEnabled ? 'already-active' : ''}`}
                        onClick={() => {
                          restoreSection(sec.key);
                          setShowAddModal(false);
                          if (sec.tab !== 'layout') setActiveTab(sec.tab);
                        }}
                      >
                        <div className="option-icon-box">
                          <IconComponent size={20} />
                        </div>
                        <div className="option-info">
                          <h5>{sec.name}</h5>
                          <p>{sec.desc}</p>
                        </div>
                        {isEnabled ? (
                          <span className="already-active-badge">Active</span>
                        ) : (
                          <button type="button" className="option-add-btn">
                            <span>Add</span>
                            <Plus size={15} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="modal-cancel-btn"
                onClick={() => setShowAddModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeEditor;
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
