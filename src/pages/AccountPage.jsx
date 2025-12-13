import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Heart,
  Package,
  ChevronRight,
  MessageCircle,
  LogOut,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { get } from "../utils/api";
import "../styles/accountPage.css";

function AccountPage() {
  const navigate = useNavigate();
  const { user, logoutUser, isAuthenticated } = useAuth();
  const { favorites } = useFavorites();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login-phone");
    }
  }, [isAuthenticated, navigate]);

  // Fetch real orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.phone && !user?.email) return;
      
      try {
        // Fetch orders by phone or email
        const query = user.phone ? `phone=${user.phone}` : `email=${user.email}`;
        const data = await get(`/orders?${query}`);
        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoadingOrders(false);
      }
    };

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    navigate("/");
    // Delay logout slightly to allow navigation to complete
    setTimeout(() => {
      logoutUser();
    }, 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#f39c12';
      case 'Preparing': return '#3498db';
      case 'Delivered': return '#2ecc71';
      case 'Cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return Clock;
      case 'Preparing': return Truck;
      case 'Delivered': return CheckCircle;
      case 'Cancelled': return XCircle;
      default: return Package;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="account-page">
      {/* User Profile Section */}
      <div className="profile-header">
        <div className="avatar">
          <User size={40} strokeWidth={2} />
        </div>
        <div className="profile-info">
          <h1>{user?.name || "Guest User"}</h1>
          <p>{user?.phone || user?.email || ""}</p>
        </div>
      </div>

      {/* Favorites Section */}
      <section className="account-section favorites-section">
        <div className="section-header">
          <div className="section-title-row">
            <Heart size={20} strokeWidth={2.5} />
            <h2>My Favorites</h2>
          </div>
          <button className="view-all" onClick={() => navigate("/products")}>
            View All <ChevronRight size={16} />
          </button>
        </div>

        <div className="favorites-scroll">
          {favorites.length === 0 ? (
            <p style={{ color: '#777', padding: '20px 0' }}>No favorites yet. Start adding products you love!</p>
          ) : (
            favorites.map((item) => (
              <div
                key={item.id}
                className="favorite-card"
                onClick={() => navigate(`/product/${item.name.toLowerCase().replace(/\s+/g, "-")}`, { state: { product: item } })}
              >
                <img src={item.img} alt={item.name} />
                <div className="favorite-info">
                  <h4>{item.name}</h4>
                  <span>${typeof item.price === 'string' ? parseFloat(item.price.replace('$', '')).toFixed(2) : item.price.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Previous Orders Section */}
      <section className="account-section orders-section">
        <div className="section-header">
          <div className="section-title-row">
            <Package size={20} strokeWidth={2.5} />
            <h2>Previous Orders</h2>
          </div>
        </div>

        <div className="orders-list">
          {loadingOrders ? (
            <p style={{ padding: '20px', color: '#666' }}>Loading orders...</p>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <p style={{ color: '#666', marginBottom: '15px' }}>No orders yet</p>
              <button 
                onClick={() => navigate('/products')}
                style={{
                  background: '#2e7d32',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            orders.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              const statusColor = getStatusColor(order.status);
              
              return (
                <div key={order._id} className="order-card">
                  <div className="order-icon" style={{ background: `${statusColor}20` }}>
                    <StatusIcon size={22} color={statusColor} />
                  </div>
                  <div className="order-details">
                    <div className="order-row">
                      <h4 style={{ fontSize: '0.9rem' }}>#{order._id.slice(-6).toUpperCase()}</h4>
                      <span 
                        className="order-status" 
                        style={{ 
                          color: statusColor,
                          background: `${statusColor}15`,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem'
                        }}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="order-date">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <div className="order-summary">
                      <span>{order.orderItems?.length || 0} items</span>
                      <span className="order-total">${(order.totalPrice || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  {/* Removed View Details button for now as detail page isn't fully ready */}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Additional Options */}
      <section className="account-section options-section">
        <button className="option-btn support-btn" onClick={() => navigate("/support")}>
          <MessageCircle size={20} />
          <span>Get Support</span>
          <ChevronRight size={18} className="chevron" />
        </button>

        <button className="option-btn logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </section>

      {/* Bottom Spacing */}
      <div className="bottom-spacer"></div>
    </div>
  );
}

export default AccountPage;
