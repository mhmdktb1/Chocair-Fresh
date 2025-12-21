import React, { createContext, useContext } from 'react';
import { useCartLogic } from '../hooks/useCart';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const cartLogic = useCartLogic();

  return (
    <CartContext.Provider value={cartLogic}>
      {children}
    </CartContext.Provider>
  );
};
