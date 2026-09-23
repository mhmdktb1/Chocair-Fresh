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
  ArrowRight,
  SlidersHorizontal,
  Share2,
  Copy,
  Check,
  Send,
  ExternalLink,
  Receipt,
  User,
  ShoppingBag,
  CreditCard,
  ChevronDown,
  Info
} from "lucide-react";
import { normalizeUnit, formatQuantityWithUnit } from "../../utils/unitHelper";
import './AdminComponents.css';

// Normalize phone numbers for WhatsApp URL scheme
export const normalizePhoneForWhatsApp = (phone) => {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^\d]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 8) {
    cleaned = '961' + cleaned.slice(1);
  } else if (cleaned.length === 8 && ['7', '3', '8', '1'].includes(cleaned[0])) {
    cleaned = '961' + cleaned;
  }
  return cleaned;
};

// Generate a simplified, highly organized, emoji-enhanced WhatsApp order message
export const formatWhatsAppOrderMessage = (order) => {
  if (!order) return '';
  const shortId = order.id ? `#${order.id.slice(-6).toUpperCase()}` : '#ORDER';

  let formattedDate = '';
  try {
    const d = new Date(order.date);
    formattedDate = d.toLocaleDateString([], {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    formattedDate = order.date || 'Recent';
  }

  const customerName = order.customer || 'Customer';
  const phone = order.phone || '';
  const address = order.shippingAddress?.address || (typeof order.shippingAddress === 'string' ? order.shippingAddress : '') || '';
  const deliveryPref = order.deliveryPreference || order.shippingAddress?.deliveryPreference || '';
  const instructions = order.shippingAddress?.additionalInfo || order.additionalInfo || '';
  const mapsLink = order.googleMapsLink || '';
  const items = Array.isArray(order.items) ? order.items : [];

  let text = `🍏 *CHOCAIR FRESH — ORDER SUMMARY*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🧾 *Order ID:* ${shortId}\n`;
  text += `📅 *Date:* ${formattedDate}\n`;
  text += `⚡ *Status:* *${order.status || 'Pending'}*\n\n`;

  text += `👤 *CUSTOMER & DELIVERY*\n`;
  text += `• *Name:* ${customerName}\n`;
  if (phone) {
    text += `• *Phone:* ${phone}\n`;
  }
  if (address) {
    text += `• *Address:* ${address}\n`;
  }
  if (deliveryPref) {
    text += `• *Delivery Slot:* ${deliveryPref}\n`;
  }
  if (instructions) {
    text += `• *Special Notes:* "${instructions}"\n`;
  }
  if (mapsLink) {
    text += `• *Location (Maps):* ${mapsLink}\n`;
  }

  text += `\n🛒 *ITEMS ORDERED (${items.length}):*\n`;
  if (items.length > 0) {
    items.forEach((item, idx) => {
      const qty = item.quantity || 1;
      const unit = normalizeUnit(item.unit);
      const itemTotal = Number(item.total || (item.price * qty) || 0).toFixed(2);
      text += ` ${idx + 1}. *${item.name}* (x${qty} ${unit}) — $${itemTotal}\n`;
      if (item.instruction) {
        text += `    ↳ 📝 Note: _${item.instruction}_\n`;
      }
    });
  } else {
    text += `• No items specified\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💵 *TOTAL AMOUNT: $${Number(order.total || 0).toFixed(2)}*\n`;
  text += `💳 *Payment:* ${order.paymentMethod || 'Cash on Delivery'}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🌱 _Chocair Fresh • Quality & Freshness Delivered_`;

  return text;
};

function AdminOrders() {
  const { orders, updateOrderStatus, deleteOrder } = useAdmin();
  const [filterStatus, setFilterStatus] = useState("Pending");
  const [dateFilter, setDateFilter] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showWaPreview, setShowWaPreview] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const ordersPerPage = 12;

  const hasActiveFilters = dateFilter !== "today" || sortBy !== "date-desc";
  const activeFiltersCount = (dateFilter !== "today" ? 1 : 0) + (sortBy !== "date-desc" ? 1 : 0);

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

  // Build direct WhatsApp link with customer
  const getCustomerWhatsAppUrl = useCallback((order) => {
    if (!order) return "#";
    const message = formatWhatsAppOrderMessage(order);
    const cleanPhone = normalizePhoneForWhatsApp(order.phone);
    if (cleanPhone) {
      return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    }
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  }, []);

  // Build generic WhatsApp share link for driver / staff / any contact
  const getGeneralWhatsAppUrl = useCallback((order) => {
    if (!order) return "#";
    const message = formatWhatsAppOrderMessage(order);
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  }, []);

  const fallbackCopy = (text, orderId, shortId) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopiedId(orderId);
      setToastMessage(`Order ${shortId} details copied!`);
      setTimeout(() => {
        setCopiedId(null);
        setToastMessage(null);
      }, 2500);
    } catch {
      alert('Could not auto-copy. Please copy manually from the preview.');
    }
    document.body.removeChild(textarea);
  };

  // Copy simplified formatted text to clipboard
  const handleCopyOrder = useCallback((order) => {
    if (!order) return;
    const text = formatWhatsAppOrderMessage(order);
    const shortId = order.id ? `#${order.id.slice(-6).toUpperCase()}` : '';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedId(order.id);
        setToastMessage(`Order ${shortId} details copied to clipboard!`);
        setTimeout(() => {
          setCopiedId(null);
          setToastMessage(null);
        }, 2500);
      }).catch(() => {
        fallbackCopy(text, order.id, shortId);
      });
    } else {
      fallbackCopy(text, order.id, shortId);
    }
  }, []);

  // Native share or fallback to generic WhatsApp share
  const handleShareGeneric = useCallback((order) => {
    if (!order) return;
    const text = formatWhatsAppOrderMessage(order);
    const shortId = order.id ? `#${order.id.slice(-6).toUpperCase()}` : '#ORDER';

    if (navigator.share) {
      navigator.share({
        title: `Chocair Fresh - Order ${shortId}`,
        text: text,
      }).catch((err) => {
        if (err.name !== 'AbortError') {
          window.open(getGeneralWhatsAppUrl(order), '_blank', 'noopener,noreferrer');
        }
      });
    } else {
      window.open(getGeneralWhatsAppUrl(order), '_blank', 'noopener,noreferrer');
    }
  }, [getGeneralWhatsAppUrl]);

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
        {/* Search Input & Mobile Filter Button */}
        <div className="admin-search-row">
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

          <button
            type="button"
            className={`admin-mobile-filter-btn ${hasActiveFilters ? "active" : ""}`}
            onClick={() => setIsFilterModalOpen(true)}
            aria-label="Filter and sort orders"
          >
            <SlidersHorizontal size={16} />
            <span>Filter</span>
            {hasActiveFilters && (
              <span className="mobile-filter-badge">{activeFiltersCount}</span>
            )}
          </button>
        </div>

        {/* Status Filter Scrollable Row */}
        <div className="admin-filter-scroll-row status-filter-row">
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

        {/* Date & Sort Controls (Desktop Only) */}
        <div className="admin-controls-row desktop-controls-only">
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
            const customerWaUrl = order.phone ? getCustomerWhatsAppUrl(order) : null;
            const genericWaUrl = getGeneralWhatsAppUrl(order);

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

                {order.items?.some(i => i.instruction) && (
                  <div className="order-card-has-instructions">
                    <MessageCircle size={12} color="#059669" />
                    <span>Special item instructions included</span>
                  </div>
                )}

                {/* Desktop Action Bar */}
                <div className="order-card-actions order-actions-desktop" onClick={(e) => e.stopPropagation()}>
                  {/* Contact & Share Actions */}
                  <div className="order-actions-contact">
                    {customerWaUrl ? (
                      <a
                        href={customerWaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-btn action-btn-whatsapp"
                        title="Chat & share simplified summary with customer on WhatsApp"
                      >
                        <MessageCircle size={15} />
                        <span>WhatsApp</span>
                      </a>
                    ) : (
                      <a
                        href={genericWaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-btn action-btn-whatsapp"
                        title="Share simplified summary on WhatsApp"
                      >
                        <MessageCircle size={15} />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    <button
                      type="button"
                      className="action-btn action-btn-share"
                      onClick={() => handleShareGeneric(order)}
                      title="Share / Forward order to driver or staff"
                    >
                      <Share2 size={14} />
                      <span>Share</span>
                    </button>

                    <button
                      type="button"
                      className={`action-btn action-btn-copy-sm ${copiedId === order.id ? 'copied' : ''}`}
                      onClick={() => handleCopyOrder(order)}
                      title="Copy simplified WhatsApp text"
                      aria-label="Copy order details"
                    >
                      {copiedId === order.id ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                    </button>

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

                {/* Simplified Mobile Action Bar */}
                <div className="order-card-actions order-actions-mobile" onClick={(e) => e.stopPropagation()}>
                  <div className="order-mobile-primary-action">
                    {order.status === "Pending" ? (
                      <button
                        type="button"
                        className="action-btn action-btn-advance action-btn-advance-prep"
                        onClick={() => handleStatusChange(order.id, "Preparing")}
                        title="Mark Preparing"
                      >
                        <Truck size={15} />
                        <span>Prepare</span>
                      </button>
                    ) : order.status === "Preparing" ? (
                      <button
                        type="button"
                        className="action-btn action-btn-advance"
                        onClick={() => handleStatusChange(order.id, "Delivered")}
                        title="Mark Delivered"
                      >
                        <CheckCircle size={15} />
                        <span>Deliver</span>
                      </button>
                    ) : (
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
                    )}
                  </div>

                  <div className="order-mobile-quick-actions">
                    <a
                      href={customerWaUrl || genericWaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-btn action-btn-whatsapp action-btn-icon-only"
                      title="Share simplified summary on WhatsApp"
                      aria-label="Share on WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </a>

                    <button
                      type="button"
                      className="action-btn action-btn-share action-btn-icon-only"
                      onClick={() => handleShareGeneric(order)}
                      title="Forward to driver / staff"
                      aria-label="Forward order"
                    >
                      <Share2 size={15} />
                    </button>

                    <button
                      type="button"
                      className={`action-btn action-btn-copy-sm action-btn-icon-only ${copiedId === order.id ? 'copied' : ''}`}
                      onClick={() => handleCopyOrder(order)}
                      title="Copy order details"
                      aria-label="Copy order details"
                    >
                      {copiedId === order.id ? <Check size={15} color="#16a34a" /> : <Copy size={15} />}
                    </button>

                    {order.phone && (
                      <a
                        href={`tel:${order.phone}`}
                        className="action-btn action-btn-call action-btn-icon-only"
                        title="Call customer"
                        aria-label="Call customer"
                      >
                        <Phone size={15} />
                      </a>
                    )}

                    <button
                      type="button"
                      className="action-btn action-btn-view action-btn-icon-only"
                      onClick={() => setSelectedOrder(order)}
                      title="View order details"
                      aria-label="View details"
                    >
                      <Eye size={16} />
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

      {/* Mobile Filter & Sort Modal */}
      {isFilterModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsFilterModalOpen(false)}>
          <div className="admin-modal-dialog admin-filter-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SlidersHorizontal size={18} color="#16a34a" />
                <h3 style={{ fontSize: '1.1rem' }}>Filter & Sort Orders</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsFilterModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ gap: '1.25rem' }}>
              {/* Date Filter Section */}
              <div>
                <label className="admin-form-label" style={{ marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={15} color="#64748b" />
                  <span>Date Range</span>
                </label>
                <div className="admin-modal-filter-options">
                  {[
                    { id: "all", label: "All Time" },
                    { id: "today", label: "Today" },
                    { id: "week", label: "This Week" },
                    { id: "month", label: "This Month" },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className={`filter-pill ${dateFilter === d.id ? "active" : ""}`}
                      style={{ justifyContent: 'center', padding: '0.65rem 0.75rem' }}
                      onClick={() => handleFilterChange(setDateFilter)(d.id)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Section */}
              <div className="admin-form-group">
                <label className="admin-form-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ArrowUpDown size={15} color="#64748b" />
                  <span>Sort Orders By</span>
                </label>
                <select
                  className="admin-form-select"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="date-desc">Newest First (Default)</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="total-desc">Highest Total Amount</option>
                  <option value="total-asc">Lowest Total Amount</option>
                  <option value="status">By Order Status</option>
                </select>
              </div>
            </div>

            <div className="admin-modal-footer">
              {hasActiveFilters && (
                <button
                  type="button"
                  className="admin-modal-btn btn-cancel"
                  onClick={() => {
                    setDateFilter("today");
                    setSortBy("date-desc");
                    setCurrentPage(1);
                  }}
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                className="admin-modal-btn btn-submit"
                onClick={() => setIsFilterModalOpen(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Redesigned Mobile Bottom Sheet / Modal */}
      {selectedOrder && (() => {
        const modalShortId = selectedOrder.id ? `#${selectedOrder.id.slice(-6).toUpperCase()}` : '#ORDER';
        const modalCustomerPhone = selectedOrder.phone || '';
        const modalDeliveryAddress = selectedOrder.shippingAddress?.address || (typeof selectedOrder.shippingAddress === 'string' ? selectedOrder.shippingAddress : '') || '';
        const modalDeliverySlot = selectedOrder.deliveryPreference || selectedOrder.shippingAddress?.deliveryPreference || '';
        const modalNotes = selectedOrder.shippingAddress?.additionalInfo || selectedOrder.additionalInfo || '';
        const totalUnitsCount = Array.isArray(selectedOrder.items) 
          ? selectedOrder.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
          : (selectedOrder.itemCount || 0);

        return (
          <div className="admin-modal-backdrop" onClick={() => { setSelectedOrder(null); setShowWaPreview(false); }}>
            <div className="admin-modal-dialog order-details-sheet" onClick={(e) => e.stopPropagation()}>
              
              {/* Top Handle for mobile gestures */}
              <div className="order-sheet-handle-bar">
                <div className="order-sheet-handle"></div>
              </div>

              {/* Sheet Header */}
              <div className="order-sheet-header">
                <div className="order-sheet-title-box">
                  <div className="order-sheet-id-line">
                    <span className="order-sheet-id">{modalShortId}</span>
                    <span className={`order-status-badge ${getStatusBadgeClass(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      <span>{selectedOrder.status}</span>
                    </span>
                  </div>
                  <span className="order-sheet-time">
                    {new Date(selectedOrder.date).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <button 
                  className="modal-close-btn order-sheet-close-btn" 
                  onClick={() => { setSelectedOrder(null); setShowWaPreview(false); }}
                  aria-label="Close details"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-modal-body order-sheet-body">
                
                {/* 1. Quick Customer & Delivery Card */}
                <div className="order-sheet-card order-sheet-customer-card">
                  <div className="order-sheet-customer-header">
                    <div className="order-sheet-avatar">
                      {(selectedOrder.customer || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="order-sheet-customer-text">
                      <div className="order-sheet-customer-name">
                        {selectedOrder.customer || 'Guest Customer'}
                      </div>
                      <div className="order-sheet-customer-sub">
                        {modalCustomerPhone ? (
                          <a href={`tel:${modalCustomerPhone}`} className="order-sheet-phone-link">
                            <Phone size={13} />
                            <span>{modalCustomerPhone}</span>
                          </a>
                        ) : (
                          <span className="order-sheet-no-phone">No phone provided</span>
                        )}
                        {selectedOrder.email && (
                          <span className="order-sheet-email-text">• {selectedOrder.email}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Location & Map */}
                  {modalDeliveryAddress && (
                    <div className="order-sheet-info-row">
                      <MapPin size={16} className="order-sheet-icon text-green" />
                      <div className="order-sheet-info-content">
                        <span className="order-sheet-info-label">Delivery Address</span>
                        <span className="order-sheet-info-value">{modalDeliveryAddress}</span>
                      </div>
                      {selectedOrder.googleMapsLink && (
                        <a
                          href={selectedOrder.googleMapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="order-sheet-map-badge"
                          title="Open Google Maps"
                        >
                          <ExternalLink size={13} />
                          <span>Maps</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Delivery Slot */}
                  {modalDeliverySlot && (
                    <div className="order-sheet-info-row">
                      <Clock size={16} className="order-sheet-icon text-teal" />
                      <div className="order-sheet-info-content">
                        <span className="order-sheet-info-label">Preferred Time Slot</span>
                        <span className="order-sheet-info-value">{modalDeliverySlot}</span>
                      </div>
                    </div>
                  )}

                  {/* Customer Notes */}
                  {modalNotes && (
                    <div className="order-sheet-note-box">
                      <div className="order-sheet-note-title">
                        <MessageCircle size={13} />
                        <span>Delivery Instructions</span>
                      </div>
                      <div className="order-sheet-note-text">"{modalNotes}"</div>
                    </div>
                  )}
                </div>

                {/* 2. Fast Communication & Share Hub */}
                <div className="order-sheet-actions-hub">
                  {modalCustomerPhone && (
                    <a
                      href={getCustomerWhatsAppUrl(selectedOrder)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="order-sheet-hub-btn btn-wa-primary"
                    >
                      <MessageCircle size={16} />
                      <span>WhatsApp Customer</span>
                    </a>
                  )}

                  <div className="order-sheet-hub-subrow">
                    <button
                      type="button"
                      className="order-sheet-hub-btn btn-share-driver"
                      onClick={() => handleShareGeneric(selectedOrder)}
                    >
                      <Share2 size={15} />
                      <span>Forward / Dispatch</span>
                    </button>

                    <button
                      type="button"
                      className={`order-sheet-hub-btn btn-copy-details ${copiedId === selectedOrder.id ? 'is-copied' : ''}`}
                      onClick={() => handleCopyOrder(selectedOrder)}
                    >
                      {copiedId === selectedOrder.id ? <Check size={15} /> : <Copy size={15} />}
                      <span>{copiedId === selectedOrder.id ? 'Copied!' : 'Copy Summary'}</span>
                    </button>
                  </div>

                  {/* WhatsApp Text Preview toggle for quick review */}
                  <div className="order-sheet-wa-preview-section">
                    <button
                      type="button"
                      className="order-sheet-preview-toggle-btn"
                      onClick={() => setShowWaPreview(prev => !prev)}
                    >
                      <Sparkles size={13} />
                      <span>{showWaPreview ? 'Hide Message Preview' : 'Preview Formatted WhatsApp Message'}</span>
                    </button>

                    {showWaPreview && (
                      <div className="admin-order-wa-preview">
                        <div className="admin-order-wa-preview-header">
                          <span>Formatted Dispatch Text</span>
                          <button
                            type="button"
                            className="admin-order-wa-copy-link"
                            onClick={() => handleCopyOrder(selectedOrder)}
                          >
                            {copiedId === selectedOrder.id ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <pre className="admin-order-wa-preview-text">
                          {formatWhatsAppOrderMessage(selectedOrder)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Ordered Items List */}
                <div className="order-sheet-items-section">
                  <div className="order-sheet-section-title">
                    <div className="order-sheet-title-left">
                      <ShoppingBag size={16} color="#0f172a" />
                      <span>Order Items</span>
                    </div>
                    <span className="order-sheet-item-count-badge">
                      {selectedOrder.items?.length || 0} item{selectedOrder.items?.length !== 1 ? 's' : ''} ({totalUnitsCount} qty)
                    </span>
                  </div>

                  <div className="order-sheet-items-list">
                    {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, idx) => {
                        const itemQty = item.quantity || 1;
                        const itemUnit = normalizeUnit(item.unit);
                        const itemPrice = Number(item.price || 0);
                        const itemLineTotal = Number(item.total || (itemPrice * itemQty) || 0);

                        return (
                          <div key={idx} className="order-sheet-item-card">
                            <img 
                              src={item.image || '/assets/images/products/placeholder.jpg'} 
                              alt={item.name}
                              className="order-sheet-item-thumb"
                              onError={(e) => { e.currentTarget.src = '/assets/images/products/placeholder.jpg'; }}
                            />
                            <div className="order-sheet-item-main">
                              <div className="order-sheet-item-row-top">
                                <span className="order-sheet-item-title">{item.name}</span>
                                <span className="order-sheet-item-price-total">
                                  ${itemLineTotal.toFixed(2)}
                                </span>
                              </div>
                              <div className="order-sheet-item-qty-meta">
                                <span className="order-sheet-qty-pill">
                                  {itemQty} {itemUnit}
                                </span>
                                <span className="order-sheet-unit-price">
                                  @ ${itemPrice.toFixed(2)}/{itemUnit}
                                </span>
                              </div>
                              {item.instruction && (
                                <div className="order-sheet-item-note">
                                  <span className="order-item-note-badge">Note</span>
                                  <span className="order-item-note-content">"{item.instruction}"</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="order-sheet-empty-items">No items found for this order.</div>
                    )}
                  </div>
                </div>

                {/* 4. Financial & Payment Summary */}
                <div className="order-sheet-card order-sheet-summary-card">
                  <div className="order-sheet-summary-row">
                    <span className="order-sheet-summary-label">Payment Method</span>
                    <span className="order-sheet-summary-value-badge">
                      <CreditCard size={13} />
                      <span>{selectedOrder.paymentMethod || 'Cash on Delivery'}</span>
                    </span>
                  </div>
                  <div className="order-sheet-summary-row order-sheet-grand-total-row">
                    <span className="order-sheet-grand-label">Grand Total</span>
                    <span className="order-sheet-grand-amount">
                      ${Number(selectedOrder.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* 5. Status Workflow Selector */}
                <div className="order-sheet-status-control">
                  <label className="order-sheet-status-label">
                    <span>Change Order Status</span>
                  </label>
                  <div className="order-sheet-status-pills">
                    {["Pending", "Preparing", "Delivered", "Cancelled"].map((st) => {
                      const isActive = selectedOrder.status === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          className={`order-sheet-status-btn ${st.toLowerCase()} ${isActive ? 'is-active' : ''}`}
                          onClick={() => {
                            handleStatusChange(selectedOrder.id, st);
                            setSelectedOrder(prev => ({ ...prev, status: st }));
                          }}
                        >
                          {st === "Pending" && <Clock size={14} />}
                          {st === "Preparing" && <Truck size={14} />}
                          {st === "Delivered" && <CheckCircle size={14} />}
                          {st === "Cancelled" && <XCircle size={14} />}
                          <span>{st}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Sheet Bottom Footer Actions */}
              <div className="order-sheet-footer">
                <button 
                  className="order-sheet-btn-delete"
                  onClick={() => {
                    handleDeleteOrder(selectedOrder.id, selectedOrder.customer);
                    setSelectedOrder(null);
                    setShowWaPreview(false);
                  }}
                  title="Delete this order"
                >
                  <Trash2 size={16} />
                  <span>Delete Order</span>
                </button>
                <button 
                  className="order-sheet-btn-done" 
                  onClick={() => {
                    setSelectedOrder(null);
                    setShowWaPreview(false);
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Floating Copy Feedback Toast */}
      {toastMessage && (
        <div className="admin-orders-toast">
          <Check size={16} color="#16a34a" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
