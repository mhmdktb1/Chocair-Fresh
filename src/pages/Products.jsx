import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Search, User, ShoppingCart } from "lucide-react";
import "../styles/style.css";
import "../styles/products.css";
import Header from "../components/layout/Header";
import { useCart } from "../context/CartContext";

function Products() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [placeholder, setPlaceholder] = useState("");
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();

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

  // Product data (static like your JS)
  const productsData = {
    fruits: [
      { name: "Strawberry", price: "$3.50", unit: "kg", desc: "Fresh and sweet strawberries.", img: "/assets/images/products/strawberry.jpg" },
      { name: "Orange", price: "$2.80", unit: "kg", desc: "Juicy Lebanese oranges.", img: "/assets/images/products/orange.jpg" },
      { name: "Banana", price: "$2.50", unit: "kg", desc: "Perfect ripe bananas.", img: "/assets/images/products/banana.jpg" },
      { name: "Apple", price: "$3.20", unit: "kg", desc: "Crisp red apples for your day.", img: "/assets/images/products/apple.jpg" },
      { name: "Kiwi", price: "$3.90", unit: "kg", desc: "Rich in vitamins and flavor.", img: "/assets/images/products/kiwi.jpg" },
      { name: "Grapes", price: "$3.60", unit: "kg", desc: "Sweet seedless grapes.", img: "/assets/images/products/grapes.jpg" },
      { name: "Watermelon", price: "$5.00", unit: "pcs", desc: "Refreshing juicy watermelon.", img: "/assets/images/products/watermelon.jpg" },
    ],
    vegetables: [
      { name: "Tomato", price: "$1.80", unit: "kg", desc: "Farm-grown Lebanese tomatoes.", img: "/assets/images/products/tomato.jpg" },
      { name: "Cucumber", price: "$1.60", unit: "kg", desc: "Fresh green cucumbers.", img: "/assets/images/products/cucumber.jpg" },
      { name: "Lettuce", price: "$1.70", unit: "pcs", desc: "Crisp and refreshing lettuce.", img: "/assets/images/products/lettuce.jpg" },
      { name: "Onion", price: "$1.10", unit: "kg", desc: "Perfect for salads and dishes.", img: "/assets/images/products/onion.jpg" },
      { name: "Potato", price: "$1.40", unit: "kg", desc: "Golden potatoes for fries or mash.", img: "/assets/images/products/potato.jpg" },
      { name: "Carrot", price: "$1.90", unit: "kg", desc: "Crunchy and full of color.", img: "/assets/images/products/carrot.jpg" },
    ],
    herbs: [
      { name: "Mint", price: "$1.00", unit: "bunch", desc: "Fresh aromatic mint leaves.", img: "/assets/images/products/mint.jpg" },
      { name: "Parsley", price: "$1.20", unit: "bunch", desc: "Perfect for tabbouleh and salads.", img: "/assets/images/products/parsley.jpg" },
      { name: "Thyme", price: "$1.80", unit: "bunch", desc: "Lebanese fresh thyme bundle.", img: "/assets/images/products/thyme.jpg" },
    ],
    nuts: [
      { name: "Almonds", price: "$5.50", unit: "kg", desc: "Roasted and salted almonds.", img: "/assets/images/products/almonds.jpg" },
      { name: "Cashews", price: "$6.00", unit: "kg", desc: "Premium roasted cashews.", img: "/assets/images/products/cashews.jpg" },
      { name: "Pistachio", price: "$7.40", unit: "kg", desc: "Salted Lebanese pistachios.", img: "/assets/images/products/pistachio.jpg" },
      { name: "Walnut", price: "$5.90", unit: "kg", desc: "Fresh Lebanese walnut kernels.", img: "/assets/images/products/walnut.jpg" },
    ],
    pickles: [
      { name: "Mixed Pickles", price: "$3.00", unit: "jar", desc: "Traditional Lebanese homemade mix.", img: "/assets/images/products/pickles.jpg" },
      { name: "Olives", price: "$4.00", unit: "jar", desc: "Green olives from our farms.", img: "/assets/images/products/olives.jpg" },
      { name: "Beet Pickle", price: "$3.40", unit: "jar", desc: "Colorful and tangy beet pickles.", img: "/assets/images/products/beet-pickle.jpg" },
    ],
    featured: [
      { name: "Avocado", price: "$4.80", unit: "kg", desc: "Perfectly ripe creamy avocado.", img: "/assets/images/products/avocado.jpg" },
      { name: "Peach", price: "$3.90", unit: "kg", desc: "Soft and aromatic Lebanese peach.", img: "/assets/images/products/peach.jpg" },
    ],
  };

  const categories = [
    { key: "all", label: "All", icon: "all" },
    { key: "fruits", label: "Fruits", icon: "fruits" },
    { key: "vegetables", label: "Vegetables", icon: "vegetables" },
    { key: "herbs", label: "Herbs", icon: "herbs" },
    { key: "nuts", label: "Nuts", icon: "nuts" },
    { key: "pickles", label: "Pickles", icon: "pickles" },
    { key: "featured", label: "Featured", icon: "featured" },
  ];

  const allProducts = Object.entries(productsData).flatMap(([cat, items]) =>
    items.map((p, index) => ({ ...p, id: `${cat}-${index}`, category: cat }))
  );

  const filteredProducts =
    activeCategory === "all"
      ? allProducts
      : allProducts.filter((p) => p.category === activeCategory);

  return (
    <>
      <Header active="products" variant="products" />

      {/* HERO SMALL */}
      <section className="hero-small">
        <div className="hero-overlay">
          <h1>Our Fresh Selection</h1>
        </div>
      </section>

      {/* CATEGORY BAR */}
      <section className="category-bar" id="categoryBar">
        <div className="categories-scroll" id="categoriesScroll">
          {categories.map((cat) => (
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
              <img src={`/assets/images/icons/${cat.icon}.png`} alt={cat.label} />
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
          {filteredProducts.map((prod, i) => {
            const slug = prod.name.toLowerCase().replace(/\s+/g, "-");
            return (
              <div
                key={i}
                className="product-card"
                data-category={prod.category}
                onClick={() => navigate(`/product/${slug}`, { state: { product: prod } })}
                style={{ cursor: "pointer" }}
              >
                <img src={prod.img} alt={prod.name} />
                <div className="product-info">
                  <h3>{prod.name}</h3>
                  <span className="product-price">
                    {prod.price}
                    {prod.unit && <span className="product-unit"> / {prod.unit}</span>}
                  </span>
                  <p>{prod.desc}</p>
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
          })}
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
