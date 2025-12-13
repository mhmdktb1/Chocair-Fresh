import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Search, User, ShoppingCart } from "lucide-react";
import "../styles/style.css";
import "../styles/products.css";
import Header from "../components/layout/Header";
import Hero from "../components/home/Hero";
import { useCart } from "../context/CartContext";
import { get } from "../utils/api";

function Products() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placeholder, setPlaceholder] = useState("");
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();

  // Fetch products and categories from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          get("/products"),
          get("/categories")
        ]);
        setProducts(productsData);
        setCategories(categoriesData.filter(c => c.isVisible !== false));
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const phrases = [
    "Search for fresh fruits 🍎",
    "Find the best vegetables 🥬",
    "Discover Lebanese products 🇱🇧",
    "Order organic and local 🌿",
    "Your groceries, delivered fast 🚚",
  ];
useEffect(() => {
  const scrollContainer = document.querySelector(".categories-scroll");
  const progressBar = document.querySelector(".category-progress");

  if (scrollContainer && progressBar) {
    const updateProgress = () => {
      const scrollWidth = scrollContainer.scrollWidth - scrollContainer.clientWidth;
      const scrollLeft = scrollContainer.scrollLeft;
      const progress = (scrollLeft / scrollWidth) * 100;
      progressBar.style.width = `${progress}%`;
    };

    scrollContainer.addEventListener("scroll", updateProgress);
    return () => scrollContainer.removeEventListener("scroll", updateProgress);
  }
}, []);

  // Typing animation effect
  useEffect(() => {
    if (index === phrases.length) return;
    const current = phrases[index];
    const timeout = setTimeout(() => {
      setPlaceholder(
        deleting
          ? current.substring(0, subIndex - 1)
          : current.substring(0, subIndex + 1)
      );
      setSubIndex((prev) => prev + (deleting ? -1 : 1));

      if (!deleting && subIndex === current.length) {
        setTimeout(() => setDeleting(true), 1500);
      } else if (deleting && subIndex === 0) {
        setDeleting(false);
        setIndex((prev) => (prev + 1) % phrases.length);
      }
    }, deleting ? 45 : 90);

    return () => clearTimeout(timeout);
  }, [subIndex, deleting, index]);

  // Initialize category from URL (?category=...) and search query
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get("category");
    const searchQuery = params.get("search");
    
    if (cat) {
      setActiveCategory(cat);
    }
    
    if (searchQuery) {
      console.log("🔍 Search query:", searchQuery);
      // You can implement search filtering logic here
      // For now, it just logs and shows all products
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Scroll effect for category bar sticky (Header handles its own scroll state)
  useEffect(() => {
    const categoryBar = document.querySelector(".category-bar");
    const hero = document.querySelector(".hero-small");

    const onScroll = () => {
      const heroBottom = hero.offsetTop + hero.offsetHeight;
      categoryBar.classList.toggle("sticky", window.scrollY >= heroBottom - 100);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Category horizontal scroll progress indicator
  useEffect(() => {
    const categoriesScroll = document.querySelector(".categories-scroll");
    const progressBar = document.querySelector(".category-progress");

    if (!categoriesScroll || !progressBar) return;

    const updateProgress = () => {
      const scrollLeft = categoriesScroll.scrollLeft;
      const scrollWidth = categoriesScroll.scrollWidth;
      const clientWidth = categoriesScroll.clientWidth;
      const maxScroll = scrollWidth - clientWidth;

      if (maxScroll > 0) {
        // Start at 15% minimum to show the indicator, then grow to 100%
        const scrollProgress = (scrollLeft / maxScroll) * 85; // 85% range
        const progress = 15 + scrollProgress; // 15% base + scroll progress
        progressBar.style.width = `${progress}%`;
      } else {
        progressBar.style.width = "100%";
      }
    };

    categoriesScroll.addEventListener("scroll", updateProgress);
    // Initialize on mount
    updateProgress();

    return () => categoriesScroll.removeEventListener("scroll", updateProgress);
  }, []);


  const categoryList = [
    { key: "all", label: "All", icon: "/assets/images/icons/all.png" },
    ...categories.map(cat => ({
      key: cat.name, // Assuming product.category matches category.name
      label: cat.name,
      icon: cat.image // Use category image as icon
    }))
  ];

  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <>
      <Header active="products" variant="products" />

      {/* HERO SMALL */}
      <Hero page="products" />

      {/* CATEGORY BAR */}
      <section className="category-bar" id="categoryBar">
        <div className="categories-scroll" id="categoriesScroll">
          {categoryList.map((cat) => (
            <div
              key={cat.key}
              className={`cat-item ${activeCategory === cat.key ? "active" : ""}`}
              data-category={cat.key}
              onClick={() => {
                setActiveCategory(cat.key);
                const params = new URLSearchParams(location.search);
                params.set("category", cat.key);
                navigate({ pathname: "/products", search: params.toString() }, { replace: true });
              }}
            >
              <img 
                src={cat.icon} 
                alt={cat.label} 
                onError={(e) => { 
                  // Fallback if icon fails or is not a full URL
                  if (!e.target.src.includes('assets')) {
                     e.target.src = `/assets/images/icons/${cat.key.toLowerCase()}.png`;
                  } else {
                     e.target.style.display = 'none'; 
                  }
                }} 
                style={{ width: '30px', height: '30px', objectFit: 'contain' }}
              />
              <span>{cat.label}</span>
            </div>
          ))}
        </div>
        {/* Scroll Progress Indicator (kept if present in CSS) */}
        <div className="category-progress"></div>
      </section>

      {/* PRODUCTS GRID */}
      <section className="products-section">
        <div className="products-grid">
          {loading ? (
            <div style={{ textAlign: "center", padding: "50px", width: "100%" }}>Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px", width: "100%" }}>No products found.</div>
          ) : (
            filteredProducts.map((prod, i) => {
              const slug = prod.name.toLowerCase().replace(/\s+/g, "-");
              return (
                <div
                  key={prod._id || i}
                  className="product-card"
                  data-category={prod.category}
                  onClick={() => navigate(`/product/${slug}`, { state: { product: prod } })}
                  style={{ cursor: "pointer" }}
                >
                  <img src={prod.image || prod.img} alt={prod.name} />
                  <div className="product-info">
                    <h3>{prod.name}</h3>
                    <span className="product-price">
                      ${typeof prod.price === 'number' ? prod.price.toFixed(2) : prod.price}
                      {prod.unit && <span className="product-unit"> / {prod.unit}</span>}
                    </span>
                    <p>{prod.description || prod.desc}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(prod, 1);
                        console.log("Added to cart:", prod.name);
                      }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          textAlign: "center",
          padding: "30px 10px",
          color: "#555",
          fontSize: "0.9rem",
        }}
      >
        © 2025 <b>Chocair Fresh</b> — Delivering Lebanon’s finest produce 🍃
      </footer>
    </>
  );
}

export default Products;
