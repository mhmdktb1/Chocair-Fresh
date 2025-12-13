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

export const AdminProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  const [users, setUsers] = useState([]); // Keep empty for now or fetch if backend has it
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper to normalize backend product to UI shape
  const mapProduct = (p) => ({
    id: p._id,
    name: p.name,
    category: p.category,
    categories: [p.category], // Backend only has single category
    price: p.price,
    priceUnit: "kg", // Default
    unit: "kg", // Default
    stock: p.countInStock,
    image: p.image,
    description: p.description,
    brand: p.brand,
    featured: false, // Not in backend
    customPrices: {} // Not in backend
  });

  // Helper to normalize backend order to UI shape
  const mapOrder = (o) => ({
    id: o._id,
    customer: o.customerInfo?.name || "Guest",
    email: o.customerInfo?.email,
    phone: o.customerInfo?.phone,
    items: o.orderItems.map(item => ({
      name: item.name,
      quantity: item.qty,
      price: item.price,
      total: item.qty * item.price,
      image: item.image,
      unit: "kg"
    })),
    total: o.totalPrice,
    status: o.status || "Pending",
    date: o.createdAt,
    shippingAddress: o.customerInfo
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await get("/products");
      setProducts(data.map(mapProduct));
    } catch (e) {
      console.error("Failed to load products", e);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await get("/orders");
      setOrders(data.map(mapOrder));
    } catch (e) {
      console.error("Failed to load orders", e);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await get("/categories");
      setCategories(data);
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  const fetchHeroes = async () => {
    try {
      const data = await get("/hero");
      setHeroSlides(data);
    } catch (e) {
      console.error("Failed to load hero slides", e);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchCategories();
    fetchHeroes();
  }, []);

  const addProduct = async (productData) => {
    try {
      // Map UI data to Backend data
      const payload = {
        name: productData.name,
        price: parseFloat(productData.price),
        description: productData.description || "No description",
        image: productData.image,
        brand: productData.brand || "Chocair",
        category: productData.category,
        countInStock: parseInt(productData.stock),
        unit: productData.unit || "kg",
      };

      const data = await post("/products", payload);
      const newProduct = mapProduct(data);
      setProducts((prev) => [...prev, newProduct]);
      return newProduct;
    } catch (e) {
      console.error("Add product failed", e);
      throw e;
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      const payload = {
        name: productData.name,
        price: parseFloat(productData.price),
        description: productData.description || "No description",
        image: productData.image,
        brand: productData.brand || "Chocair",
        category: productData.category,
        countInStock: parseInt(productData.stock),
        unit: productData.unit || "kg",
      };

      const data = await put(`/products/${id}`, payload);
      const updated = mapProduct(data);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (e) {
      console.error("Update product failed", e);
      throw e;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await del(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error("Delete product failed", e);
      throw e;
    }
  };

  // Order Functions
  const updateOrderStatus = async (id, newStatus) => {
    try {
      const data = await put(`/orders/${id}/status`, { status: newStatus });
      const updated = mapOrder(data);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      return updated;
    } catch (e) {
      console.error("Update order status failed", e);
      throw e;
    }
  };

  const deleteOrder = async (id) => {
    try {
      await del(`/orders/${id}`);
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (e) {
      console.error("Delete order failed", e);
      throw e;
    }
  };

  const deleteUser = (id) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const getStats = () => {
    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalUsers: users.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
      pendingOrders: orders.filter(o => o.status === "Pending").length,
      preparingOrders: orders.filter(o => o.status === "Preparing").length,
      deliveredOrders: orders.filter(o => o.status === "Delivered").length,
    };
  };

  const addCategory = async (categoryData) => {
    try {
      const data = await post("/categories", categoryData);
      setCategories((prev) => [...prev, data]);
      return { success: true };
    } catch (e) {
      console.error("Failed to add category", e);
      return { success: false, message: e.message };
    }
  };

  const updateCategory = async (id, categoryData) => {
    try {
      const data = await put(`/categories/${id}`, categoryData);
      setCategories((prev) => prev.map((c) => (c._id === id ? data : c)));
      return { success: true };
    } catch (e) {
      console.error("Failed to update category", e);
      return { success: false, message: e.message };
    }
  };

  const deleteCategory = async (id) => {
    try {
      await del(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      return { success: true };
    } catch (e) {
      console.error("Failed to delete category", e);
      return { success: false, message: e.message };
    }
  };

  const addHeroSlide = async (slideData) => {
    try {
      const data = await post("/hero", slideData);
      setHeroSlides((prev) => [...prev, data]);
      return { success: true };
    } catch (e) {
      console.error("Failed to add hero slide", e);
      return { success: false, message: e.message };
    }
  };

  const updateHeroSlide = async (id, slideData) => {
    try {
      const data = await put(`/hero/${id}`, slideData);
      setHeroSlides((prev) => prev.map((s) => (s._id === id ? data : s)));
      return { success: true };
    } catch (e) {
      console.error("Failed to update hero slide", e);
      return { success: false, message: e.message };
    }
  };

  const deleteHeroSlide = async (id) => {
    try {
      await del(`/hero/${id}`);
      setHeroSlides((prev) => prev.filter((s) => s._id !== id));
      return { success: true };
    } catch (e) {
      console.error("Failed to delete hero slide", e);
      return { success: false, message: e.message };
    }
  };

  const value = {
    products,
    categories,
    heroSlides,
    loading,
    error,
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
    addCategory,
    updateCategory,
    deleteCategory,
    addHeroSlide,
    updateHeroSlide,
    deleteHeroSlide,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

