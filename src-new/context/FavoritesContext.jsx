import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('cf_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse wishlist', e);
      return [];
    }
  });

  // Sync favorites state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cf_wishlist', JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save wishlist', e);
    }
  }, [favorites]);

  // Check if a product ID is favorited
  const isFavorite = useCallback((productId) => {
    if (!productId) return false;
    const idStr = productId.toString();
    return favorites.includes(idStr);
  }, [favorites]);

  // Toggle favorite status with a toast notification
  const toggleFavorite = useCallback((product, silent = false) => {
    if (!product) return;
    const id = (product._id || product.id || product).toString();
    const productName = product.name || 'Item';

    setFavorites(prev => {
      const exists = prev.includes(id);
      if (exists) {
        if (!silent) toast.info(`${productName} removed from favorites`);
        return prev.filter(item => item !== id);
      } else {
        if (!silent) toast.success(`${productName} added to favorites! ❤️`);
        return [...prev, id];
      }
    });
  }, []);

  const addFavorite = useCallback((product, silent = false) => {
    if (!product) return;
    const id = (product._id || product.id || product).toString();
    const productName = product.name || 'Item';

    setFavorites(prev => {
      if (!prev.includes(id)) {
        if (!silent) toast.success(`${productName} added to favorites! ❤️`);
        return [...prev, id];
      }
      return prev;
    });
  }, []);

  const removeFavorite = useCallback((productId, silent = false) => {
    if (!productId) return;
    const id = (productId._id || productId.id || productId).toString();

    setFavorites(prev => {
      if (prev.includes(id)) {
        if (!silent) toast.info('Removed from favorites');
        return prev.filter(item => item !== id);
      }
      return prev;
    });
  }, []);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoritesCount: favorites.length,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesContext;
