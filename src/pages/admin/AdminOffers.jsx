import { useState, useCallback } from "react";
import { useCMS } from "../../context/CMSContext";
import { Plus, Edit, Trash2, Tag, X, Save, Calendar, DollarSign, Target } from "lucide-react";

function AdminOffers() {
  const { offers, categories, addOffer, updateOffer, deleteOffer, toggleOfferStatus } = useCMS();
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    target: "sitewide",
    targetId: null,
    startDate: "",
    endDate: "",
    isActive: true,
    minPurchase: 0,
    code: ""
  });

  const handleOpenModal = useCallback((offer = null) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData({
        title: offer.title,
        description: offer.description,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        target: offer.target,
        targetId: offer.targetId,
        startDate: offer.startDate,
        endDate: offer.endDate,
        isActive: offer.isActive,
        minPurchase: offer.minPurchase,
        code: offer.code
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      setEditingOffer(null);
      setFormData({
        title: "",
        description: "",
        discountType: "percentage",
        discountValue: 0,
        target: "sitewide",
        targetId: null,
        startDate: today,
        endDate: nextMonth.toISOString().split('T')[0],
        isActive: true,
        minPurchase: 0,
        code: ""
      });
    }
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingOffer(null);
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.code) {
      alert("Please fill in all required fields");
      return;
    }

    if (formData.discountValue <= 0) {
      alert("Discount value must be greater than 0");
      return;
    }

    if (editingOffer) {
      updateOffer(editingOffer.id, formData);
      alert("✅ Offer updated successfully!");
    } else {
      addOffer(formData);
      alert("✅ Offer added successfully!");
    }
    
    handleCloseModal();
  }, [formData, editingOffer, addOffer, updateOffer, handleCloseModal]);

  const handleDelete = useCallback((id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}" offer?`)) {
      deleteOffer(id);
      alert("🗑️ Offer deleted successfully!");
    }
  }, [deleteOffer]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getOfferStatus = (offer) => {
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);

    if (!offer.isActive) return { label: 'INACTIVE', color: '#9e9e9e' };
    if (now < start) return { label: 'SCHEDULED', color: '#2196F3' };
    if (now > end) return { label: 'EXPIRED', color: '#f44336' };
    return { label: 'ACTIVE', color: '#2e7d32' };
  };

  const getDiscountLabel = (offer) => {
    if (offer.discountType === 'percentage') return `${offer.discountValue}% OFF`;
    if (offer.discountType === 'fixed') return `$${offer.discountValue} OFF`;
    if (offer.discountType === 'bogo') return `BUY ${offer.discountValue + 1} GET 1 FREE`;
    return '';
  };

  const getTargetLabel = (offer) => {
    if (offer.target === 'sitewide') return 'Sitewide';
    if (offer.target === 'category') {
      const cat = categories.find(c => c.id === offer.targetId);
      return cat ? `Category: ${cat.name}` : 'Category';
    }
    if (offer.target === 'product') return 'Specific Product';
    return offer.target;
  };

  const activeOffers = offers.filter(o => o.isActive && new Date(o.endDate) >= new Date());
  const expiredOffers = offers.filter(o => !o.isActive || new Date(o.endDate) < new Date());

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
            Offers & Promotions
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '1rem' }}>
            Create and manage discounts, deals, and promotional campaigns
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
          Create Offer
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
            {offers.length}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>
            Total Offers
          </div>
        </div>

        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #4caf50'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#4caf50', marginBottom: '5px' }}>
            {activeOffers.length}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>
            Active Offers
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
            {expiredOffers.length}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>
            Inactive/Expired
          </div>
        </div>
      </div>

      {/* Offers List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {offers.map((offer) => {
          const status = getOfferStatus(offer);
          const discountLabel = getDiscountLabel(offer);
          const targetLabel = getTargetLabel(offer);

          return (
            <div
              key={offer.id}
              style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: `2px solid ${status.color}`,
                position: 'relative',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                {/* Offer Icon/Badge */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: `linear-gradient(135deg, ${status.color} 0%, ${status.color}dd 100%)`,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Tag size={36} color="#fff" />
                </div>

                {/* Offer Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', color: '#333', fontWeight: 700 }}>
                        {offer.title}
                      </h3>
                      <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#666', lineHeight: '1.5' }}>
                        {offer.description}
                      </p>
                    </div>
                    <div style={{
                      background: status.color,
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      marginLeft: '16px'
                    }}>
                      {status.label}
                    </div>
                  </div>

                  {/* Offer Info Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      background: '#f5f5f5',
                      padding: '12px',
                      borderRadius: '10px'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: '#999', fontWeight: 600, marginBottom: '4px' }}>
                        DISCOUNT
                      </div>
                      <div style={{ fontSize: '1.1rem', color: '#2e7d32', fontWeight: 700 }}>
                        {discountLabel}
                      </div>
                    </div>

                    <div style={{
                      background: '#f5f5f5',
                      padding: '12px',
                      borderRadius: '10px'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: '#999', fontWeight: 600, marginBottom: '4px' }}>
                        TARGET
                      </div>
                      <div style={{ fontSize: '1.1rem', color: '#333', fontWeight: 700 }}>
                        {targetLabel}
                      </div>
                    </div>

                    <div style={{
                      background: '#f5f5f5',
                      padding: '12px',
                      borderRadius: '10px'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: '#999', fontWeight: 600, marginBottom: '4px' }}>
                        PROMO CODE
                      </div>
                      <div style={{ fontSize: '1.1rem', color: '#ff9800', fontWeight: 700 }}>
                        {offer.code}
                      </div>
                    </div>

                    <div style={{
                      background: '#f5f5f5',
                      padding: '12px',
                      borderRadius: '10px'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: '#999', fontWeight: 600, marginBottom: '4px' }}>
                        VALID PERIOD
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#333', fontWeight: 600 }}>
                        {new Date(offer.startDate).toLocaleDateString()} - {new Date(offer.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {offer.minPurchase > 0 && (
                    <div style={{
                      background: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      marginBottom: '12px',
                      fontSize: '0.9rem',
                      color: '#856404',
                      fontWeight: 600
                    }}>
                      💰 Minimum purchase: ${offer.minPurchase.toFixed(2)}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => toggleOfferStatus(offer.id)}
                      style={{
                        padding: '10px 20px',
                        background: offer.isActive ? '#ff9800' : '#2e7d32',
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
                      {offer.isActive ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      onClick={() => handleOpenModal(offer)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 20px',
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
                      onClick={() => handleDelete(offer.id, offer.title)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 20px',
                        background: '#f44336',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
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
            </div>
          );
        })}
      </div>

      {offers.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#999',
          fontSize: '1.1rem'
        }}>
          No offers yet. Click "Create Offer" to set up your first promotion.
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
              maxWidth: '700px',
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
              {editingOffer ? 'Edit Offer' : 'Create New Offer'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                  Offer Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  placeholder="e.g., 20% Off All Fruits"
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
                  placeholder="e.g., Fresh seasonal fruits at amazing prices"
                  rows="2"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => handleInputChange('discountType', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="percentage">Percentage Off (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                    <option value="bogo">Buy X Get 1 Free</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => handleInputChange('discountValue', parseFloat(e.target.value))}
                    required
                    min="0"
                    step="0.01"
                    placeholder={formData.discountType === 'bogo' ? 'Buy quantity' : '0'}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                    Target *
                  </label>
                  <select
                    value={formData.target}
                    onChange={(e) => {
                      handleInputChange('target', e.target.value);
                      if (e.target.value === 'sitewide') handleInputChange('targetId', null);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="sitewide">Sitewide</option>
                    <option value="category">Specific Category</option>
                    <option value="product">Specific Product</option>
                  </select>
                </div>

                {formData.target === 'category' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                      Select Category *
                    </label>
                    <select
                      value={formData.targetId || ''}
                      onChange={(e) => handleInputChange('targetId', parseInt(e.target.value))}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '10px',
                        fontSize: '1rem',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">-- Select --</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.target === 'product' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                      Product ID *
                    </label>
                    <input
                      type="number"
                      value={formData.targetId || ''}
                      onChange={(e) => handleInputChange('targetId', parseInt(e.target.value))}
                      required
                      placeholder="Enter product ID"
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
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    required
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
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    required
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                    Promo Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    required
                    placeholder="e.g., FRUIT20"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border 0.3s ease',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      textTransform: 'uppercase'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2e7d32'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                    Min. Purchase ($)
                  </label>
                  <input
                    type="number"
                    value={formData.minPurchase}
                    onChange={(e) => handleInputChange('minPurchase', parseFloat(e.target.value))}
                    min="0"
                    step="0.01"
                    placeholder="0 (no minimum)"
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
                    Active (offer is live and applicable)
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
                  {editingOffer ? 'Update Offer' : 'Create Offer'}
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

export default AdminOffers;
