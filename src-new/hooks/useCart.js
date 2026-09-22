import { useState, useEffect } from 'react';

export const useCartLogic = () => {
  const [cartItems, setCartItems] = useState(() => {
    // Initialize from localStorage
    try {
      const savedCart = localStorage.getItem('guestCart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('guestCart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  const addToCart = (product, quantity = 1, instruction = undefined) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === product._id);
      if (existingItem) {
        return prevItems.map(item => 
          item._id === product._id 
            ? { 
                ...item, 
                quantity: item.quantity + quantity,
                instruction: instruction !== undefined ? instruction : (item.instruction || product.instruction || '')
              } 
            : item
        );
      }
      return [...prevItems, { 
        ...product, 
        quantity, 
        instruction: instruction !== undefined ? instruction : (product.instruction || '') 
      }];
    });
    setIsCartOpen(true); // Open cart when adding item
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId, newQuantity, instruction = undefined) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prevItems => 
      prevItems.map(item => 
        item._id === productId 
          ? { 
              ...item, 
              quantity: newQuantity,
              ...(instruction !== undefined ? { instruction } : {})
            } 
          : item
      )
    );
  };

  const updateItemInstruction = (productId, instruction) => {
    setCartItems(prevItems => 
      prevItems.map(item => 
        item._id === productId 
          ? { ...item, instruction } 
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemInstruction,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    cartCount,
    cartTotal
  };
};
