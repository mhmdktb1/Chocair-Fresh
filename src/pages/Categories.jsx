import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Hero from "../components/home/Hero";
import { Menu, Search, User, ShoppingCart } from "lucide-react";
import { get } from "../utils/api";
import "../styles/style.css";
import "../styles/categories.css";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placeholder, setPlaceholder] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await get("/categories");
        setCategories(data.filter(cat => cat.isVisible !== false));
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

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
      <Hero page="categories" />

      {/* =============== FEATURED CATEGORIES =============== */}
      <section className="featured-categories">
        <h2 className="section-title">Featured Categories</h2>
        <p className="section-subtitle">
          Discover our freshest picks in fruits and vegetables.
        </p>

        <div className="featured-grid">
          {loading ? (
            <div style={{ textAlign: "center", width: "100%", padding: "40px" }}>Loading categories...</div>
          ) : categories.length === 0 ? (
            <div style={{ textAlign: "center", width: "100%", padding: "40px" }}>No categories found.</div>
          ) : (
            categories.map((cat) => (
              <Link to={`/products?category=${cat.name}`} className="featured-card" key={cat._id}>
                <img src={cat.image} alt={cat.name} onError={(e) => { e.target.src = '/assets/images/placeholder.jpg'; }} />
                <div className="card-info">
                  <h3>{cat.name}</h3>
                  <p>{cat.description || "Fresh products"}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </>
  );
}

export default Categories;
