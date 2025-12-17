import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, LogOut } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { getStoredUser, clearAuthData } from '../../utils/api';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Check for logged in user
    const checkUser = () => {
      const storedUser = getStoredUser();
      setUser(storedUser);
    };
    
    checkUser();
    // Listen for storage events to update auth state across tabs/components
    window.addEventListener('storage', checkUser);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', checkUser);
    };
  }, []);

  const handleLogout = () => {
    clearAuthData();
    setUser(null);
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="logo">
          Chocair<span className="highlight">Fresh</span>
        </Link>

        <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/shop" className="nav-link">Shop</Link>
          <Link to="/#about" className="nav-link">About</Link>
          <Link to="/#contact" className="nav-link">Contact</Link>
          
          <div className="mobile-actions">
            {user ? (
              <>
                <Link to="/profile" className="nav-link">My Account</Link>
                <button onClick={handleLogout} className="nav-link" style={{background: 'none', border: 'none', textAlign: 'left', padding: '0.5rem 0'}}>Logout</button>
              </>
            ) : (
              <Link to="/login" className="nav-link">Login</Link>
            )}
          </div>
        </div>

        <div className="nav-actions">
          <Link to="/cart" className="icon-btn">
            <ShoppingBag size={24} />
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </Link>
          
          {user ? (
            <Link to="/profile" className="icon-btn desktop-only" title="My Account">
              <User size={24} fill="#2e7d32" color="#2e7d32" />
            </Link>
          ) : (
            <Link to="/login" className="icon-btn desktop-only">
              <User size={24} />
            </Link>
          )}
          
          <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
