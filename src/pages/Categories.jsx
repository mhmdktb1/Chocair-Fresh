import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import { Menu, Search, User, ShoppingCart } from "lucide-react";
import "../styles/style.css";
import "../styles/categories.css";

function Categories() {
  const [placeholder, setPlaceholder] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const navigate = useNavigate();

  const phrases = [
    "Search for fresh fruits 🍎",
    "Find the best vegetables 🥬",
    "Discover Lebanese products 🇱🇧",
    "Order organic and local 🌿",
    "Your groceries, delivered fast 🚚",
  ];

  // Typing animation effect
  useEffect(() => {
    if (index === phrases.length) return;
    const currentPhrase = phrases[index];
    const timeout = setTimeout(() => {
      setPlaceholder(
        isDeleting
          ? currentPhrase.substring(0, subIndex - 1)
          : currentPhrase.substring(0, subIndex + 1)
      );
      setSubIndex((prev) => prev + (isDeleting ? -1 : 1));

      if (!isDeleting && subIndex === currentPhrase.length) {
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && subIndex === 0) {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % phrases.length);
      }
    }, isDeleting ? 45 : 90);
    return () => clearTimeout(timeout);
  }, [subIndex, isDeleting, index]);

  return (
    <>
      {/* =============== HEADER =============== */}
      <Header active="categories" variant="categories" />

      {/* =============== HERO + SEARCH =============== */}
      <section className="hero-section hero-categories">
        <img
          src="/assets/images/hero.jpg"
          alt="Fresh categories"
          className="hero-image"
        />
        <div className="hero-content">
          <h1>Shop by Category</h1>
          <p>
            Explore our full range of premium Lebanese fruits, vegetables, and
            more.
          </p>
          <form
            className="hero-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/products");
            }}
          >
            <Search className="search-icon" />
            <input
              type="search"
              id="heroSearchInput"
              placeholder={placeholder}
              aria-label="Search"
              value=""
              readOnly
            />
            <button type="submit">Search</button>
          </form>
        </div>
      </section>

      {/* =============== FEATURED CATEGORIES =============== */}
      <section className="featured-categories">
        <h2 className="section-title">Featured Categories</h2>
        <p className="section-subtitle">
          Discover our freshest picks in fruits and vegetables.
        </p>

        <div className="featured-grid">
          <Link to="/products?category=fruits" className="featured-card">
            <img src="/assets/images/fruits.jpg" alt="Fruits" />
            <div className="card-info">
              <h3>Fruits</h3>
              <p>Juicy Lebanese fruits for every season.</p>
            </div>
          </Link>

          <Link to="/products?category=vegetables" className="featured-card">
            <img src="/assets/images/vegetables.jpg" alt="Vegetables" />
            <div className="card-info">
              <h3>Vegetables</h3>
              <p>Fresh hand-picked vegetables daily.</p>
            </div>
          </Link>

          <Link to="/products?category=herbs" className="featured-card">
            <img src="/assets/images/categories/herbs.jpg" alt="Herbs" />
            <div className="card-info">
              <h3>Herbs</h3>
              <p>Fragrant herbs to elevate your dishes.</p>
            </div>
          </Link>

          <Link to="/products?category=nuts" className="featured-card">
            <img src="/assets/images/categories/nuts.jpg" alt="Nuts" />
            <div className="card-info">
              <h3>Nuts</h3>
              <p>Crunchy Lebanese and imported nuts.</p>
            </div>
          </Link>

          <Link to="/products?category=pickles" className="featured-card">
            <img src="/assets/images/categories/pickles.jpg" alt="Pickles" />
            <div className="card-info">
              <h3>Pickles</h3>
              <p>Traditional Lebanese homemade pickles.</p>
            </div>
          </Link>

          <Link to="/products?category=featured" className="featured-card">
            <img
              src="/assets/images/categories/local-products.jpg"
              alt="Local Products"
            />
            <div className="card-info">
              <h3>Local Products</h3>
              <p>Authentic local jars and organic goods.</p>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}

export default Categories;
