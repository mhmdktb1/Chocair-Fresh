import { useState, useMemo, useCallback } from "react";
import { useAdmin } from "../../context/AdminContext";
import { Filter, Package, CheckCircle, Truck, Clock, Trash2, Calendar, ChevronLeft, ChevronRight, Search, ArrowUpDown, XCircle } from "lucide-react";

function AdminOrders() {
  const { orders, updateOrderStatus, deleteOrder } = useAdmin();
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const ordersPerPage = 15;

  // Debounced search (simulated with useMemo)
  const debouncedSearch = useMemo(() => searchQuery.toLowerCase().trim(), [searchQuery]);

  // Get date range based on filter
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
      case "custom": {
        if (customStartDate && customEndDate) {
          return {
            start: new Date(customStartDate),
            end: new Date(customEndDate + "T23:59:59")
          };
        }
        return null;
      }
      default:
        return null;
    }
  }, [dateFilter, customStartDate, customEndDate]);

  // Optimized filtering and sorting with useMemo
  const processedOrders = useMemo(() => {
    let filtered = [...orders];

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(o => o.status === filterStatus);
    }

    // Date filter
    const dateRange = getDateRange();
    if (dateRange) {
      filtered = filtered.filter(o => {
        const orderDate = new Date(o.date);
        return orderDate >= dateRange.start && orderDate <= dateRange.end;
      });
    }

    // Search filter
    if (debouncedSearch) {
      filtered = filtered.filter(o =>
        o.id.toLowerCase().includes(debouncedSearch) ||
        o.customer.toLowerCase().includes(debouncedSearch) ||
        o.phone.includes(debouncedSearch) ||
        o.status.toLowerCase().includes(debouncedSearch)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date) - new Date(a.date);
        case "date-asc":
          return new Date(a.date) - new Date(b.date);
        case "total-desc":
          return b.total - a.total;
        case "total-asc":
          return a.total - b.total;
        case "status":
          const statusOrder = { "Pending": 0, "Preparing": 1, "Delivered": 2 };
          return statusOrder[a.status] - statusOrder[b.status];
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

  // Reset to page 1 when filters change
  const handleFilterChange = useCallback((setter) => (value) => {
    setter(value);
    setCurrentPage(1);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return { bg: "#fff3e0", color: "#f57c00" };
      case "Preparing": return { bg: "#e3f2fd", color: "#1976d2" };
      case "Delivered": return { bg: "#e8f5e9", color: "#2e7d32" };
      case "Cancelled": return { bg: "#ffebee", color: "#c62828" };
      default: return { bg: "#f5f5f5", color: "#666" };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending": return Clock;
      case "Preparing": return Truck;
      case "Delivered": return CheckCircle;
      case "Cancelled": return XCircle;
      default: return Package;
    }
  };

  const handleStatusChange = useCallback((orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
  }, [updateOrderStatus]);

  const handleDeleteOrder = useCallback((orderId, customerName) => {
    if (window.confirm(`Are you sure you want to delete order ${orderId} from ${customerName}?`)) {
      deleteOrder(orderId);
      // Adjust page if needed
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

  const handleOrderClick = useCallback((order) => {
    setSelectedOrder(order);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedOrder(null);
  }, []);

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#333', fontWeight: 700 }}>
            Orders Management
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
            Showing {paginatedOrders.length} of {processedOrders.length} orders
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{
        background: '#fff',
        padding: '15px',
        borderRadius: '12px',
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <Search size={20} color="#666" />
        <input
          type="text"
          placeholder="Search by Order ID, Customer, Phone, or Status..."
          value={searchQuery}
          onChange={(e) => handleFilterChange(setSearchQuery)(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '1rem',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Date Filter */}
      <div style={{
        background: '#fff',
        padding: '15px',
        borderRadius: '12px',
        marginBottom: '15px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <Calendar size={20} color="#666" />
          <span style={{ fontWeight: 600, color: '#333' }}>Date Range:</span>
          {["all", "today", "week", "month", "custom"].map(filter => (
            <button
              key={filter}
              onClick={() => handleFilterChange(setDateFilter)(filter)}
              style={{
                background: dateFilter === filter ? '#2e7d32' : '#f5f5f5',
                color: dateFilter === filter ? '#fff' : '#333',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                if (dateFilter !== filter) e.currentTarget.style.background = '#e0e0e0';
              }}
              onMouseLeave={(e) => {
                if (dateFilter !== filter) e.currentTarget.style.background = '#f5f5f5';
              }}
            >
              {filter === "all" ? "All Time" : filter === "today" ? "Today" : filter === "week" ? "This Week" : filter === "month" ? "This Month" : "Custom"}
            </button>
          ))}
        </div>

        {dateFilter === "custom" && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>From:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                outline: 'none'
              }}
            />
            <label style={{ fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>To:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                outline: 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* Status Filter & Sort */}
      <div style={{
        background: '#fff',
        padding: '15px',
        borderRadius: '12px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        flexWrap: 'wrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Filter size={20} color="#666" />
          <span style={{ fontWeight: 600, color: '#333' }}>Status:</span>
          {["all", "Pending", "Preparing", "Delivered", "Cancelled"].map(status => (
            <button
              key={status}
              onClick={() => handleFilterChange(setFilterStatus)(status)}
              style={{
                background: filterStatus === status ? '#2e7d32' : '#f5f5f5',
                color: filterStatus === status ? '#fff' : '#333',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                if (filterStatus !== status) e.currentTarget.style.background = '#e0e0e0';
              }}
              onMouseLeave={(e) => {
                if (filterStatus !== status) e.currentTarget.style.background = '#f5f5f5';
              }}
            >
              {status === "all" ? "All" : status}
            </button>
          ))}
        </div>

        <div style={{ height: '24px', width: '1px', background: '#e0e0e0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ArrowUpDown size={20} color="#666" />
          <span style={{ fontWeight: 600, color: '#333' }}>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'inherit',
              background: '#fff'
            }}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="total-desc">Highest Total</option>
            <option value="total-asc">Lowest Total</option>
            <option value="status">By Status</option>
          </select>
        </div>
      </div>

      {/* Orders Grid */}
      <div style={{
        display: 'grid',
        gap: '15px',
        marginBottom: '20px'
      }}>
        {paginatedOrders.length === 0 ? (
          <div style={{
            background: '#fff',
            padding: '40px',
            borderRadius: '16px',
            textAlign: 'center',
            color: '#999',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            {processedOrders.length === 0 ? "No orders found" : "No orders on this page"}
          </div>
        ) : (
          paginatedOrders.map((order) => {
            const statusColor = getStatusColor(order.status);
            const StatusIcon = getStatusIcon(order.status);
            
            return (
              <div
                key={order.id}
                onClick={() => handleOrderClick(order)}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '20px',
                  alignItems: 'center',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                }}
              >
                {/* Status Icon */}
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  background: statusColor.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <StatusIcon size={28} color={statusColor.color} strokeWidth={2.5} />
                </div>

                {/* Order Details */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#333' }}>
                      {order.id}
                    </h3>
                    <span style={{
                      background: statusColor.bg,
                      color: statusColor.color,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', fontSize: '0.9rem', color: '#666' }}>
                    <div>
                      <strong>Customer:</strong> {order.customer}
                    </div>
                    <div>
                      <strong>Phone:</strong> {order.phone}
                    </div>
                    <div>
                      <strong>Items:</strong> {order.itemCount || order.items?.length || order.items}
                    </div>
                    <div>
                      <strong>Total:</strong> <span style={{ color: '#2e7d32', fontWeight: 700 }}>${order.total.toFixed(2)}</span>
                    </div>
                    <div>
                      <strong>Date:</strong> {order.date}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '150px' }} onClick={(e) => e.stopPropagation()}>
                  {order.status !== "Delivered" && order.status !== "Cancelled" && (
                    <select
                      value={order.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(order.id, e.target.value);
                      }}
                      style={{
                        padding: '8px 12px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none',
                        fontFamily: 'inherit',
                        background: '#fff',
                        transition: 'border-color 0.3s ease'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#2e7d32'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteOrder(order.id, order.customer);
                    }}
                    style={{
                      background: '#f44336',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
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
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '15px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '10px 20px',
              background: currentPage === 1 ? '#f5f5f5' : '#2e7d32',
              color: currentPage === 1 ? '#999' : '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all 0.3s ease',
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== 1) e.currentTarget.style.background = '#1b5e20';
            }}
            onMouseLeave={(e) => {
              if (currentPage !== 1) e.currentTarget.style.background = '#2e7d32';
            }}
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  style={{
                    width: '40px',
                    height: '40px',
                    background: currentPage === pageNum ? '#2e7d32' : '#f5f5f5',
                    color: currentPage === pageNum ? '#fff' : '#333',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== pageNum) e.currentTarget.style.background = '#e0e0e0';
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== pageNum) e.currentTarget.style.background = '#f5f5f5';
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: '10px 20px',
              background: currentPage === totalPages ? '#f5f5f5' : '#2e7d32',
              color: currentPage === totalPages ? '#999' : '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all 0.3s ease',
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== totalPages) e.currentTarget.style.background = '#1b5e20';
            }}
            onMouseLeave={(e) => {
              if (currentPage !== totalPages) e.currentTarget.style.background = '#2e7d32';
            }}
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <div style={{
        marginTop: '10px',
        background: '#fff',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: '#333', fontWeight: 700 }}>
          Order Statistics
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '10px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Total Orders</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#333' }}>
              {orders.length}
            </p>
          </div>
          <div style={{ padding: '15px', background: '#fff3e0', borderRadius: '10px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#f57c00' }}>Pending</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#f57c00' }}>
              {orders.filter(o => o.status === "Pending").length}
            </p>
          </div>
          <div style={{ padding: '15px', background: '#e3f2fd', borderRadius: '10px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#1976d2' }}>Preparing</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#1976d2' }}>
              {orders.filter(o => o.status === "Preparing").length}
            </p>
          </div>
          <div style={{ padding: '15px', background: '#e8f5e9', borderRadius: '10px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#2e7d32' }}>Delivered</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#2e7d32' }}>
              {orders.filter(o => o.status === "Delivered").length}
            </p>
          </div>
          <div style={{ padding: '15px', background: '#ffebee', borderRadius: '10px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#c62828' }}>Cancelled</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#c62828' }}>
              {orders.filter(o => o.status === "Cancelled").length}
            </p>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
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
              ×
            </button>

            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', color: '#333', fontWeight: 700, paddingRight: '30px' }}>
              Order Details
            </h2>

            {/* Order ID and Status */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '25px',
              padding: '15px',
              background: '#f9f9f9',
              borderRadius: '12px'
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Order ID</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '1.3rem', fontWeight: 700, color: '#333' }}>
                  {selectedOrder.id}
                </p>
              </div>
              <span style={{
                background: getStatusColor(selectedOrder.status).bg,
                color: getStatusColor(selectedOrder.status).color,
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 700
              }}>
                {selectedOrder.status}
              </span>
            </div>

            {/* Customer Information */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#333', fontWeight: 700 }}>
                Customer Information
              </h3>
              <div style={{ 
                background: '#f9f9f9', 
                padding: '15px', 
                borderRadius: '12px',
                display: 'grid',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#666', minWidth: '80px' }}>Name:</span>
                  <span style={{ color: '#333', fontWeight: 500 }}>{selectedOrder.customer}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#666', minWidth: '80px' }}>Phone:</span>
                  <span style={{ color: '#333', fontWeight: 500 }}>{selectedOrder.phone}</span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#333', fontWeight: 700 }}>
                Order Items
              </h3>
              <div style={{ 
                background: '#f9f9f9', 
                padding: '15px', 
                borderRadius: '12px',
                display: 'grid',
                gap: '12px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, index) => (
                    <div 
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: '#fff',
                        borderRadius: '10px',
                        border: '1px solid #e0e0e0'
                      }}
                    >
                      <img 
                        src={item.image || '/assets/images/products/placeholder.jpg'} 
                        alt={item.name}
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid #f0f0f0'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#333', marginBottom: '4px' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                          ${item.price.toFixed(2)} × {item.quantity} {item.unit}
                        </div>
                      </div>
                      <div style={{ 
                        fontWeight: 700, 
                        color: '#2e7d32', 
                        fontSize: '1.1rem',
                        minWidth: '70px',
                        textAlign: 'right'
                      }}>
                        ${item.total.toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#999', 
                    padding: '20px',
                    fontStyle: 'italic'
                  }}>
                    No item details available
                  </div>
                )}
              </div>
            </div>

            {/* Order Details */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#333', fontWeight: 700 }}>
                Order Summary
              </h3>
              <div style={{ 
                background: '#f9f9f9', 
                padding: '15px', 
                borderRadius: '12px',
                display: 'grid',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: '#666' }}>Total Items:</span>
                  <span style={{ color: '#333', fontWeight: 600 }}>{selectedOrder.itemCount || selectedOrder.items?.length || selectedOrder.items} items</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: '#666' }}>Order Date:</span>
                  <span style={{ color: '#333', fontWeight: 600 }}>{new Date(selectedOrder.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div style={{ height: '1px', background: '#e0e0e0', margin: '5px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#333' }}>Total Amount:</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2e7d32' }}>
                    ${selectedOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              {selectedOrder.status !== "Delivered" && selectedOrder.status !== "Cancelled" && (
                <select
                  value={selectedOrder.status}
                  onChange={(e) => {
                    handleStatusChange(selectedOrder.id, e.target.value);
                    setSelectedOrder({...selectedOrder, status: e.target.value});
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '2px solid #2e7d32',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    fontFamily: 'inherit',
                    background: '#fff',
                    color: '#2e7d32'
                  }}
                >
                  <option value="Pending">Mark as Pending</option>
                  <option value="Preparing">Mark as Preparing</option>
                  <option value="Delivered">Mark as Delivered</option>
                  <option value="Cancelled">Mark as Cancelled</option>
                </select>
              )}
              <button
                onClick={() => {
                  handleDeleteOrder(selectedOrder.id, selectedOrder.customer);
                  handleCloseModal();
                }}
                style={{
                  flex: (selectedOrder.status === "Delivered" || selectedOrder.status === "Cancelled") ? 1 : 'none',
                  padding: '12px 24px',
                  background: '#f44336',
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
                onMouseEnter={(e) => e.currentTarget.style.background = '#d32f2f'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f44336'}
              >
                <Trash2 size={18} />
                Delete Order
              </button>
            </div>

            <button
              onClick={handleCloseModal}
              style={{
                width: '100%',
                marginTop: '15px',
                padding: '12px',
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
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
