import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Search,
  User,
  ShoppingCart,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import SearchOverlay from "./SearchOverlay";

function Header({ active = "", variant = "home" }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { isAuthenticated, logoutUser, user } = useAuth();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    setMenuOpen(false);
    // Use navigate instead of window.location for better React Router integration
    navigate("/");
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const headerClass = [
    "header",
    variant === "home" && !isScrolled
      ? "transparent"
      : "scrolled sticky ",
  ].join(" ");

  return (
    <>
      {/* ===== HEADER ===== */}
      <header className={headerClass} id="siteHeader">
        <div className="header-container">

          {/* MOBILE MENU ICON */}
          <button
            className={`icon-btn menu-btn mobile-only ${menuOpen ? "open" : ""}`}
            aria-label="Toggle menu"
            onClick={toggleMenu}
          >
            <span className="menu-line top"></span>
            <span className="menu-line middle"></span>
            <span className="menu-line bottom"></span>
          </button>

          {/* LOGO */}
          <Link to="/" className="logo">
            Chocair <span>Fresh</span>
          </Link>

          {/* NAVIGATION LINKS */}
          <nav className="nav-links desktop-only">
            <Link
              to="/categories"
              className={active === "categories" ? "active" : ""}
            >
              Categories
            </Link>
            <Link to="/products" className={active === "products" ? "active" : ""}>
              Products
            </Link>
            <Link to="/cart" className={active === "cart" ? "active" : ""}>
              Cart
            </Link>
          </nav>

          {/* ACTION BUTTONS */}
          <div className="actions">
            <button 
              className="icon-btn" 
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <Search size={22} strokeWidth={2.5} color={isScrolled ? "#2e7d32" : "#fff"} />
            </button>
            
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="icon-btn" aria-label="Account">
                  <User />
                </Link>
                <Link to="/cart" className="icon-btn" aria-label="Cart" style={{ position: 'relative' }}>
                  <ShoppingCart />
                  {cartCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#2E7D32',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: '700'
                    }}>
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link to="/login-phone" className="login-btn">
                  Log In
                </Link>
                <Link to="/register" className="register-btn desktop-only">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ===== MOBILE SIDE MENU ===== */}
      <div className={`modern-menu ${menuOpen ? "open" : ""}`}>
        <nav className="modern-nav">
          <Link to="/categories" onClick={() => setMenuOpen(false)}>
            Categories
          </Link>
          <Link to="/products" onClick={() => setMenuOpen(false)}>
            Products
          </Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/cart" onClick={() => setMenuOpen(false)}>
                Cart
              </Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>
                My Account
              </Link>
              <hr />
              <button 
                className="logout-btn" 
                onClick={handleLogout}
              >
                <LogOut size={18} style={{ marginRight: "8px" }} />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login-phone" onClick={() => setMenuOpen(false)}>
                Log In
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>
                Create Account
              </Link>
              <hr />
            </>
          )}

          <div className="socials">
            <a href="#">
              <Facebook />
            </a>
            <a href="#">
              <Twitter />
            </a>
            <a href="#">
              <Instagram />
            </a>
            <a href="#">
              <Youtube />
            </a>
          </div>
        </nav>
      </div>

      {/* Search Overlay */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export default Header;
