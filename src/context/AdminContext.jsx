import { createContext, useContext, useState, useEffect } from "react";
import { get, post, put, del } from "../utils/api";

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
};

const LOCAL_PRODUCTS_KEY = "admin_products";
const FALLBACK_PRODUCTS = [
  {
    id: "demo-1",
    name: "Fresh Strawberries",
    category: "fruits",
    categories: ["fruits"],
    price: 5.99,
    priceUnit: "kg",
    unit: "kg",
    stock: 120,
    image: "/assets/images/products/strawberry.jpg",
    featured: true,
    customPrices: {}
  },
  {
    id: "demo-2",
    name: "Organic Bananas",
    category: "fruits",
    categories: ["fruits"],
    price: 2.99,
    priceUnit: "kg",
    unit: "kg",
    stock: 180,
    image: "/assets/images/products/banana.jpg",
    featured: false,
    customPrices: {}
  },
  {
    id: "demo-3",
    name: "Lebanese Cucumbers",
    category: "vegetables",
    categories: ["vegetables"],
    price: 1.5,
    priceUnit: "kg",
    unit: "kg",
    stock: 90,
    image: "/assets/images/products/cucumber.jpg",
    featured: false,
    customPrices: {}
  }
];

const loadLocalProducts = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY));
    if (Array.isArray(stored) && stored.length) return stored;
  } catch (err) {
    console.warn("Failed to parse stored products", err);
  }
  return FALLBACK_PRODUCTS;
};

const persistLocalProducts = (list) => {
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(list));
};

export const AdminProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [backendAvailable, setBackendAvailable] = useState(true);

  // Helper to normalize backend product to UI shape
  const mapProduct = (p) => ({
    id: p._id || p.id,
    name: p.name,
    category: p.category,
    categories: p.categories || (p.category ? [p.category] : []),
    price: p.price,
    priceUnit: p.priceUnit,
    unit: p.unit,
    stock: p.stock,
    image: p.image,
    featured: p.featured,
    isActive: p.isActive,
    customPrices: p.customPrices || {}
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await get("/products");
      if (res.success && Array.isArray(res.data)) {
        setProducts(res.data.map(mapProduct));
      } else if (res.success && Array.isArray(res.data?.data)) {
        setProducts(res.data.data.map(mapProduct));
      } else {
        console.warn("Unexpected products payload", res);
        setProducts([]);
      }
      setBackendAvailable(true);
    } catch (e) {
      console.error("Failed to load products", e);
      setBackendAvailable(false);
      const localProducts = loadLocalProducts();
      setProducts(localProducts);
      setError(
        e.message?.includes("Failed to fetch")
          ? "Backend unreachable. Showing local sample data."
          : e.message || "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  // Generate realistic mock orders (100 orders across 30 days)
  const generateMockOrders = () => {
    const customers = [
      "Sarah K.", "Ahmad D.", "Maya H.", "John M.", "Layla S.", "Rami F.",
      "Nour T.", "Hassan B.", "Lina M.", "Omar Z.", "Zeina A.", "Karim H.",
      "Dalia F.", "Fadi N.", "Rita S.", "Tony R.", "Yasmine K.", "Elie W.",
      "Nada C.", "Joseph L.", "Mira D.", "Ali R.", "Carla M.", "Marc J.",
      "Hala E.", "Sami G.", "Tala H.", "George P.", "Rania Y.", "Paul D."
    ];
    
    const availableProducts = [
      { id: 1, name: "Strawberry", price: 3.50, unit: "kg", image: "/assets/images/products/strawberry.jpg" },
      { id: 2, name: "Orange", price: 2.80, unit: "kg", image: "/assets/images/products/orange.jpg" },
      { id: 3, name: "Banana", price: 2.50, unit: "kg", image: "/assets/images/products/banana.jpg" },
      { id: 4, name: "Apple", price: 3.20, unit: "kg", image: "/assets/images/products/apple.jpg" },
      { id: 5, name: "Tomato", price: 1.80, unit: "kg", image: "/assets/images/products/tomato.jpg" },
      { id: 6, name: "Cucumber", price: 1.60, unit: "pcs", image: "/assets/images/products/cucumber.jpg" },
      { id: 7, name: "Lettuce", price: 1.70, unit: "pcs", image: "/assets/images/products/lettuce.jpg" },
      { id: 8, name: "Mint", price: 1.00, unit: "bunch", image: "/assets/images/products/mint.jpg" },
      { id: 9, name: "Parsley", price: 0.90, unit: "bunch", image: "/assets/images/products/parsley.jpg" },
    ];
    
    const statuses = ["Pending", "Preparing", "Delivered"];
    const mockOrders = [];
    const today = new Date();

    for (let i = 1; i <= 100; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const orderDate = new Date(today);
      orderDate.setDate(today.getDate() - daysAgo);
      
      // Generate random items for this order
      const numItems = Math.floor(Math.random() * 5) + 1; // 1-5 different products
      const orderItems = [];
      let orderTotal = 0;
      
      for (let j = 0; j < numItems; j++) {
        const product = availableProducts[Math.floor(Math.random() * availableProducts.length)];
        const quantity = Math.floor(Math.random() * 4) + 1; // 1-4 quantity
        const itemTotal = product.price * quantity;
        
        orderItems.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          unit: product.unit,
          image: product.image,
          total: parseFloat(itemTotal.toFixed(2))
        });
        
        orderTotal += itemTotal;
      }
      
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const phone = `+961 ${70 + Math.floor(Math.random() * 9)} ${Math.floor(Math.random() * 900000 + 100000)}`;
      
      let status;
      if (daysAgo === 0) {
        status = statuses[Math.floor(Math.random() * 2)];
      } else if (daysAgo <= 2) {
        status = Math.random() > 0.3 ? "Delivered" : statuses[Math.floor(Math.random() * 3)];
      } else {
        status = "Delivered";
      }

      mockOrders.push({
        id: `ORD-${String(i).padStart(4, '0')}`,
        customer,
        phone,
        items: orderItems,
        itemCount: orderItems.length,
        total: parseFloat(orderTotal.toFixed(2)),
        status,
        date: orderDate.toISOString().split('T')[0]
      });
    }

    return mockOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem("admin_orders");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.length >= 50 ? parsed : generateMockOrders();
    }
    return generateMockOrders();
  });

  // Mock Users Data
  const [users, setUsers] = useState([
    { id: 1, name: "Sarah K.", email: "sarah.k@example.com", phone: "+961 70 123 456", orders: 12, joined: "2025-08-15" },
    { id: 2, name: "Ahmad D.", email: "ahmad.d@example.com", phone: "+961 71 234 567", orders: 8, joined: "2025-09-02" },
    { id: 3, name: "Maya H.", email: "maya.h@example.com", phone: "+961 76 345 678", orders: 15, joined: "2025-07-20" },
    { id: 4, name: "John M.", email: "john.m@example.com", phone: "+961 70 456 789", orders: 5, joined: "2025-10-10" },
    { id: 5, name: "Layla S.", email: "layla.s@example.com", phone: "+961 71 567 890", orders: 9, joined: "2025-09-18" },
    { id: 6, name: "Rami F.", email: "rami.f@example.com", phone: "+961 76 678 901", orders: 20, joined: "2025-06-05" },
  ]);

  // Load from backend on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Save orders/users to localStorage (keep mock for now)

  useEffect(() => {
    localStorage.setItem("admin_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("admin_users", JSON.stringify(users));
  }, [users]);

  // Product Functions (Backend integrated)
  const addProduct = async (product) => {
    const fallbackAdd = () => {
      const localProduct = mapProduct({
        ...product,
        _id: `local-${Date.now()}`,
        stock: Number(product.stock) || 0,
        price: Number(product.price) || 0,
        categories: product.categories?.length ? product.categories : [product.category]
      });
      setProducts((prev) => {
        const updated = [...prev, localProduct];
        persistLocalProducts(updated);
        return updated;
      });
      console.log("✅ Product added locally:", localProduct);
      return localProduct;
    };

    if (!backendAvailable) {
      return fallbackAdd();
    }

    try {
      setError("");
      const res = await post("/products", product);
      if (res.success && res.data) {
        const mapped = mapProduct(res.data);
        setProducts((prev) => [...prev, mapped]);
        console.log("✅ Product added:", res.data);
        return mapped;
      }
      throw new Error(res.message || "Create failed");
    } catch (e) {
      console.error("Add product failed", e);
      setError(e.message || "Add product failed");
      setBackendAvailable(false);
      return fallbackAdd();
    }
  };

  const updateProduct = async (id, updatedData) => {
    const fallbackUpdate = () => {
      setProducts((prev) => {
        const updated = prev.map((p) =>
          p.id === id ? { ...p, ...updatedData, price: Number(updatedData.price) || p.price } : p
        );
        persistLocalProducts(updated);
        return updated;
      });
      console.log("✏️ Product updated locally:", id);
    };

    if (!backendAvailable) {
      fallbackUpdate();
      return;
    }

    try {
      setError("");
      const res = await put(`/products/${id}`, updatedData);
      if (res.success && res.data) {
        const updated = mapProduct(res.data);
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
        console.log("✏️ Product updated:", id, updatedData);
      } else {
        throw new Error(res.message || "Update failed");
      }
    } catch (e) {
      console.error("Update product failed", e);
      setError(e.message || "Update product failed");
      setBackendAvailable(false);
      fallbackUpdate();
    }
  };

  const deleteProduct = async (id) => {
    const fallbackDelete = () => {
      setProducts((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        persistLocalProducts(updated);
        return updated;
      });
      console.log("🗑️ Product deleted locally:", id);
    };

    if (!backendAvailable) {
      fallbackDelete();
      return;
    }

    try {
      setError("");
      const res = await del(`/products/${id}`);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        console.log("🗑️ Product deleted:", id);
      } else {
        throw new Error(res.message || "Delete failed");
      }
    } catch (e) {
      console.error("Delete product failed", e);
      setError(e.message || "Delete product failed");
      setBackendAvailable(false);
      fallbackDelete();
    }
  };

  // Order Functions
  const updateOrderStatus = (id, newStatus) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    console.log("📦 Order status updated:", id, "→", newStatus);
  };

  const deleteOrder = (id) => {
    setOrders(orders.filter(o => o.id !== id));
    console.log("🗑️ Order deleted:", id);
  };

  // User Functions
  const deleteUser = (id) => {
    setUsers(users.filter(u => u.id !== id));
    console.log("🗑️ User removed:", id);
  };

  // Statistics
  const getStats = () => {
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalUsers = users.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = orders.filter(o => o.status === "Pending").length;
    const preparingOrders = orders.filter(o => o.status === "Preparing").length;
    const deliveredOrders = orders.filter(o => o.status === "Delivered").length;

    return {
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      pendingOrders,
      preparingOrders,
      deliveredOrders,
    };
  };

  const value = {
    products,
    loading,
    error,
    backendAvailable,
    refreshProducts: fetchProducts,
    orders,
    users,
    addProduct,
    updateProduct,
    deleteProduct,
    updateOrderStatus,
    deleteOrder,
    deleteUser,
    getStats,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
