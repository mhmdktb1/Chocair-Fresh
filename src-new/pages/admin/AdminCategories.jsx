import { useState, useMemo } from "react";
import { useAdmin } from "../../context/AdminContext";
import { getAssetUrl } from "../../utils/api";
import ImageUploadPicker from "../../components/admin/ImageUploadPicker";
import { Plus, Edit2, Trash2, Search, X, Grid3x3, Check, AlertCircle } from "lucide-react";
import './AdminComponents.css';

function AdminCategories() {
  const { categories, addCategory, updateCategory, deleteCategory, loading, error } = useAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    isVisible: true,
    featured: false,
    subCategories: []
  });
  const [subCatInput, setSubCatInput] = useState("");

  const filteredCategories = useMemo(() => {
    return categories.filter(c =>
      !searchQuery.trim() || 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (c.subCategories && c.subCategories.some(s => s.toLowerCase().includes(searchQuery.toLowerCase().trim())))
    );
  }, [categories, searchQuery]);

  const handleOpenModal = (category = null) => {
    setSubCatInput("");
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || "",
        description: category.description || "",
        image: category.image || "",
        isVisible: category.isVisible !== false,
        featured: category.featured || false,
        subCategories: Array.isArray(category.subCategories) ? [...category.subCategories] : []
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
        image: "",
        isVisible: true,
        featured: false,
        subCategories: []
      });
    }
    setShowModal(true);
  };

  const handleAddSubCategory = (e) => {
    if (e) e.preventDefault();
    const clean = subCatInput.trim();
    if (!clean) return;
    if (formData.subCategories.some(s => s.toLowerCase() === clean.toLowerCase())) {
      setSubCatInput("");
      return;
    }
    setFormData(prev => ({
      ...prev,
      subCategories: [...prev.subCategories, clean]
    }));
    setSubCatInput("");
  };

  const handleRemoveSubCategory = (subCatToRemove) => {
    setFormData(prev => ({
      ...prev,
      subCategories: prev.subCategories.filter(s => s !== subCatToRemove)
    }));
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Category name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingCategory) {
        await updateCategory(editingCategory._id, formData);
      } else {
        await addCategory(formData);
      }
      handleCloseModal();
    } catch (err) {
      console.error('Category operation failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete category "${name}"? Products in this category will become uncategorized.`)) {
      try {
        await deleteCategory(id);
      } catch (err) {
        console.error('Delete category failed:', err);
      }
    }
  };

  return (
    <div className="admin-categories-page">
      {/* Top Header */}
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h2>Store Categories</h2>
          <p className="admin-page-subtitle">
            {filteredCategories.length} categories configured
          </p>
        </div>
        <button className="admin-primary-btn" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Floating Action Button (Mobile) */}
      <button 
        className="admin-fab" 
        onClick={() => handleOpenModal()} 
        aria-label="Add new category"
      >
        <Plus size={24} />
      </button>

      {/* Search Bar */}
      <div className="admin-search-filter-card">
        <div className="admin-search-input-wrap">
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery("")}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Error alert */}
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

      {/* Categories Grid */}
      <div className="admin-categories-list">
        {loading && categories.length === 0 ? (
          <div className="admin-empty-state">
            <Grid3x3 size={40} color="#cbd5e1" />
            <h4>Loading categories...</h4>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="admin-empty-state" style={{ gridColumn: '1 / -1' }}>
            <Grid3x3 size={40} color="#cbd5e1" />
            <h4>No categories found</h4>
            <p>Tap "Add Category" to create your first store section.</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category._id} className="admin-category-card">
              {/* Image or initial */}
              {category.image ? (
                <img 
                  src={getAssetUrl(category.image)} 
                  alt={category.name}
                  className="category-card-image"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className="category-card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem', color: '#16a34a', background: '#f0fdf4' }}>
                  {category.name?.charAt(0) || 'C'}
                </div>
              )}

              <div className="category-card-content">
                <h3 className="category-card-name">{category.name}</h3>
                <span className={`category-visibility-badge ${category.isVisible !== false ? 'visibility-active' : 'visibility-hidden'}`}>
                  {category.isVisible !== false ? '● Visible in Store' : '○ Hidden'}
                </span>
                {Array.isArray(category.subCategories) && category.subCategories.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    {category.subCategories.map((sub, i) => (
                      <span 
                        key={i} 
                        style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="product-card-actions">
                <button
                  className="product-mini-btn"
                  onClick={() => handleOpenModal(category)}
                  title="Edit Category"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  className="product-mini-btn btn-delete"
                  onClick={() => handleDelete(category._id, category.name)}
                  title="Delete Category"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="admin-modal-backdrop" onClick={handleCloseModal}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingCategory ? "Edit Category" : "Add New Category"}</h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Category Name *</label>
                  <input
                    type="text"
                    required
                    className="admin-form-input"
                    placeholder="e.g. Fresh Fruits"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Description</label>
                  <textarea
                    className="admin-form-textarea"
                    rows="2"
                    placeholder="Brief summary of items in this category..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Subcategories Management */}
                <div className="admin-form-group">
                  <label className="admin-form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Subcategories / Types</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>
                      {formData.subCategories.length} added
                    </span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. Apples, Grapes, Citrus..."
                      value={subCatInput}
                      onChange={(e) => setSubCatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubCategory();
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSubCategory}
                      className="admin-secondary-btn"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                    >
                      <Plus size={15} /> Add
                    </button>
                  </div>

                  {formData.subCategories.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      {formData.subCategories.map((sub, idx) => (
                        <span 
                          key={idx}
                          style={{
                            background: '#e0f2fe',
                            color: '#0369a1',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '20px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid #bae6fd'
                          }}
                        >
                          {sub}
                          <button
                            type="button"
                            onClick={() => handleRemoveSubCategory(sub)}
                            style={{ background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', padding: 0, display: 'flex' }}
                            title={`Remove ${sub}`}
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 0 2px' }}>
                      💡 Tip: Add subcategories like "Apples", "Grapes", "Citrus" to organize large produce selections.
                    </p>
                  )}
                </div>

                <ImageUploadPicker
                  value={formData.image}
                  onChange={(newUrl) => setFormData({ ...formData, image: newUrl })}
                  label="Category Image (Camera or Gallery)"
                  fallbackPlaceholder="/assets/images/categories/placeholder.jpg"
                />

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
                    id="catVisibleCheck"
                    checked={formData.isVisible}
                    onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#16a34a' }}
                  />
                  <label htmlFor="catVisibleCheck" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                    Show category to customers on shop menu
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
                  {isSubmitting ? "Saving..." : editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCategories;
