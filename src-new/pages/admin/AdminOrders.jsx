import { useState, useMemo, useCallback } from "react";
import { useAdmin } from "../../context/AdminContext";
import { 
  Package, 
  CheckCircle, 
  Truck, 
  Clock, 
  Trash2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  ArrowUpDown, 
  XCircle, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Eye, 
  X,
  Sparkles,
  ArrowRight
} from "lucide-react";
import './AdminComponents.css';

function AdminOrders() {
  const { orders, updateOrderStatus, deleteOrder } = useAdmin();
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const ordersPerPage = 12;

  // Real-time status counter tallies for fast filter pills
  const counts = useMemo(() => {
    return {
      all: orders?.length || 0,
      Pending: orders?.filter(o => o.status === "Pending")?.length || 0,
      Preparing: orders?.filter(o => o.status === "Preparing")?.length || 0,
      Delivered: orders?.filter(o => o.status === "Delivered")?.length || 0,
      Cancelled: orders?.filter(o => o.status === "Cancelled")?.length || 0,
    };
  }, [orders]);

  const debouncedSearch = useMemo(() => searchQuery.toLowerCase().trim(), [searchQuery]);

  // Quick date filtering helper
  const getDateRange = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (dateFilter) {
      case "today": {
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);
        return { start: today, end };
      }
      case "week": {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return { start: weekStart, end: weekEnd };
      }
      case "month": {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        return { start: monthStart, end: monthEnd };
      }
      default:
        return null;
    }
  }, [dateFilter]);

  // Filtering and Sorting
  const processedOrders = useMemo(() => {
    let filtered = [...orders];

    if (filterStatus !== "all") {
      filtered = filtered.filter(o => o.status === filterStatus);
    }

    const dateRange = getDateRange();
    if (dateRange) {
      filtered = filtered.filter(o => {
        const orderDate = new Date(o.date);
        return orderDate >= dateRange.start && orderDate <= dateRange.end;
      });
    }

    if (debouncedSearch) {
      filtered = filtered.filter(o =>
        (o.id && o.id.toLowerCase().includes(debouncedSearch)) ||
        (o.customer && o.customer.toLowerCase().includes(debouncedSearch)) ||
        (o.phone && o.phone.includes(debouncedSearch)) ||
        (o.status && o.status.toLowerCase().includes(debouncedSearch))
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date) - new Date(a.date);
        case "date-asc":
          return new Date(a.date) - new Date(b.date);
        case "total-desc":
          return (b.total || 0) - (a.total || 0);
        case "total-asc":
          return (a.total || 0) - (b.total || 0);
        case "status": {
          const statusOrder = { "Pending": 0, "Preparing": 1, "Delivered": 2, "Cancelled": 3 };
          return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, filterStatus, getDateRange, debouncedSearch, sortBy]);

  // Pagination
  const totalPages = Math.ceil(processedOrders.length / ordersPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    return processedOrders.slice(startIndex, startIndex + ordersPerPage);
  }, [processedOrders, currentPage, ordersPerPage]);

  const handleFilterChange = useCallback((setter) => (value) => {
    setter(value);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
  }, [updateOrderStatus]);

  const handleDeleteOrder = useCallback((orderId, customerName) => {
    if (window.confirm(`Delete order ${orderId} from ${customerName || 'customer'}?`)) {
      deleteOrder(orderId);
      if (paginatedOrders.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  }, [deleteOrder, paginatedOrders.length, currentPage]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Pending": return "status-pending";
      case "Preparing": return "status-preparing";
      case "Delivered": return "status-delivered";
      case "Cancelled": return "status-cancelled";
      default: return "status-pending";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending": return <Clock size={13} />;
      case "Preparing": return <Truck size={13} />;
      case "Delivered": return <CheckCircle size={13} />;
      case "Cancelled": return <XCircle size={13} />;
      default: return <Package size={13} />;
    }
  };

  // Helper to build a direct WhatsApp link
  const getWhatsAppLink = (order) => {
    if (!order.phone) return null;
    const cleanPhone = order.phone.replace(/[^0-9+]/g, '');
    const text = encodeURIComponent(
      `Hello ${order.customer || 'Customer'}, this is Chocair Fresh regarding your Order #${order.id?.substring(order.id.length - 6) || order.id}. Total: $${Number(order.total || 0).toFixed(2)}.`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  // Formatted date string
  const formatOrderDate = (dateStr) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      const isToday = new Date().toDateString() === d.toDateString();
      if (isToday) {
        return `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="admin-orders-page">
      {/* Top Header */}
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h2>Order Operations</h2>
          <p className="admin-page-subtitle">
            Showing {paginatedOrders.length} of {processedOrders.length} filtered orders
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="admin-search-filter-card">
        {/* Search Input */}
        <div className="admin-search-input-wrap">
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="Search by Order ID, customer, phone..."
            value={searchQuery}
            onChange={(e) => handleFilterChange(setSearchQuery)(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="clear-search-btn" 
              onClick={() => handleFilterChange(setSearchQuery)("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Status Filter Scrollable Row */}
        <div className="admin-filter-scroll-row">
          <button
            className={`filter-pill ${filterStatus === "all" ? "active" : ""}`}
            onClick={() => handleFilterChange(setFilterStatus)("all")}
          >
            <span>All</span>
            <span className="filter-pill-count">{counts.all}</span>
          </button>

          <button
            className={`filter-pill ${filterStatus === "Pending" ? "active pill-pending" : ""}`}
            onClick={() => handleFilterChange(setFilterStatus)("Pending")}
          >
            <span>Pending</span>
            <span className="filter-pill-count">{counts.Pending}</span>
          </button>

          <button
            className={`filter-pill ${filterStatus === "Preparing" ? "active pill-preparing" : ""}`}
            onClick={() => handleFilterChange(setFilterStatus)("Preparing")}
          >
            <span>Preparing</span>
            <span className="filter-pill-count">{counts.Preparing}</span>
          </button>

          <button
            className={`filter-pill ${filterStatus === "Delivered" ? "active pill-delivered" : ""}`}
            onClick={() => handleFilterChange(setFilterStatus)("Delivered")}
          >
            <span>Delivered</span>
            <span className="filter-pill-count">{counts.Delivered}</span>
          </button>

          <button
            className={`filter-pill ${filterStatus === "Cancelled" ? "active pill-cancelled" : ""}`}
            onClick={() => handleFilterChange(setFilterStatus)("Cancelled")}
          >
            <span>Cancelled</span>
            <span className="filter-pill-count">{counts.Cancelled}</span>
          </button>
        </div>

        {/* Date & Sort Controls */}
        <div className="admin-controls-row">
          <div className="admin-filter-scroll-row">
            {["all", "today", "week", "month"].map(filter => (
              <button
                key={filter}
                onClick={() => handleFilterChange(setDateFilter)(filter)}
                className={`filter-pill ${dateFilter === filter ? "active" : ""}`}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
              >
                {filter === "all" ? "All Time" : filter === "today" ? "Today" : filter === "week" ? "This Week" : "This Month"}
              </button>
            ))}
          </div>

          <div className="admin-sort-group">
            <ArrowUpDown size={14} />
            <select
              className="admin-select-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="total-desc">Highest Total</option>
              <option value="total-asc">Lowest Total</option>
              <option value="status">By Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List / Cards */}
      <div className="admin-orders-list">
        {paginatedOrders.length === 0 ? (
          <div className="admin-empty-state">
            <Package size={40} color="#cbd5e1" />
            <h4>No orders found</h4>
            <p>Try clearing filters or search to view other customer orders.</p>
          </div>
        ) : (
          paginatedOrders.map((order) => {
            const shortId = order.id ? `#${order.id.slice(-6).toUpperCase()}` : '#ORDER';
            const itemsCount = Array.isArray(order.items) 
              ? order.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
              : (order.itemCount || 1);
            const waLink = getWhatsAppLink(order);

            return (
              <div 
                key={order.id} 
                className="admin-order-card"
                onClick={() => setSelectedOrder(order)}
                style={{ cursor: 'pointer' }}
              >
                {/* Header: ID, Date, Status */}
                <div className="order-card-header">
                  <div className="order-id-group">
                    <span className="order-id-tag">{shortId}</span>
                    <span className="order-date-tag">{formatOrderDate(order.date)}</span>
                  </div>
                  <span className={`order-status-badge ${getStatusBadgeClass(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span>{order.status}</span>
                  </span>
                </div>

                {/* Customer Info & Financials */}
                <div className="order-card-info-row">
                  <div className="order-customer-details">
                    <span className="order-customer-name">{order.customer || 'Guest Customer'}</span>
                    <span className="order-customer-phone">{order.phone || 'No phone provided'}</span>
                  </div>
                  <div className="order-financials">
                    <span className="order-total-amount">${Number(order.total || 0).toFixed(2)}</span>
                    <span className="order-items-count">{itemsCount} item{itemsCount > 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="order-card-actions" onClick={(e) => e.stopPropagation()}>
                  {/* Contact Actions */}
                  <div className="order-actions-contact">
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-btn action-btn-whatsapp"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle size={15} />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {order.phone && (
                      <a
                        href={`tel:${order.phone}`}
                        className="action-btn action-btn-call"
                        title="Call customer"
                      >
                        <Phone size={15} />
                        <span>Call</span>
                      </a>
                    )}

                    {order.googleMapsLink && (
                      <a
                        href={order.googleMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-btn action-btn-map"
                        title="Delivery Location"
                      >
                        <MapPin size={15} />
                        <span>Map</span>
                      </a>
                    )}
                  </div>

                  {/* Workflow & Tools Actions */}
                  <div className="order-actions-workflow">
                    {order.status === "Pending" && (
                      <button
                        type="button"
                        className="action-btn action-btn-advance action-btn-advance-prep"
                        onClick={() => handleStatusChange(order.id, "Preparing")}
                        title="Mark Preparing"
                      >
                        <Truck size={14} />
                        <span>Prepare</span>
                      </button>
                    )}

                    {order.status === "Preparing" && (
                      <button
                        type="button"
                        className="action-btn action-btn-advance"
                        onClick={() => handleStatusChange(order.id, "Delivered")}
                        title="Mark Delivered"
                      >
                        <CheckCircle size={14} />
                        <span>Deliver</span>
                      </button>
                    )}

                    <select
                      className="order-quick-status-select"
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      aria-label="Change status"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    <button
                      type="button"
                      className="action-btn action-btn-view"
                      onClick={() => setSelectedOrder(order)}
                      title="View order breakdown"
                    >
                      <Eye size={15} />
                    </button>

                    <button
                      type="button"
                      className="action-btn action-btn-delete"
                      onClick={() => handleDeleteOrder(order.id, order.customer)}
                      title="Delete order"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="admin-pagination-bar">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          <div className="pagination-pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                className={`pagination-page-num ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Order Details Slide-Up Sheet / Modal */}
      {selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Order #{selectedOrder.id?.slice(-6).toUpperCase() || selectedOrder.id}</h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Placed on {new Date(selectedOrder.date).toLocaleString()}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Customer Info Box */}
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: '0.35rem' }}>
                  {selectedOrder.customer || 'Guest Customer'}
                </div>
                {selectedOrder.phone && (
                  <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <Phone size={14} color="#64748b" />
                    <span>{selectedOrder.phone}</span>
                  </div>
                )}
                {selectedOrder.email && (
                  <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem' }}>
                    {selectedOrder.email}
                  </div>
                )}
                {selectedOrder.shippingAddress?.address && (
                  <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.35rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                    <MapPin size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{selectedOrder.shippingAddress.address}</span>
                  </div>
                )}
                {(selectedOrder.shippingAddress?.additionalInfo || selectedOrder.additionalInfo) && (
                  <div style={{ fontSize: '0.82rem', color: '#6b21a8', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '0.45rem 0.65rem', marginTop: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                    <MessageCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3px', color: '#7e22ce' }}>Notes / Instructions:</strong>
                      <span>{selectedOrder.shippingAddress?.additionalInfo || selectedOrder.additionalInfo}</span>
                    </div>
                  </div>
                )}
                {selectedOrder.googleMapsLink && (
                  <div style={{ marginTop: '0.6rem' }}>
                    <a
                      href={selectedOrder.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-btn action-btn-map"
                      style={{ display: 'inline-flex' }}
                    >
                      <MapPin size={14} />
                      <span>Open Delivery Address on Maps</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                  Ordered Items
                </div>
                <div className="order-items-modal-list">
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="order-modal-item-row">
                        <img 
                          src={item.image || '/assets/images/products/placeholder.jpg'} 
                          alt={item.name}
                          className="order-modal-item-img"
                          onError={(e) => { e.currentTarget.src = '/assets/images/products/placeholder.jpg'; }}
                        />
                        <div className="order-modal-item-info">
                          <div className="order-modal-item-name">{item.name}</div>
                          <div className="order-modal-item-qty">
                            ${Number(item.price || 0).toFixed(2)} × {item.quantity} {item.unit || 'unit'}
                          </div>
                        </div>
                        <div className="order-modal-item-total">
                          ${Number(item.total || (item.price * item.quantity) || 0).toFixed(2)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No items found for this order.</p>
                  )}
                </div>
              </div>

              {/* Total & Status Selector */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingTop: '0.75rem',
                borderTop: '1px solid #e2e8f0'
              }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Total Amount:</span>
                <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#16a34a' }}>
                  ${Number(selectedOrder.total || 0).toFixed(2)}
                </span>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Update Order Status:</label>
                <select
                  className="admin-form-select"
                  value={selectedOrder.status}
                  onChange={(e) => {
                    const newSt = e.target.value;
                    handleStatusChange(selectedOrder.id, newSt);
                    setSelectedOrder(prev => ({ ...prev, status: newSt }));
                  }}
                >
                  <option value="Pending">Pending (Awaiting fulfillment)</option>
                  <option value="Preparing">Preparing (Packing / In progress)</option>
                  <option value="Delivered">Delivered (Completed)</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button 
                className="admin-modal-btn btn-cancel" 
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
              <button 
                className="action-btn action-btn-delete"
                onClick={() => {
                  handleDeleteOrder(selectedOrder.id, selectedOrder.customer);
                  setSelectedOrder(null);
                }}
                style={{ padding: '0.65rem 1rem' }}
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
