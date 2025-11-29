import { useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import { useCMS } from "../../context/CMSContext";
import { Plus, Edit2, Trash2, Search, X, Star } from "lucide-react";

function AdminProducts() {
  const { products, addProduct, updateProduct, deleteProduct, loading, error, refreshProducts } = useAdmin();
  const { categories, pricingRules, calculatePrice } = useCMS();
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "fruits",
    categories: [],
    price: "",
    priceUnit: "kg",
    unit: "kg",
    stock: "",
    image: "",
    featured: false,
    customPrices: {}
  });

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        categories: product.categories || [product.category],
        price: product.price,
        priceUnit: product.priceUnit || "kg",
        unit: product.unit || "kg",
        stock: product.stock,
        image: product.image,
        featured: product.featured || false,
        customPrices: product.customPrices || {}
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        category: "fruits",
        categories: [],
        price: "",
        priceUnit: "kg",
        unit: "kg",
        stock: "",
        image: "",
        featured: false,
        customPrices: {}
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      category: "fruits",
      categories: [],
      price: "",
      priceUnit: "kg",
      unit: "kg",
      stock: "",
      image: "",
      featured: false,
      customPrices: {}
    });
  };

  const handleCategoryToggle = (categorySlug) => {
    const newCategories = formData.categories.includes(categorySlug)
      ? formData.categories.filter(c => c !== categorySlug)
      : [...formData.categories, categorySlug];
    
    setFormData({ ...formData, categories: newCategories, category: newCategories[0] || "fruits" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || formData.stock === '' || formData.categories.length === 0) {
      alert("Please fill all required fields (name, price, stock, and at least one category)");
      return;
    }

    const productData = {
      name: formData.name,
      category: formData.category || formData.categories[0],
      categories: formData.categories.length > 0 ? formData.categories : [formData.category],
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      priceUnit: formData.priceUnit || 'kg',
      unit: formData.unit || 'kg',
      featured: formData.featured || false,
      description: '' // Optional but include it
    };

    // Only include image if it's a valid URL or path
    if (formData.image && formData.image.trim()) {
      // Check if it's a valid URL or starts with /
      if (formData.image.startsWith('http') || formData.image.startsWith('/')) {
        productData.image = formData.image;
      } else {
        productData.image = `/assets/images/products/${formData.image}`;
      }
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await addProduct(productData);
      }
      handleCloseModal();
    } catch (error) {
      // Error is already handled by AdminContext and shown in the error banner
      console.error('Product operation failed:', error);
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteProduct(id);
    }
  };

  return (
    <div>
      {/* DEV MODE / Backend status banner */}
      <div style={{
        background: '#fff3cd',
        border: '1px solid #ffeeba',
        color: '#856404',
        padding: '10px 16px',
        borderRadius: '8px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>⚠️ Dev Mode: Authentication bypassed. Backend products {loading ? 'loading…' : products.length === 0 ? 'empty or unreachable.' : `loaded (${products.length}).`}</span>
        <button onClick={refreshProducts} style={{
          background: '#2e7d32',
          color: '#fff',
          border: 'none',
          padding: '6px 14px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: 600
        }}>Reload</button>
      </div>

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
          Products Management
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
          Add Product
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
          placeholder="Search products by name or category..."
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

      {/* Products Table */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.95rem'
          }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 600, color: '#333' }}>Image</th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 600, color: '#333' }}>Name</th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 600, color: '#333' }}>Category</th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 600, color: '#333' }}>Price</th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 600, color: '#333' }}>Stock</th>
                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 600, color: '#333' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    Loading products…
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                    No products found. {error ? 'Backend may be offline.' : 'Add a product to get started.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '15px' }}>
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{
                          width: '50px',
                          height: '50px',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                      />
                    </td>
                    <td style={{ padding: '15px', fontWeight: 600, color: '#333' }}>{product.name}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{
                        background: '#e8f5e9',
                        color: '#2e7d32',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 500
                      }}>
                        {product.category}
                      </span>
                    </td>
                    <td style={{ padding: '15px', fontWeight: 600, color: '#2e7d32' }}>
                      ${product.price.toFixed(2)}
                    </td>
                    <td style={{ padding: '15px', color: product.stock < 30 ? '#f44336' : '#333' }}>
                      {product.stock} units
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenModal(product)}
                          style={{
                            background: '#1976d2',
                            color: '#fff',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.85rem',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#1565c0'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#1976d2'}
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          style={{
                            background: '#f44336',
                            color: '#fff',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.85rem',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#d32f2f'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#f44336'}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                  Product Name *
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
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#2e7d32'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                />
              </div>

              {/* Multi-Category Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                  Categories * (Select one or more)
                </label>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  background: '#fafafa'
                }}>
                  {categories.filter(cat => cat.isVisible).map(category => (
                    <label
                      key={category.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        background: formData.categories.includes(category.slug) ? '#2e7d32' : '#fff',
                        color: formData.categories.includes(category.slug) ? '#fff' : '#333',
                        border: '2px solid ' + (formData.categories.includes(category.slug) ? '#2e7d32' : '#e0e0e0'),
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        userSelect: 'none'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category.slug)}
                        onChange={() => handleCategoryToggle(category.slug)}
                        style={{ display: 'none' }}
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
                {formData.categories.length === 0 && (
                  <div style={{ color: '#f44336', fontSize: '0.85rem', marginTop: '6px' }}>
                    Please select at least one category
                  </div>
                )}
              </div>

              {/* Advanced Pricing Section */}
              <div style={{ 
                background: '#f0f7f1', 
                padding: '16px', 
                borderRadius: '10px', 
                marginBottom: '20px',
                border: '2px solid #c8e6c9'
              }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#2e7d32', fontWeight: 700 }}>
                  💰 Pricing Configuration
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                      Base Price ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        outline: 'none',
                        transition: 'border-color 0.3s ease',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#2e7d32'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                      Price Per *
                    </label>
                    <select
                      value={formData.priceUnit}
                      onChange={(e) => setFormData({ ...formData, priceUnit: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      {pricingRules.availableUnits.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Auto-calculated prices preview */}
                {formData.price && formData.priceUnit && (
                  <div style={{
                    background: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600, marginBottom: '8px' }}>
                      📊 Auto-Calculated Prices:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                      {pricingRules.availableUnits.filter(u => u.base).map(unit => {
                        const calculatedPrice = calculatePrice(parseFloat(formData.price), formData.priceUnit, unit.value);
                        return (
                          <div key={unit.value} style={{ fontSize: '0.85rem', color: '#2e7d32', fontWeight: 600 }}>
                            {unit.label}: ${calculatedPrice}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                    Display Unit *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  >
                    {pricingRules.availableUnits.map(unit => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                    Stock *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'border-color 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#2e7d32'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                  Image URL
                </label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="/assets/images/products/..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#2e7d32'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                />
              </div>

              {/* Featured Product Toggle */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  padding: '12px',
                  background: formData.featured ? '#fff3cd' : '#f5f5f5',
                  borderRadius: '8px',
                  border: '2px solid ' + (formData.featured ? '#ffc107' : '#e0e0e0')
                }}>
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer'
                    }}
                  />
                  <Star 
                    size={20} 
                    fill={formData.featured ? '#ffc107' : 'none'} 
                    color={formData.featured ? '#ffc107' : '#666'}
                  />
                  <span style={{ fontWeight: 600, color: '#333' }}>
                    Featured Product (shown on homepage)
                  </span>
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
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1b5e20'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#2e7d32'}
                >
                  {editingProduct ? "Update Product" : "Add Product"}
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

export default AdminProducts;
