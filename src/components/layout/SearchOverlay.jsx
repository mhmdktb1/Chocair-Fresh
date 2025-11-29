import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import "../../styles/searchOverlay.css";

function SearchOverlay({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Focus input when overlay opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("🔍 Searching for:", searchQuery);
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      onClose();
      setSearchQuery("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`search-overlay ${isOpen ? "active" : ""}`} onClick={onClose}>
      <div className="search-overlay-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-search-btn" onClick={onClose} aria-label="Close search">
          <X size={24} />
        </button>

        <form className="search-form" onSubmit={handleSearch}>
          <Search className="search-form-icon" size={28} />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search for fruits, vegetables, herbs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          <button type="submit" className="search-submit-btn">
            Search
          </button>
        </form>

        <div className="search-suggestions">
          <p className="suggestions-title">Popular Searches:</p>
          <div className="suggestion-tags">
            {["Apples 🍎", "Tomatoes 🍅", "Lettuce 🥬", "Oranges 🍊", "Bananas 🍌", "Herbs 🌿"].map((tag) => (
              <button
                key={tag}
                className="suggestion-tag"
                onClick={() => {
                  setSearchQuery(tag.split(" ")[0]);
                  inputRef.current?.focus();
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchOverlay;
