import { useState, useMemo } from "react";
import { useAdmin } from "../../context/AdminContext";
import { useCMS } from "../../context/CMSContext";
import { ALLOWED_UNITS, normalizeUnit, formatUnitRate } from "../../utils/unitHelper";
import { getAssetUrl } from "../../utils/api";
import ImageUploadPicker from "../../components/admin/ImageUploadPicker";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X, 
  Star, 
  Package, 
  Check, 
  AlertCircle,
  Tag
} from "lucide-react";
import './AdminComponents.css';

function AdminProducts() {
  const { products, categories, addProduct, updateProduct, deleteProduct, loading, error } = useAdmin();
  const { pricingRules, calculatePrice } = useCMS();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    categories: [],
    price: "",
    priceUnit: "1kg",
    unit: "1kg",
    stock: "",
    image: "",
    featured: false,
    description: "",
    customPrices: {},
    discountActive: false,
    discountType: "percentage",
    discountValue: "",
    discountStartDate: "",
    discountEndDate: ""
  });

  // Filter products by search query and category
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const catName = categories.find(c => c._id === p.category)?.name || p.category || "";
      const matchesSearch = !searchQuery.trim() || 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        catName.toLowerCase().includes(searchQuery.toLowerCase().trim());

      const matchesCat = selectedCategoryFilter === "all" || 
        p.category === selectedCategoryFilter || 
        catName.toLowerCase() === selectedCategoryFilter.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [products, categories, searchQuery, selectedCategoryFilter]);

  // Live discount preview calculation
  const previewDiscount = useMemo(() => {
    const base = parseFloat(formData.price);
    const val = parseFloat(formData.discountValue);
    if (!formData.discountActive || isNaN(base) || base <= 0 || isNaN(val) || val <= 0) {
      return null;
    }
    let savings = 0;
    let final = base;
    let pct = 0;
    if (formData.discountType === 'fixed') {
      savings = Math.min(base, Math.max(0, val));
      final = Math.max(0, base - savings);
      pct = base > 0 ? Math.round((savings / base) * 100) : 0;
    } else {
      pct = Math.min(100, Math.max(0, val));
      savings = (base * pct) / 100;
      final = Math.max(0, base - savings);
      pct = Math.round(pct);
    }
    return {
      original: base,
      final,
      savings,
      pct
    };
  }, [formData.price, formData.discountActive, formData.discountType, formData.discountValue]);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      const normalizedU = normalizeUnit(product.priceUnit || product.unit);
      const basePriceVal = product.originalPrice !== undefined ? product.originalPrice : (product.price !== undefined ? product.price : "");
      
      const dStartDate = product.discount?.startDate 
        ? new Date(product.discount.startDate).toISOString().split('T')[0] 
        : "";
      const dEndDate = product.discount?.endDate 
        ? new Date(product.discount.endDate).toISOString().split('T')[0] 
        : "";

      setFormData({
        name: product.name || "",
        category: product.category || "",
        categories: product.categories?.length ? product.categories : [product.category || ""].filter(Boolean),
        price: basePriceVal !== "" ? String(basePriceVal) : "",
        priceUnit: normalizedU,
        unit: normalizedU,
        stock: product.stock !== undefined ? String(product.stock) : "50",
        image: product.image || "",
        featured: product.featured || false,
        description: product.description || "",
        customPrices: product.customPrices || {},
        discountActive: Boolean(product.discount?.isActive),
        discountType: product.discount?.type || "percentage",
        discountValue: product.discount?.value !== undefined && product.discount?.value > 0 ? String(product.discount.value) : "",
        discountStartDate: dStartDate,
        discountEndDate: dEndDate
      });
    } else {
      setEditingProduct(null);
      const defaultCat = categories.length > 0 ? categories[0].name : "";
      setFormData({
        name: "",
        category: defaultCat,
        categories: defaultCat ? [defaultCat] : [],
        price: "",
        priceUnit: "1kg",
        unit: "1kg",
        stock: "50",
        image: "",
        featured: false,
        description: "",
        customPrices: {},
        discountActive: false,
        discountType: "percentage",
        discountValue: "",
        discountStartDate: "",
        discountEndDate: ""
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleCategoryToggle = (categoryName) => {
    const newCategories = formData.categories.includes(categoryName)
      ? formData.categories.filter(c => c !== categoryName)
      : [...formData.categories, categoryName];
    
    setFormData({ 
      ...formData, 
      categories: newCategories, 
      category: newCategories[0] || categoryName || "" 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.price || formData.stock === '') {
      alert("Please fill product name, price, and stock count.");
      return;
    }

    const selectedCat = formData.category || formData.categories[0] || (categories[0] ? categories[0].name : "General");
    const chosenUnit = normalizeUnit(formData.unit || formData.priceUnit);

    const productData = {
      name: formData.name.trim(),
      category: selectedCat,
      categories: formData.categories.length > 0 ? formData.categories : [selectedCat],
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
      priceUnit: chosenUnit,
      unit: chosenUnit,
      featured: formData.featured || false,
      description: formData.description || '',
      image: formData.image.trim() || '/assets/images/products/placeholder.jpg',
      discount: {
        isActive: Boolean(formData.discountActive),
        type: formData.discountType || 'percentage',
        value: parseFloat(formData.discountValue) || 0,
        startDate: formData.discountStartDate ? formData.discountStartDate : null,
        endDate: formData.discountEndDate ? formData.discountEndDate : null
      }
    };

    try {
      setIsSubmitting(true);
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await addProduct(productData);
      }
      handleCloseModal();
    } catch (err) {
      console.error('Product save failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete product "${name}"? This cannot be undone.`)) {
      try {
        await deleteProduct(id);
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  return (
    <div className="admin-products-page">
      {/* Top Header */}
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h2>Product Inventory</h2>
          <p className="admin-page-subtitle">
            {filteredProducts.length} of {products.length} products listed
          </p>
        </div>
        <button className="admin-primary-btn" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Floating Action Button (Mobile) */}
      <button 
        className="admin-fab" 
        onClick={() => handleOpenModal()} 
        aria-label="Add new product"
        title="Add Product"
      >
        <Plus size={24} />
      </button>

      {/* Search & Category Filter Card */}
      <div className="admin-search-filter-card">
        <div className="admin-search-input-wrap">
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="Search products by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery("")}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="admin-filter-scroll-row">
          <button
            className={`filter-pill ${selectedCategoryFilter === "all" ? "active" : ""}`}
            onClick={() => setSelectedCategoryFilter("all")}
          >
            <span>All Categories</span>
            <span className="filter-pill-count">{products.length}</span>
          </button>
          {categories.map((cat) => {
            const count = products.filter(p => p.category === cat.name || p.category === cat._id).length;
            return (
              <button
                key={cat._id || cat.name}
                className={`filter-pill ${selectedCategoryFilter === cat.name ? "active" : ""}`}
                onClick={() => setSelectedCategoryFilter(cat.name)}
              >
                <span>{cat.name}</span>
                <span className="filter-pill-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          padding: '0.65rem 1rem',
          borderRadius: '10px',
          marginBottom: '1rem',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Mobile-First Products Cards List */}
      <div className="admin-products-list">
        {loading && products.length === 0 ? (
          <div className="admin-empty-state">
            <Package size={40} color="#cbd5e1" />
            <h4>Loading products...</h4>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="admin-empty-state" style={{ gridColumn: '1 / -1' }}>
            <Package size={40} color="#cbd5e1" />
            <h4>No products found</h4>
            <p>Try searching for a different keyword or tap "Add Product" to add a new item.</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const catDisplay = categories.find(c => c._id === product.category)?.name || product.category || 'General';
            const isLowStock = product.stock <= 10;
            const isOutOfStock = product.stock <= 0;

            return (
              <div key={product.id} className="admin-product-card">
                {/* Product Thumbnail */}
                <img
                  src={getAssetUrl(product.image) || '/assets/images/products/placeholder.jpg'}
                  alt={product.name}
                  className="product-card-thumbnail"
                  onError={(e) => { e.currentTarget.src = '/assets/images/products/placeholder.jpg'; }}
                />

                {/* Details */}
                <div className="product-card-details">
                  <h3 className="product-card-title">{product.name}</h3>
                  <span className="product-card-category-tag">{catDisplay}</span>

                  <div className="product-card-metrics">
                    <span className="product-price-pill">
                      ${Number(product.finalPrice !== undefined ? product.finalPrice : product.price || 0).toFixed(2)}
                      {product.isDiscounted && Number(product.originalPrice) > Number(product.finalPrice || product.price) && (
                        <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.78rem', marginLeft: 4 }}>
                          ${Number(product.originalPrice).toFixed(2)}
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>/{normalizeUnit(product.priceUnit || product.unit)}</span>
                    </span>

                    {product.isDiscounted && (
                      <span style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3
                      }}>
                        <Tag size={10} /> -{product.discountPercent}%
                      </span>
                    )}

                    <span className={`product-stock-pill ${isOutOfStock || isLowStock ? 'stock-low' : 'stock-in'}`}>
                      {isOutOfStock ? 'Out of stock' : isLowStock ? `Low: ${product.stock}` : `${product.stock} in stock`}
                    </span>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="product-card-actions">
                  <button
                    className="product-mini-btn"
                    onClick={() => handleOpenModal(product)}
                    title="Edit Product"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    className="product-mini-btn btn-delete"
                    onClick={() => handleDelete(product.id, product.name)}
                    title="Delete Product"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Product Slide-Up Sheet / Modal */}
      {showModal && (
        <div className="admin-modal-backdrop" onClick={handleCloseModal}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="admin-modal-body">
                {/* Product Name */}
                <div className="admin-form-group">
                  <label className="admin-form-label">Product Name *</label>
                  <input
                    type="text"
                    required
                    className="admin-form-input"
                    placeholder="e.g. Fresh Red Apples"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Category Selection Chips */}
                <div className="admin-form-group">
                  <label className="admin-form-label">Category *</label>
                  <div className="category-chips-grid">
                    {categories.map((cat) => {
                      const isSelected = formData.categories.includes(cat.name) || formData.category === cat.name;
                      return (
                        <button
                          type="button"
                          key={cat._id || cat.name}
                          className={`category-chip ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleCategoryToggle(cat.name)}
                        >
                          {isSelected && <Check size={12} style={{ marginRight: 4, display: 'inline' }} />}
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pricing & Unit Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="admin-form-input"
                      placeholder="e.g. 3.50"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Per Unit *</label>
                    <select
                      className="admin-form-select"
                      value={formData.priceUnit}
                      onChange={(e) => setFormData({ ...formData, priceUnit: e.target.value, unit: e.target.value })}
                    >
                      <option value="1kg">1kg (Per Kilogram)</option>
                      <option value="500g">500g (Per 500 grams)</option>
                      <option value="200g">200g (Per 200 grams)</option>
                      <option value="bunch">bunch (Per Bunch)</option>
                      <option value="piece">piece (Per Piece)</option>
                      <option value="pack">pack (Per Pack)</option>
                    </select>
                  </div>
                </div>

                {/* Stock Count */}
                <div className="admin-form-group">
                  <label className="admin-form-label">Available Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    className="admin-form-input"
                    placeholder="e.g. 50"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>

                {/* Image Upload / Camera / Gallery / URL */}
                <ImageUploadPicker
                  value={formData.image}
                  onChange={(newUrl) => setFormData({ ...formData, image: newUrl })}
                  label="Product Image (Camera or Gallery)"
                  fallbackPlaceholder="/assets/images/products/placeholder.jpg"
                />

                {/* Product Discount & Promotion Section */}
                <div style={{
                  background: formData.discountActive ? '#f0fdf4' : '#f8fafc',
                  border: formData.discountActive ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label htmlFor="productDiscountActiveCheck" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: formData.discountActive ? '#15803d' : '#334155' }}>
                      <Tag size={16} color={formData.discountActive ? '#16a34a' : '#64748b'} />
                      <span>Product Discount / Special Offer</span>
                    </label>
                    <input
                      type="checkbox"
                      id="productDiscountActiveCheck"
                      checked={formData.discountActive}
                      onChange={(e) => setFormData({ ...formData, discountActive: e.target.checked })}
                      style={{ width: 20, height: 20, cursor: 'pointer', accentColor: '#16a34a' }}
                    />
                  </div>

                  {formData.discountActive && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {/* Discount Type and Value Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label className="admin-form-label" style={{ fontSize: '0.8rem' }}>Discount Type *</label>
                          <select
                            className="admin-form-select"
                            value={formData.discountType}
                            onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                            style={{ fontSize: '0.85rem' }}
                          >
                            <option value="percentage">Percentage Off (%)</option>
                            <option value="fixed">Fixed Amount Off ($)</option>
                          </select>
                        </div>

                        <div>
                          <label className="admin-form-label" style={{ fontSize: '0.8rem' }}>
                            {formData.discountType === 'percentage' ? 'Discount Percentage (%) *' : 'Discount Amount ($) *'}
                          </label>
                          <input
                            type="number"
                            step={formData.discountType === 'percentage' ? '1' : '0.01'}
                            min="0"
                            max={formData.discountType === 'percentage' ? '100' : undefined}
                            className="admin-form-input"
                            placeholder={formData.discountType === 'percentage' ? 'e.g. 20 (for 20%)' : 'e.g. 1.00 (for $1.00 off)'}
                            value={formData.discountValue}
                            onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                            style={{ fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>

                      {/* Date Range Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label className="admin-form-label" style={{ fontSize: '0.8rem' }}>Start Date (Optional)</label>
                          <input
                            type="date"
                            className="admin-form-input"
                            value={formData.discountStartDate}
                            onChange={(e) => setFormData({ ...formData, discountStartDate: e.target.value })}
                            style={{ fontSize: '0.85rem' }}
                          />
                        </div>

                        <div>
                          <label className="admin-form-label" style={{ fontSize: '0.8rem' }}>End Date (Optional)</label>
                          <input
                            type="date"
                            className="admin-form-input"
                            value={formData.discountEndDate}
                            onChange={(e) => setFormData({ ...formData, discountEndDate: e.target.value })}
                            style={{ fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>

                      {/* Real-time Calculation Summary Box */}
                      {previewDiscount && (
                        <div style={{
                          background: '#ffffff',
                          border: '1px dashed #86efac',
                          borderRadius: '8px',
                          padding: '0.65rem 0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.82rem'
                        }}>
                          <div>
                            <span style={{ color: '#64748b' }}>Original: </span>
                            <span style={{ textDecoration: 'line-through', fontWeight: 600, color: '#94a3b8' }}>${previewDiscount.original.toFixed(2)}</span>
                            <span style={{ margin: '0 6px', color: '#cbd5e1' }}>→</span>
                            <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.95rem' }}>${previewDiscount.final.toFixed(2)}</span>
                            <span style={{ color: '#64748b', fontSize: '0.78rem' }}> /{formData.priceUnit}</span>
                          </div>
                          <span style={{
                            background: '#dcfce7',
                            color: '#15803d',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem'
                          }}>
                            Save ${previewDiscount.savings.toFixed(2)} ({previewDiscount.pct}%)
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Featured Toggle */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.65rem', 
                  padding: '0.65rem', 
                  background: '#f8fafc', 
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0'
                }}>
                  <input
                    type="checkbox"
                    id="featuredProductCheck"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#16a34a' }}
                  />
                  <label htmlFor="featuredProductCheck" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={15} fill={formData.featured ? '#eab308' : 'none'} color={formData.featured ? '#eab308' : '#94a3b8'} />
                    Feature this product on homepage
                  </label>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button 
                  type="button" 
                  className="admin-modal-btn btn-cancel" 
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="admin-modal-btn btn-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
