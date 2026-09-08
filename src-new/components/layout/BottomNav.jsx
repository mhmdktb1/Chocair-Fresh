import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, ShoppingBag, Search, User, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './BottomNav.css';

const BottomNav = () => {
  const { cartCount } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show bottom nav on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleSearchClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/shop') {
      const searchInput = document.querySelector('.search-input');
      if (searchInput) {
        searchInput.focus();
      }
    } else {
      navigate('/shop?focus=search');
    }
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="bottom-nav-container">
        <NavLink 
          to="/" 
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          end
        >
          <div className="nav-icon-wrapper">
            <HomeIcon size={20} />
          </div>
          <span className="nav-label">Home</span>
        </NavLink>

        <NavLink 
          to="/shop" 
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-icon-wrapper">
            <ShoppingBag size={20} />
          </div>
          <span className="nav-label">Shop</span>
        </NavLink>

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

        <NavLink 
          to="/cart" 
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-icon-wrapper">
            <Sparkles size={20} className="cart-nav-icon" />
            {cartCount > 0 && (
              <span className="bottom-cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </div>
          <span className="nav-label">Cart</span>
        </NavLink>

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
