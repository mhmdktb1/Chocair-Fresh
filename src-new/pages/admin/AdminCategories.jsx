import { useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import { Plus, Edit2, Trash2, Search, X, Check, XCircle } from "lucide-react";

function AdminCategories() {
  const { categories, addCategory, updateCategory, deleteCategory, loading, error } = useAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    isVisible: true,
    featured: false
  });

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
        image: category.image || "",
        isVisible: category.isVisible !== false,
        featured: category.featured || false
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
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      image: "",
      isVisible: true,
      featured: false
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert("Category name is required");
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory._id, formData);
      } else {
        await addCategory(formData);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Category operation failed:', error);
      alert('Failed to save category');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      await deleteCategory(id);
    }
  };

  return (
    <div>
      {error && (
        <div style={{
          background: '#fdecea',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          padding: '10px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '0.85rem'
        }}>
          Backend error: {error}
        </div>
      )}
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#333', fontWeight: 700 }}>
          Categories Management
        </h2>
        <button
          onClick={() => handleOpenModal()}
          style={{
            background: '#2e7d32',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 600,
            transition: 'all 0.3s ease',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1b5e20';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#2e7d32';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div style={{
        background: '#fff',
        padding: '15px',
        borderRadius: '12px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <Search size={20} color="#666" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '1rem',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Categories Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading categories...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999' }}>
            No categories found.
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div
              key={category._id}
              style={{
                background: '#fff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'transform 0.3s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {/* Image Area */}
              <div style={{
                height: '160px',
                background: '#f5f5f5',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {category.image ? (
                  <img 
                    src={category.image} 
                    alt={category.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#ccc',
                    fontSize: '3rem',
                    fontWeight: 700
                  }}>
                    {category.name.charAt(0)}
                  </div>
                )}
                
                {/* Status Badges */}
                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                  {!category.isVisible && (
                    <span style={{ background: '#f44336', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                      Hidden
                    </span>
                  )}
                  {category.featured && (
                    <span style={{ background: '#ffc107', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                      Featured
                    </span>
                  )}
                </div>
              </div>

              {/* Content Area */}
              <div style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#333' }}>{category.name}</h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#666', minHeight: '40px' }}>
                  {category.description || "No description provided."}
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleOpenModal(category)}
                    style={{
                      flex: 1,
                      background: '#1976d2',
                      color: '#fff',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category._id, category.name)}
                    style={{
                      flex: 1,
                      background: '#f44336',
                      color: '#fff',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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
              maxWidth: '500px',
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
            >
              <X size={20} />
            </button>

            <h2 style={{ margin: '0 0 25px 0', fontSize: '1.5rem', color: '#333', fontWeight: 700 }}>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                  Image URL
                </label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="/assets/images/categories/..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
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
                    onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontWeight: 600, color: '#333' }}>Visible</span>
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
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontWeight: 600, color: '#333' }}>Featured</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: '#2e7d32',
                    color: '#fff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                >
                  {editingCategory ? "Update Category" : "Add Category"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    flex: 1,
                    background: '#f5f5f5',
                    color: '#333',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
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
