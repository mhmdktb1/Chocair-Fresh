import { createContext, useContext, useState, useEffect } from "react";

const FavoritesContext = createContext();

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem("chocair_favorites");
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error("Failed to load favorites:", error);
      }
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("chocair_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const getId = (item) => item._id || item.id;

  const addToFavorites = (product) => {
    console.log("Adding to favorites:", product);
    
    setFavorites((prevFavorites) => {
      const alreadyFavorite = prevFavorites.some((item) => getId(item) === getId(product));
      if (alreadyFavorite) {
        return prevFavorites;
      }
      return [...prevFavorites, product];
    });
  };

  const removeFromFavorites = (productId) => {
    console.log("Removing from favorites:", productId);
    setFavorites((prevFavorites) =>
      prevFavorites.filter((item) => getId(item) !== productId)
    );
  };

  const toggleFavorite = (product) => {
    const id = getId(product);
    const isFav = favorites.some((item) => getId(item) === id);
    if (isFav) {
      removeFromFavorites(id);
    } else {
      addToFavorites(product);
    }
  };

  const isFavorite = (productId) => {
    return favorites.some((item) => getId(item) === productId);
  };

  const clearFavorites = () => {
    console.log("Clearing all favorites");
    setFavorites([]);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        toggleFavorite,
        isFavorite,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
