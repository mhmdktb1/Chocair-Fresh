import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, ShoppingBag, Search, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './BottomNav.css';

const BottomNav = () => {
  const { cartCount } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Hide bottom nav on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleSearchClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/shop') {
      const searchInput = document.querySelector('.search-input, .search-input-large');
      if (searchInput) {
        searchInput.focus();
      }
    } else {
      navigate('/shop?focus=search');
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
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
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

      </div>
    </nav>
  );
};

export default BottomNav;
