import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, ShoppingBag, Search, ShoppingCart, User, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './BottomNav.css';

const BottomNav = () => {
  const { cartCount } = useCart();
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Hide bottom nav on admin routes, checkout, and product details pages (so product sticky action bar and checkout dock have full focus)
  if (
    location.pathname.startsWith('/admin') ||
    location.pathname === '/checkout' ||
    location.pathname.startsWith('/product')
  ) {
    return null;
  }

  const handleSearchClick = (e) => {
    e.preventDefault();
    // Open the home / spotlight search overlay
    window.dispatchEvent(new CustomEvent('open-search'));
    // Fallback: trigger click on the search toggle button in navbar if available
    const searchBtn = document.querySelector('.search-toggle, .nav-search-trigger');
    if (searchBtn && !document.querySelector('.modern-search-overlay.active')) {
      searchBtn.click();
    }
  };

  const handleHomeClick = (e) => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="bottom-nav-container">
        
        {/* 1. Home */}
        <NavLink 
          to="/" 
          onClick={handleHomeClick}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          end
        >
          <div className="nav-icon-wrapper">
            <HomeIcon size={20} />
          </div>
          <span className="nav-label">Home</span>
        </NavLink>

        {/* 2. Shop */}
        <NavLink 
          to="/shop" 
          className={({ isActive }) => `bottom-nav-item ${isActive || location.pathname.startsWith('/product') ? 'active' : ''}`}
        >
          <div className="nav-icon-wrapper">
            <ShoppingBag size={20} />
          </div>
          <span className="nav-label">Shop</span>
        </NavLink>

        {/* 3. Search */}
        <button 
          type="button"
          onClick={handleSearchClick}
          className="bottom-nav-item bottom-nav-search"
          aria-label="Search Catalog"
        >
          <div className="nav-icon-wrapper search-bubble">
            <Search size={19} />
          </div>
          <span className="nav-label">Search</span>
        </button>

        {/* 4. Cart */}
        <NavLink 
          to="/cart" 
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-icon-wrapper">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="bottom-cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </div>
          <span className="nav-label">Cart</span>
        </NavLink>

        {/* 5. Profile */}
        <NavLink 
          to={user ? "/profile" : "/login"} 
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-icon-wrapper">
            <User size={20} />
          </div>
          <span className="nav-label">{user ? 'Account' : 'Login'}</span>
        </NavLink>

        {/* 6. Admin Portal (Admins only) */}
        {isAdmin && (
          <NavLink 
            to="/admin" 
            className={({ isActive }) => `bottom-nav-item bottom-nav-admin ${isActive ? 'active' : ''}`}
          >
            <div className="nav-icon-wrapper">
              <ShieldCheck size={20} />
            </div>
            <span className="nav-label">Admin</span>
          </NavLink>
        )}

      </div>
    </nav>
  );
};

export default BottomNav;
