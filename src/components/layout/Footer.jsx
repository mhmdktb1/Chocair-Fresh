import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, MessageCircle } from "lucide-react";

function Footer() {
  return (
    <footer className="modern-footer">
      <div className="footer-top">
        <Link to="/" className="footer-logo">Chocair <span>Fresh</span></Link>
        <p className="footer-tagline">Freshness, delivered daily to your door 🌿</p>

        <div className="footer-social">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram/></a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook/></a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><Twitter/></a>
          <a href="https://wa.me/96176123456" target="_blank" rel="noopener noreferrer" aria-label="Whatsapp"><MessageCircle/></a>
        </div>

        <ul className="footer-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/categories">Categories</Link></li>
          <li><Link to="/products">Products</Link></li>
          <li><Link to="/cart">Cart</Link></li>
          <li><Link to="/signin">Sign In</Link></li>
        </ul>
      </div>
      <div className="footer-bottom">
        <p>© 2025 <strong>Chocair Fresh</strong> — All Rights Reserved.</p>
      </div>
    </footer>
  );
}
export default Footer;
