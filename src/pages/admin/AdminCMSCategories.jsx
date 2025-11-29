import { useState, useCallback } from "react";
import { useCMS } from "../../context/CMSContext";
import { Plus, Edit, Trash2, Eye, EyeOff, Star, X, Save, Image as ImageIcon } from "lucide-react";

function AdminCategories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCMS();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    isVisible: true,
    featured: false
  });

  const handleOpenModal = useCallback((category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        image: category.image,
        isVisible: category.isVisible,
        featured: category.featured
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
        image: "",
        isVisible: true,
        featured: false
      });
    }
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingCategory(null);
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description) {
      alert("Please fill in all required fields");
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, formData);
      alert("✅ Category updated successfully!");
    } else {
      addCategory(formData);
      alert("✅ Category added successfully!");
    }
    
    handleCloseModal();
  }, [formData, editingCategory, addCategory, updateCategory, handleCloseModal]);

  const handleDelete = useCallback((id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" category?\n\nNote: This won't delete the products in this category.`)) {
      deleteCategory(id);
      alert("🗑️ Category deleted successfully!");
    }
  }, [deleteCategory]);

  const handleToggleVisibility = useCallback((category) => {
    updateCategory(category.id, { isVisible: !category.isVisible });
  }, [updateCategory]);

  const handleToggleFeatured = useCallback((category) => {
    updateCategory(category.id, { featured: !category.featured });
  }, [updateCategory]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
  const visibleCategories = sortedCategories.filter(cat => cat.isVisible);
  const hiddenCategories = sortedCategories.filter(cat => !cat.isVisible);
  const featuredCategories = sortedCategories.filter(cat => cat.featured);

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#333', fontWeight: 700 }}>
            Categories Management
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '1rem' }}>
            Manage product categories and organization
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: '#2e7d32',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#1b5e20'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#2e7d32'}
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {/* Statistics */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #2e7d32'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#2e7d32', marginBottom: '5px' }}>
            {categories.length}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>
            Total Categories
          </div>
        </div>

        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #2196F3'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#2196F3', marginBottom: '5px' }}>
            {visibleCategories.length}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>
            Visible on Site
          </div>
        </div>

        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #ff9800'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ff9800', marginBottom: '5px' }}>
            {featuredCategories.length}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>
            Featured
          </div>
        </div>

        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #f44336'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f44336', marginBottom: '5px' }}>
            {hiddenCategories.length}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>
            Hidden
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {sortedCategories.map((category) => (
          <div
            key={category.id}
            style={{
              background: '#fff',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: category.featured ? '3px solid #ff9800' : '2px solid #e0e0e0',
              opacity: category.isVisible ? 1 : 0.6,
              position: 'relative',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Category Image */}
            <div style={{
              width: '100%',
              height: '180px',
              background: category.image 
                ? `url(${category.image})` 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              {!category.image && (
                <ImageIcon size={48} color="#fff" style={{ opacity: 0.5 }} />
              )}
              
              {/* Badges */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                display: 'flex',
                gap: '6px'
              }}>
                {category.featured && (
                  <div style={{
                    background: '#ff9800',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Star size={12} fill="#fff" />
                    FEATURED
                  </div>
                )}
                <div style={{
                  background: category.isVisible ? '#2e7d32' : '#f44336',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {category.isVisible ? 'VISIBLE' : 'HIDDEN'}
                </div>
              </div>
            </div>

            {/* Category Info */}
            <div style={{ padding: '18px' }}>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '1.3rem',
                fontWeight: 700,
                color: '#333'
              }}>
                {category.name}
              </h3>
              <p style={{ 
                margin: '0 0 12px 0', 
                fontSize: '0.9rem',
                color: '#666',
                lineHeight: '1.5'
              }}>
                {category.description}
              </p>

              <div style={{
                fontSize: '0.85rem',
                color: '#999',
                marginBottom: '12px'
              }}>
                <strong>Slug:</strong> {category.slug} • <strong>Order:</strong> #{category.order}
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px'
              }}>
                <button
                  onClick={() => handleToggleVisibility(category)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    background: category.isVisible ? '#ff9800' : '#2e7d32',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  {category.isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  {category.isVisible ? 'Hide' : 'Show'}
                </button>

                <button
                  onClick={() => handleToggleFeatured(category)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    background: category.featured ? '#9c27b0' : '#607d8b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Star size={16} fill={category.featured ? '#fff' : 'none'} />
                  {category.featured ? 'Unfeature' : 'Feature'}
                </button>

                <button
                  onClick={() => handleOpenModal(category)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    background: '#2196F3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1976D2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#2196F3'}
                >
                  <Edit size={16} />
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(category.id, category.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    background: '#f44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#d32f2f'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f44336'}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#999',
          fontSize: '1.1rem'
        }}>
          No categories yet. Click "Add Category" to create your first one.
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
            animation: 'fadeIn 0.3s ease'
          }}
          onClick={handleCloseModal}
        >
          <style>
            {`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes slideUp {
                from { 
                  opacity: 0;
                  transform: translateY(30px) scale(0.95); 
                }
                to { 
                  opacity: 1;
                  transform: translateY(0) scale(1); 
                }
              }
            `}
          </style>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '30px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'slideUp 0.3s ease'
            }}
          >
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: '#f5f5f5',
                border: 'none',
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f44336';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f5f5f5';
                e.currentTarget.style.color = '#000';
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ margin: '0 0 25px 0', fontSize: '1.5rem', color: '#333', fontWeight: 700 }}>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  placeholder="e.g., Fresh Fruits"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border 0.3s ease',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2e7d32'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
                  placeholder="e.g., Fresh seasonal fruits delivered daily"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border 0.3s ease',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2e7d32'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                  Category Image URL
                </label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => handleInputChange('image', e.target.value)}
                  placeholder="/assets/images/categories/fruits.jpg"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border 0.3s ease',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2e7d32'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
                {formData.image && (
                  <div style={{ marginTop: '10px' }}>
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '10px',
                        border: '2px solid #e0e0e0'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.isVisible}
                    onChange={(e) => handleInputChange('isVisible', e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontWeight: 600, color: '#333' }}>
                    Visible on Website
                  </span>
                </label>

                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontWeight: 600, color: '#333' }}>
                    Featured Category
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#2e7d32',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1b5e20'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#2e7d32'}
                >
                  <Save size={20} />
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#f5f5f5',
                    color: '#333',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f5'}
                >
                  Cancel
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
