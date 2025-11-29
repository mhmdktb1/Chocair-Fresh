import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("chocair_cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to load cart:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("chocair_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    console.log("Adding to cart:", product, "Quantity:", quantity);
    
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      
      if (existingItem) {
        // Update quantity if item already in cart
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, qty: item.qty + quantity }
            : item
        );
      } else {
        // Add new item to cart
        return [...prevItems, { ...product, qty: quantity }];
      }
    });
  };

  const removeFromCart = (productId) => {
    console.log("Removing from cart:", productId);
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    console.log("Updating quantity:", productId, "New qty:", newQuantity);
    
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, qty: newQuantity } : item
      )
    );
  };

  const clearCart = () => {
    console.log("Clearing cart");
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = typeof item.price === 'string' 
        ? parseFloat(item.price.replace('$', '')) 
        : item.price;
      return total + (price * item.qty);
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.qty, 0);
  };

  const isInCart = (productId) => {
    return cartItems.some((item) => item.id === productId);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
