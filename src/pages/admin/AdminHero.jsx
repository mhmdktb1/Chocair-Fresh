import { useState, useCallback } from "react";
import { useCMS } from "../../context/CMSContext";
import { Plus, Edit, Trash2, Eye, EyeOff, MoveUp, MoveDown, X, Save } from "lucide-react";

function AdminHero() {
  const { heroSlides, addHeroSlide, updateHeroSlide, deleteHeroSlide } = useCMS();
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    backgroundImage: "",
    ctaText: "Shop Now",
    ctaLink: "/products",
    isActive: true
  });

  const handleOpenModal = useCallback((slide = null) => {
    if (slide) {
      setEditingSlide(slide);
      setFormData({
        title: slide.title,
        subtitle: slide.subtitle,
        backgroundImage: slide.backgroundImage,
        ctaText: slide.ctaText,
        ctaLink: slide.ctaLink,
        isActive: slide.isActive
      });
    } else {
      setEditingSlide(null);
      setFormData({
        title: "",
        subtitle: "",
        backgroundImage: "",
        ctaText: "Shop Now",
        ctaLink: "/products",
        isActive: true
      });
    }
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingSlide(null);
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.subtitle) {
      alert("Please fill in all required fields");
      return;
    }

    if (editingSlide) {
      updateHeroSlide(editingSlide.id, formData);
      alert("✅ Hero slide updated successfully!");
    } else {
      addHeroSlide(formData);
      alert("✅ Hero slide added successfully!");
    }
    
    handleCloseModal();
  }, [formData, editingSlide, addHeroSlide, updateHeroSlide, handleCloseModal]);

  const handleDelete = useCallback((id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteHeroSlide(id);
      alert("🗑️ Hero slide deleted successfully!");
    }
  }, [deleteHeroSlide]);

  const handleToggleActive = useCallback((slide) => {
    updateHeroSlide(slide.id, { isActive: !slide.isActive });
  }, [updateHeroSlide]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const sortedSlides = [...heroSlides].sort((a, b) => a.order - b.order);

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
            Hero & Banners
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '1rem' }}>
            Manage homepage hero sections and banner slides
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
          Add Hero Slide
        </button>
      </div>

      {/* Hero Slides Grid */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
        gap: '24px'
      }}>
        {sortedSlides.map((slide) => (
          <div
            key={slide.id}
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              border: slide.isActive ? '2px solid #2e7d32' : '2px solid #e0e0e0',
              position: 'relative',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Background Image Preview */}
            <div style={{
              width: '100%',
              height: '200px',
              background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${slide.backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: slide.isActive ? '#2e7d32' : '#f44336',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {slide.isActive ? 'ACTIVE' : 'INACTIVE'}
              </div>
              <h3 style={{ 
                color: '#fff', 
                margin: '0 0 8px 0', 
                fontSize: '1.3rem',
                fontWeight: 700,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}>
                {slide.title}
              </h3>
              <p style={{ 
                color: '#fff', 
                margin: '0 0 12px 0', 
                fontSize: '0.9rem',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}>
                {slide.subtitle}
              </p>
              <button style={{
                background: '#fff',
                color: '#333',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'default'
              }}>
                {slide.ctaText}
              </button>
            </div>

            {/* Slide Info */}
            <div style={{ padding: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  <strong>Order:</strong> #{slide.order}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  <strong>Link:</strong> {slide.ctaLink}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '8px',
                marginTop: '12px'
              }}>
                <button
                  onClick={() => handleToggleActive(slide)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    background: slide.isActive ? '#ff9800' : '#2e7d32',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  {slide.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                  {slide.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleOpenModal(slide)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    background: '#2196F3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
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
                  onClick={() => handleDelete(slide.id, slide.title)}
                  style={{
                    padding: '10px 14px',
                    background: '#f44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#d32f2f'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f44336'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedSlides.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#999',
          fontSize: '1.1rem'
        }}>
          No hero slides yet. Click "Add Hero Slide" to create your first banner.
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
              {editingSlide ? 'Edit Hero Slide' : 'Add New Hero Slide'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  placeholder="e.g., Fresh Groceries Delivered"
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
                  Subtitle *
                </label>
                <textarea
                  value={formData.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                  required
                  placeholder="e.g., Get the freshest products delivered within hours"
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
                  Background Image URL
                </label>
                <input
                  type="text"
                  value={formData.backgroundImage}
                  onChange={(e) => handleInputChange('backgroundImage', e.target.value)}
                  placeholder="/assets/images/hero-bg.jpg"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) => handleInputChange('ctaText', e.target.value)}
                    placeholder="Shop Now"
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

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                    CTA Link
                  </label>
                  <input
                    type="text"
                    value={formData.ctaLink}
                    onChange={(e) => handleInputChange('ctaLink', e.target.value)}
                    placeholder="/products"
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
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontWeight: 600, color: '#333' }}>
                    Active (visible on website)
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
                  {editingSlide ? 'Update Slide' : 'Add Slide'}
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

export default AdminHero;
