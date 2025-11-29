import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Heart,
  Package,
  ChevronRight,
  MessageCircle,
  LogOut,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import "../styles/accountPage.css";

function AccountPage() {
  const navigate = useNavigate();
  const { user, logoutUser, isAuthenticated } = useAuth();
  const { favorites } = useFavorites();

  // Demo data for previous orders
  const [orders] = useState([
    {
      id: "#ORD-2341",
      date: "Nov 3, 2025",
      total: 32.45,
      items: 8,
      status: "Delivered",
    },
    {
      id: "#ORD-2315",
      date: "Oct 28, 2025",
      total: 18.9,
      items: 5,
      status: "Delivered",
    },
    {
      id: "#ORD-2298",
      date: "Oct 22, 2025",
      total: 45.2,
      items: 12,
      status: "Delivered",
    },
  ]);

  // Redirect to sign in if not authenticated
  if (!isAuthenticated) {
    navigate("/signin");
    return null;
  }

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  return (
    <div className="account-page">
      {/* User Profile Section */}
      <div className="profile-header">
        <div className="avatar">
          <User size={40} strokeWidth={2} />
        </div>
        <div className="profile-info">
          <h1>{user?.name || "Guest User"}</h1>
          <p>{user?.email || "guest@chocair.com"}</p>
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
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-icon">
                <ShoppingBag size={22} />
              </div>
              <div className="order-details">
                <div className="order-row">
                  <h4>{order.id}</h4>
                  <span className="order-status">{order.status}</span>
                </div>
                <p className="order-date">{order.date}</p>
                <div className="order-summary">
                  <span>{order.items} items</span>
                  <span className="order-total">${order.total.toFixed(2)}</span>
                </div>
              </div>
              <button
                className="view-details-btn"
                onClick={() => navigate(`/order/${order.id}`)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          ))}
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
