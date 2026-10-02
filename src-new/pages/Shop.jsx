import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  ShoppingBag, 
  Sparkles, 
  ArrowRight,
  RotateCcw,
  Tag,
  Check,
  ChevronRight,
  SlidersHorizontal,
  Flame,
  LayoutGrid,
  List,
  Clock,
  ArrowLeft
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import ProductCard from '../components/shop/ProductCard';
import Loading from '../components/common/Loading';
import { useAdmin } from '../context/AdminContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { translations } from '../utils/translations';
import { formatCurrency } from '../utils/formatters';
import { matchesProductQuery } from '../utils/productTranslation';
import { getAssetUrl } from '../utils/api';
import './Shop.css';

const getCategoryEmoji = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('deal') || n.includes('offer') || n.includes('discount') || n.includes('sale')) return '🔥';
  if (n.includes('seasonal')) return '🍉';
  if (n.includes('fruit') || n.includes('apple') || n.includes('berry')) return '🍎';
  if (n.includes('veg') || n.includes('greens') || n.includes('salad')) return '🥦';
  if (n.includes('herb') || n.includes('mint') || n.includes('parsley')) return '🌿';
  if (n.includes('cooked') || n.includes('roasted')) return '🥜';
  if (n.includes('raw') || n.includes('almond') || n.includes('walnut')) return '🌰';
  if (n.includes('date') || n.includes('medjool')) return '🌴';
  if (n.includes('nut')) return '🌰';
  if (n.includes('dairy') || n.includes('milk') || n.includes('cheese') || n.includes('egg')) return '🥛';
  return '✨';
};

const getSubCategoryEmoji = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('apple')) return '🍎';
  if (n.includes('grape')) return '🍇';
  if (n.includes('citrus') || n.includes('orange') || n.includes('lemon') || n.includes('clementin') || n.includes('grapefruit')) return '🍊';
  if (n.includes('banana') || n.includes('tropical') || n.includes('kiwi') || n.includes('avocado') || n.includes('mango') || n.includes('pineapple')) return '🍌';
  if (n.includes('berr') || n.includes('strawberr') || n.includes('cherri') || n.includes('blueberr')) return '🍓';
  if (n.includes('stone') || n.includes('peach') || n.includes('apricot') || n.includes('plum') || n.includes('nectarin')) return '🍑';
  if (n.includes('melon') || n.includes('watermelon') || n.includes('cantaloupe')) return '🍉';
  if (n.includes('fig') || n.includes('pomegranate')) return '🫐';
  if (n.includes('tomato') || n.includes('cucumber')) return '🍅';
  if (n.includes('leaf') || n.includes('green') || n.includes('spinach') || n.includes('lettuce') || n.includes('salad')) return '🥬';
  if (n.includes('root') || n.includes('potato') || n.includes('carrot') || n.includes('onion') || n.includes('garlic')) return '🥕';
  if (n.includes('pepper') || n.includes('squash') || n.includes('eggplant') || n.includes('zucchini')) return '🫑';
  if (n.includes('herb') || n.includes('mint') || n.includes('parsley') || n.includes('basil') || n.includes('zaatar') || n.includes('thyme')) return '🌿';
  if (n.includes('raw nut') || n.includes('almond') || n.includes('walnut') || n.includes('nut')) return '🌰';
  if (n.includes('roasted') || n.includes('cashew') || n.includes('peanut') || n.includes('pistachio')) return '🥜';
  if (n.includes('date') || n.includes('medjool')) return '🌴';
  if (n.includes('juice') || n.includes('smoothie')) return '🧃';
  if (n.includes('egg') || n.includes('cheese') || n.includes('dairy') || n.includes('milk')) return '🧀';
  if (n.includes('mouneh') || n.includes('jam') || n.includes('pickle') || n.includes('olive')) return '🫒';
  if (n.includes('ready') || n.includes('cup') || n.includes('bowl') || n.includes('snack')) return '🥗';
  return '🏷️';
};

// Helper to find a representative image for category / subcategory visual card
const getSubCategoryImage = (subName, catName, products = [], adminCategories = []) => {
  // If 'all', return category image or first product of that category
  if (!subName || subName.toLowerCase() === 'all') {
    if (catName && catName !== 'all') {
      const adminCat = adminCategories.find(c => c.name?.toLowerCase() === catName.toLowerCase());
      if (adminCat?.image) return getAssetUrl(adminCat.image);
      const firstCatProd = products.find(p => String(p.category || '').trim().toLowerCase() === String(catName).trim().toLowerCase() && p.image);
      if (firstCatProd?.image) return getAssetUrl(firstCatProd.image);
    }
    return '';
  }

  // 1. Check if there's a product in this specific category & subcategory with an image
  const targetCat = String(catName || '').trim().toLowerCase();
  const targetSub = String(subName || '').trim().toLowerCase();

  const directMatch = products.find(p => {
    const pCat = String(p.category || '').trim().toLowerCase();
    const pSub = String(p.subCategory || '').trim().toLowerCase();
    if (targetCat && targetCat !== 'all') {
      return pCat === targetCat && pSub === targetSub && p.image;
    }
    return pSub === targetSub && p.image;
  });

  if (directMatch?.image) {
    return getAssetUrl(directMatch.image);
  }

  // 2. Fallback to any product matching subCategory name
  const globalMatch = products.find(p => 
    String(p.subCategory || '').trim().toLowerCase() === targetSub && p.image
  );
  if (globalMatch?.image) {
    return getAssetUrl(globalMatch.image);
  }

  return '';
};

const Shop = () => {
  const { products, categories: adminCategories, loading, error } = useAdmin();
  const { cartItems, cartCount, cartTotal } = useCart();
  const { language } = useTheme();
  const t = translations[language] || translations.en;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'all';
  const initialSubCategory = searchParams.get('subCategory') || searchParams.get('subcategory') || 'all';
  const shouldFocusSearch = searchParams.get('focus') === 'search';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState(initialSubCategory);
  const [activeSpyCategory, setActiveSpyCategory] = useState('all');
  const [sortOption, setSortOption] = useState('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const searchInputRef = useRef(null);
  const categoryTrackRef = useRef(null);
  const subCategoryTrackRef = useRef(null);
  const sectionRefs = useRef({});

  // Sync category & subcategory with URL search params
  useEffect(() => {
    const cat = searchParams.get('category');
    const subCat = searchParams.get('subCategory') || searchParams.get('subcategory');
    if (cat) {
      setSelectedCategory(cat);
    } else {
      setSelectedCategory('all');
    }
    if (subCat) {
      setSelectedSubCategory(subCat);
    } else {
      setSelectedSubCategory('all');
    }
  }, [searchParams]);

  // Focus search input when requested via URL param (e.g. from bottom nav)
  useEffect(() => {
    if (shouldFocusSearch && searchInputRef.current) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [shouldFocusSearch]);

  // Categories list with count - dynamically derived from products AND adminCategories
  const categoriesList = useMemo(() => {
    const allCount = products.length;
    const allCat = { id: 'all', name: 'All Products', count: allCount, emoji: '✨' };

    // Count products with active discount
    const discountedProducts = products.filter(p => 
      p.isDiscounted || (p.discountPercent > 0) || (p.originalPrice && p.originalPrice > p.price) || (p.discount?.isActive && Number(p.discount?.value) > 0)
    );
    const offersCount = discountedProducts.length;

    const offersCat = offersCount > 0 ? {
      id: 'offers',
      name: 'Offers',
      emoji: '🔥',
      count: offersCount,
      isOffers: true
    } : null;

    // 1. Collect all category names from products (excluding offers/all to avoid duplicates)
    const productCatNames = Array.from(
      new Set(
        products
          .map(p => p.category ? String(p.category).trim() : null)
          .filter(c => c && c.toLowerCase() !== 'offers' && c.toLowerCase() !== 'all')
      )
    );

    // 2. Collect category names from adminCategories
    const adminCatNames = (adminCategories || [])
      .filter(c => c.isVisible !== false && c.name?.toLowerCase() !== 'offers' && c.name?.toLowerCase() !== 'all')
      .map(c => String(c.name).trim())
      .filter(Boolean);

    // 3. Union of all unique category names
    const allUniqueNames = Array.from(new Set([...adminCatNames, ...productCatNames]));

    const mapped = allUniqueNames.map(catName => {
      const adminCat = (adminCategories || []).find(
        c => String(c.name).trim().toLowerCase() === catName.toLowerCase()
      );
      const count = products.filter(p => 
        String(p.category || '').trim().toLowerCase() === catName.toLowerCase()
      ).length;

      return {
        id: adminCat?._id || catName,
        name: catName,
        image: adminCat?.image,
        emoji: getCategoryEmoji(catName),
        count
      };
    }).filter(c => c.count > 0);

    return offersCat ? [allCat, offersCat, ...mapped] : [allCat, ...mapped];
  }, [adminCategories, products]);

  const isOffersSelected = useMemo(() => {
    const sel = String(selectedCategory || '').trim().toLowerCase();
    return sel === 'offers' || sel === 'offer' || sel === 'deals' || sel === 'deal' || sel === 'discounts' || sel === 'discount' || sel === 'special offers' || searchParams.get('discount') === 'true' || searchParams.get('discounted') === 'true';
  }, [selectedCategory, searchParams]);

  const selectedCategoryObj = useMemo(() => {
    if (isOffersSelected) {
      const found = categoriesList.find(c => c.id === 'offers' || c.name?.toLowerCase() === 'offers');
      return found || { id: 'offers', name: 'Offers', emoji: '🔥', count: 0 };
    }
    return categoriesList.find(
      c => c.id === selectedCategory || c.name?.toLowerCase() === String(selectedCategory)?.toLowerCase()
    );
  }, [categoriesList, selectedCategory, isOffersSelected]);

  // Filter & Sort Logic for full/filtered list
  const filteredProducts = useMemo(() => {
    let result = products;

    // 1. Search Query (Bilingual English & Arabic)
    if (searchQuery.trim()) {
      result = result.filter(p => matchesProductQuery(p, searchQuery));
    }

    // 2. In Stock filter
    if (onlyInStock) {
      result = result.filter(p => p.stock === undefined || p.stock > 0);
    }

    // 3. On Sale filter
    if (onlyDiscounted) {
      result = result.filter(p => p.isDiscounted || (p.discountPercent > 0) || (p.originalPrice && p.originalPrice > p.price) || (p.discount?.isActive && p.discount?.value > 0));
    }

    // 4. Sorting
    const sorted = [...result];
    if (sortOption === 'price-asc') sorted.sort((a, b) => (a.finalPrice || a.price) - (b.finalPrice || b.price));
    else if (sortOption === 'price-desc') sorted.sort((a, b) => (b.finalPrice || b.price) - (a.finalPrice || a.price));
    else if (sortOption === 'name-asc') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOption === 'discount') {
      sorted.sort((a, b) => {
        const discA = a.discountPercent || (a.originalPrice && a.originalPrice > a.price ? ((a.originalPrice - a.price) / a.originalPrice) * 100 : 0);
        const discB = b.discountPercent || (b.originalPrice && b.originalPrice > b.price ? ((b.originalPrice - b.price) / b.originalPrice) * 100 : 0);
        return discB - discA;
      });
    }

    return sorted;
  }, [products, searchQuery, onlyInStock, onlyDiscounted, sortOption]);

  // Available subcategories list for currently selected category or search results
  const subCategoriesList = useMemo(() => {
    if (selectedCategory === 'all' && !searchQuery.trim() && !isOffersSelected) {
      // When on "All", show main categories as visual cards in the subcategory rail
      const mainCategories = categoriesList.filter(c => c.id !== 'all');
      return mainCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        emoji: cat.emoji,
        image: cat.image || getSubCategoryImage('all', cat.name, products, adminCategories),
        count: cat.count,
        isCategoryCard: true
      }));
    }

    if (isOffersSelected) {
      return [];
    }

    if (searchQuery.trim() && selectedCategory === 'all') {
      const subCatMap = new Map();
      filteredProducts.forEach(p => {
        if (p.subCategory && p.subCategory.trim()) {
          const s = p.subCategory.trim();
          subCatMap.set(s, (subCatMap.get(s) || 0) + 1);
        }
      });
      if (subCatMap.size === 0) return [];
      return Array.from(subCatMap.entries()).map(([name, count]) => ({
        id: name,
        name,
        emoji: getSubCategoryEmoji(name),
        image: getSubCategoryImage(name, null, products, adminCategories),
        count,
        isCategoryCard: false
      }));
    }

    const targetCatName = selectedCategoryObj?.name || selectedCategory;
    const adminCat = (adminCategories || []).find(
      c => String(c.name).trim().toLowerCase() === String(targetCatName).trim().toLowerCase()
    );

    const modelSubCats = Array.isArray(adminCat?.subCategories) ? adminCat.subCategories : [];

    // Products belonging to this category
    const catProducts = products.filter(p =>
      String(p.category || '').trim().toLowerCase() === String(targetCatName).trim().toLowerCase()
    );

    const productSubCats = catProducts
      .map(p => p.subCategory ? String(p.subCategory).trim() : null)
      .filter(Boolean);

    const allUniqueSubCats = Array.from(new Set([...modelSubCats, ...productSubCats]));

    if (allUniqueSubCats.length === 0) return [];

    const mapped = allUniqueSubCats.map(subName => {
      const count = catProducts.filter(p =>
        p.subCategory && p.subCategory.trim().toLowerCase() === subName.toLowerCase()
      ).length;
      return {
        id: subName,
        name: subName,
        emoji: getSubCategoryEmoji(subName),
        image: getSubCategoryImage(subName, targetCatName, products, adminCategories),
        count,
        isCategoryCard: false
      };
    }).filter(s => s.count > 0);

    return mapped;
  }, [selectedCategory, selectedCategoryObj, isOffersSelected, searchQuery, filteredProducts, adminCategories, products, categoriesList]);

  // Representative image for the "All" subcategory card
  const allSubCardImage = useMemo(() => {
    if (selectedCategory === 'all') {
      const firstWithImage = products.find(p => p.image);
      return firstWithImage ? getAssetUrl(firstWithImage.image) : '';
    }
    const targetCatName = selectedCategoryObj?.name || selectedCategory;
    return getSubCategoryImage('all', targetCatName, products, adminCategories);
  }, [selectedCategory, selectedCategoryObj, products, adminCategories]);

  // Center active category tab in rail whenever selected category changes
  useEffect(() => {
    const activeId = selectedCategory === 'all' ? 'all' : (selectedCategoryObj?.id || selectedCategory);
    const activeBtn = document.getElementById(`tab-btn-${activeId}`);
    if (activeBtn && categoryTrackRef.current) {
      const track = categoryTrackRef.current;
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      const trackWidth = track.offsetWidth;
      track.scrollTo({
        left: btnLeft - (trackWidth / 2) + (btnWidth / 2),
        behavior: 'smooth'
      });
    }
  }, [selectedCategory, selectedCategoryObj]);

  // Center active subcategory tab in sub rail whenever selected subcategory changes
  useEffect(() => {
    if (!selectedSubCategory || selectedSubCategory === 'all') {
      const allSubBtn = document.getElementById('subtab-btn-all');
      if (allSubBtn && subCategoryTrackRef.current) {
        subCategoryTrackRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
      return;
    }
    const activeSubBtn = document.getElementById(`subtab-btn-${selectedSubCategory}`);
    if (activeSubBtn && subCategoryTrackRef.current) {
      const track = subCategoryTrackRef.current;
      const btnLeft = activeSubBtn.offsetLeft;
      const btnWidth = activeSubBtn.offsetWidth;
      const trackWidth = track.offsetWidth;
      track.scrollTo({
        left: btnLeft - (trackWidth / 2) + (btnWidth / 2),
        behavior: 'smooth'
      });
    }
  }, [selectedSubCategory]);

  // Group products by category for the Toters horizontal rows
  const categorizedSections = useMemo(() => {
    const realCategories = categoriesList.filter(c => c.id !== 'all' && c.id !== 'offers' && c.name?.toLowerCase() !== 'offers');
    
    const sections = [];

    // 1. If there are active discounted products, put the Offers row at the top!
    const offersItems = filteredProducts.filter(p => 
      p.isDiscounted || (p.discountPercent > 0) || (p.originalPrice && p.originalPrice > p.price) || (p.discount?.isActive && Number(p.discount?.value) > 0)
    );

    if (offersItems.length > 0) {
      sections.push({
        id: 'offers',
        name: 'Offers & Discounts',
        emoji: '🔥',
        items: offersItems,
        count: offersItems.length
      });
    }

    // 2. Standard categories
    realCategories.forEach(cat => {
      const items = filteredProducts.filter(p => 
        String(p.category || '').trim().toLowerCase() === String(cat.name).trim().toLowerCase()
      );
      if (items.length > 0) {
        sections.push({
          ...cat,
          items
        });
      }
    });

    // 3. Uncategorized fallback
    const categorizedProductIds = new Set(
      realCategories.flatMap(cat => 
        filteredProducts
          .filter(p => String(p.category || '').trim().toLowerCase() === String(cat.name).trim().toLowerCase())
          .map(p => p._id || p.id)
      )
    );
    const uncatItems = filteredProducts.filter(
      p => !categorizedProductIds.has(p._id || p.id) && !offersItems.some(op => (op._id || op.id) === (p._id || p.id))
    );

    if (uncatItems.length > 0) {
      sections.push({
        id: 'other',
        name: 'Fresh Harvest & More',
        emoji: '🌿',
        items: uncatItems,
        count: uncatItems.length
      });
    }

    return sections;
  }, [categoriesList, filteredProducts]);

  // ScrollSpy to track active section while scrolling in "All" view with calm, non-laggy centering
  useEffect(() => {
    if (selectedCategory !== 'all' || searchQuery) return;

    let rafId = null;
    let scrollTimeout = null;
    let currentSection = 'all';

    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const scrollPosition = window.scrollY + 220;
        let detectedSection = 'all';

        // Check if user is near top
        if (window.scrollY < 120) {
          detectedSection = 'all';
        } else {
          for (const section of categorizedSections) {
            const el = document.getElementById(`cat-section-${section.id}`);
            if (el) {
              const top = el.offsetTop;
              const height = el.offsetHeight;
              if (scrollPosition >= top && scrollPosition < top + height) {
                detectedSection = section.id;
                break;
              }
            }
          }
        }

        // Instantly update active visual indicator
        setActiveSpyCategory(detectedSection);

        // Calm, relaxed horizontal rail centering when user settles on a category
        if (detectedSection !== currentSection) {
          currentSection = detectedSection;
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            const activeBtn = document.getElementById(`tab-btn-${detectedSection}`);
            if (activeBtn && categoryTrackRef.current) {
              const track = categoryTrackRef.current;
              const btnLeft = activeBtn.offsetLeft;
              const btnWidth = activeBtn.offsetWidth;
              const trackWidth = track.offsetWidth;
              const targetScrollLeft = btnLeft - (trackWidth / 2) + (btnWidth / 2);
              track.scrollTo({
                left: Math.max(0, targetScrollLeft),
                behavior: 'smooth'
              });
            }
          }, 180);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [selectedCategory, searchQuery, categorizedSections]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val.trim()) {
        next.set('search', val);
      } else {
        next.delete('search');
      }
      next.delete('focus');
      return next;
    });
  };

  const clearSearch = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('search');
      next.delete('focus');
      return next;
    });
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleCategoryTabClick = (catId) => {
    setSelectedSubCategory('all');
    if (catId === 'all') {
      setSelectedCategory('all');
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('category');
        next.delete('subCategory');
        next.delete('subcategory');
        next.delete('discount');
        next.delete('discounted');
        return next;
      });
    } else if (catId === 'offers' || catId === 'Offers') {
      setSelectedCategory('offers');
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('category', 'Offers');
        next.delete('subCategory');
        next.delete('subcategory');
        next.delete('discount');
        next.delete('discounted');
        return next;
      });
    } else {
      const catObj = categoriesList.find(c => c.id === catId || c.name.toLowerCase() === String(catId).toLowerCase());
      const catName = catObj ? catObj.name : catId;
      setSelectedCategory(catObj ? catObj.id : catId);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('category', catName);
        next.delete('subCategory');
        next.delete('subcategory');
        next.delete('discount');
        next.delete('discounted');
        return next;
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubCategoryTabClick = (subTarget) => {
    // If an object was passed (e.g. from visual rail)
    if (subTarget && typeof subTarget === 'object') {
      if (subTarget.isCategoryCard) {
        handleCategoryTabClick(subTarget.id || subTarget.name);
        return;
      }
      subTarget = subTarget.name || subTarget.id || 'all';
    }

    const subName = String(subTarget || 'all').trim();

    if (subName.toLowerCase() === 'all' || !subName) {
      setSelectedSubCategory('all');
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('subCategory');
        next.delete('subcategory');
        return next;
      });
    } else {
      setSelectedSubCategory(subName);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('subCategory', subName);
        return next;
      });
    }
  };

  const handleSeeAllCategory = (catId, catName, subCatName = null) => {
    setSelectedCategory(catId);
    if (subCatName) {
      setSelectedSubCategory(subCatName);
      setSearchParams({ category: catName, subCategory: subCatName });
    } else {
      setSelectedSubCategory('all');
      setSearchParams({ category: catName });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFiltersCount = (onlyInStock ? 1 : 0) + (onlyDiscounted ? 1 : 0) + ((selectedCategory !== 'all' || isOffersSelected) ? 1 : 0) + (selectedSubCategory !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedSubCategory('all');
    setOnlyInStock(false);
    setOnlyDiscounted(false);
    setSortOption('featured');
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isSpecificView = (selectedCategory !== 'all' || isOffersSelected) || Boolean(searchQuery) || (selectedSubCategory !== 'all');

  // Base products for the selected category or search
  const baseCategoryProducts = useMemo(() => {
    if (!isSpecificView && !isOffersSelected) return [];
    if (selectedCategory === 'all' && !isOffersSelected) return filteredProducts;
    if (isOffersSelected) {
      return filteredProducts.filter(p => 
        p.isDiscounted || (p.discountPercent > 0) || (p.originalPrice && p.originalPrice > p.price) || (p.discount?.isActive && Number(p.discount?.value) > 0) || String(p.category || '').toLowerCase() === 'offers'
      );
    }
    const target = selectedCategoryObj?.name || selectedCategory;
    return filteredProducts.filter(p => 
      String(p.category || '').trim().toLowerCase() === String(target).trim().toLowerCase()
    );
  }, [isSpecificView, isOffersSelected, selectedCategory, selectedCategoryObj, filteredProducts]);

  // Specific products filtered by subcategory (if one is selected)
  const specificProducts = useMemo(() => {
    const subStr = String(selectedSubCategory || 'all').trim();
    if (subStr && subStr.toLowerCase() !== 'all') {
      return baseCategoryProducts.filter(p => 
        p.subCategory && String(p.subCategory).trim().toLowerCase() === subStr.toLowerCase()
      );
    }
    return baseCategoryProducts;
  }, [baseCategoryProducts, selectedSubCategory]);

  // Group specific category products into subcategory sections for structured mobile shopping
  const subCategorizedSections = useMemo(() => {
    const subStr = String(selectedSubCategory || 'all').trim();
    if (subStr.toLowerCase() !== 'all' || subCategoriesList.length <= 1) {
      return [];
    }
    
    const sections = [];
    subCategoriesList.forEach(sub => {
      const items = baseCategoryProducts.filter(p => 
        p.subCategory && String(p.subCategory).trim().toLowerCase() === String(sub.name || '').trim().toLowerCase()
      );
      if (items.length > 0) {
        sections.push({
          id: sub.id,
          name: sub.name,
          emoji: sub.emoji,
          count: items.length,
          items
        });
      }
    });

    // Unassigned items in this category
    const assignedIds = new Set(sections.flatMap(s => s.items.map(p => p._id || p.id)));
    const unassignedItems = baseCategoryProducts.filter(p => !assignedIds.has(p._id || p.id));
    if (unassignedItems.length > 0) {
      sections.push({
        id: 'other',
        name: `More Fresh ${selectedCategoryObj?.name || 'Produce'}`,
        emoji: '🧺',
        count: unassignedItems.length,
        items: unassignedItems
      });
    }

    return sections;
  }, [selectedSubCategory, subCategoriesList, baseCategoryProducts, selectedCategoryObj]);

  return (
    <div className="modern-shop-page toters-layout">
      {/* Desktop-Only Navbar */}
      <div className="shop-desktop-navbar-wrapper">
        <Navbar />
      </div>

      {/* ==========================================
          UNIFIED STICKY SHOPPING DOCK (SEARCH + CATEGORIES + QUICK FILTERS)
          ========================================== */}
      <div className="toters-unified-sticky-dock">
        {/* Tier 1: Search Bar & Filter Controls */}
        <div className="toters-search-tier">
          <div className="container toters-search-tier-inner">
            <div className="toters-search-row">
              {isSpecificView && (
                <button 
                  type="button" 
                  className="toters-back-pill-btn" 
                  onClick={resetAllFilters}
                  aria-label="Back to all categories"
                  title="View all aisles"
                >
                  <ArrowLeft size={18} />
                </button>
              )}

              <div className="toters-search-box">
                <Search className="toters-search-icon" size={17} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t.searchPlaceholder || "Search farm fresh items..."}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="toters-search-input"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={clearSearch} 
                    className="toters-search-clear"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                type="button"
                className={`toters-filter-trigger-btn ${activeFiltersCount > 0 ? 'active' : ''}`}
                onClick={() => setShowFilterDrawer(true)}
                title="Filter & Sort Options"
              >
                <SlidersHorizontal size={17} />
                {activeFiltersCount > 0 && <span className="filter-badge-dot">{activeFiltersCount}</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: Category Snap Rail Pinned Directly Below Search */}
        <nav className="toters-category-snap-rail" aria-label="Aisle Categories">
          <div className="toters-rail-scroll-track" ref={categoryTrackRef}>
            {/* Grid / All Aisles Icon Button */}
            <button
              type="button"
              className={`toters-category-icon-btn ${selectedCategory === 'all' ? 'is-chosen' : ''}`}
              onClick={() => handleCategoryTabClick('all')}
              title="All Aisles"
              aria-label="All Aisles"
            >
              <LayoutGrid size={18} />
            </button>

            {categoriesList.map((cat) => {
              // Explicitly chosen/filtered category
              const isChosen = selectedCategory !== 'all' && (
                selectedCategory === cat.id || 
                selectedCategory === cat.name || 
                selectedCategoryObj?.id === cat.id || 
                selectedCategoryObj?.name?.toLowerCase() === cat.name?.toLowerCase()
              );

              // ScrollSpy active category while browsing all aisles
              const isBrowsingHere = selectedCategory === 'all' && !searchQuery && (
                activeSpyCategory === cat.id || (activeSpyCategory === 'all' && cat.id === 'all')
              );

              const isCatActive = isChosen || (selectedCategory === 'all' && cat.id === 'all');

              return (
                <button
                  key={cat.id}
                  id={`tab-btn-${cat.id}`}
                  type="button"
                  onClick={() => handleCategoryTabClick(cat.id)}
                  className={`toters-category-tab ${isCatActive ? 'is-active' : ''}`}
                >
                  <span className="tab-name">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Tier 3: Subcategory Visual Rail (Cards with Thumbnails & Titles Underneath) */}
        {subCategoriesList.length > 0 && (
          <nav className="toters-subcat-visual-rail" aria-label="Subcategories">
            <div className="toters-subcat-visual-track" ref={subCategoryTrackRef}>
              {/* "All" Card */}
              <button
                id="subtab-btn-all"
                type="button"
                onClick={() => handleSubCategoryTabClick('all')}
                className={`toters-subcat-visual-card ${selectedSubCategory === 'all' ? 'is-active' : ''}`}
              >
                <div className="toters-subcat-img-box">
                  {allSubCardImage ? (
                    <img 
                      src={allSubCardImage} 
                      alt="All" 
                      className="toters-subcat-img"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="toters-subcat-emoji">{selectedCategoryObj?.emoji || '✨'}</span>
                  )}
                </div>
                <span className="toters-subcat-card-name">All</span>
              </button>

              {/* Subcategories Visual Cards */}
              {subCategoriesList.map((sub) => {
                const isSubActive = sub.isCategoryCard
                  ? (selectedCategory === sub.id || String(selectedCategoryObj?.name || '').toLowerCase() === String(sub.name || '').toLowerCase())
                  : (String(selectedSubCategory || '').toLowerCase() === String(sub.name || '').toLowerCase());

                return (
                  <button
                    key={sub.id}
                    id={`subtab-btn-${sub.name}`}
                    type="button"
                    onClick={() => {
                      if (sub.isCategoryCard) {
                        handleCategoryTabClick(sub.id || sub.name);
                      } else {
                        handleSubCategoryTabClick(sub.name);
                      }
                    }}
                    className={`toters-subcat-visual-card ${isSubActive ? 'is-active' : ''}`}
                  >
                    <div className="toters-subcat-img-box">
                      {sub.image ? (
                        <img 
                          src={sub.image} 
                          alt={sub.name} 
                          className="toters-subcat-img"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="toters-subcat-emoji">{sub.emoji}</span>
                      )}
                    </div>
                    <span className="toters-subcat-card-name">{sub.name}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>

      {/* ==========================================
          4. MAIN TOTERS SHOP AISLE FEED (3-PER-LINE GRID)
          ========================================== */}
      <main className="container toters-shop-main-feed">
        {loading ? (
          <div className="toters-loading-state">
            <div className="toters-skeleton-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <div key={n} className="skeleton-card-compact" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="toters-empty-state-card">
            <div className="empty-icon-wrap">⚠️</div>
            <h3>Unable to load fresh aisles</h3>
            <p>Please check your connection or tap below to refresh.</p>
            <button type="button" onClick={() => window.location.reload()} className="toters-refresh-btn">
              Retry Harvest
            </button>
          </div>
        ) : isSpecificView ? (
          /* SINGLE CATEGORY OR SEARCH RESULTS: 3 ITEMS PER LINE GRID */
          <div className="toters-specific-grid-view fade-in">
            <div className="specific-view-header">
              <div className="header-left">
                <div className="specific-breadcrumbs">
                  <button type="button" className="crumb-btn" onClick={resetAllFilters}>
                    Market
                  </button>
                  {selectedCategory !== 'all' && (
                    <>
                      <span className="crumb-sep">›</span>
                      <button 
                        type="button" 
                        className="crumb-btn"
                        onClick={() => handleSubCategoryTabClick('all')}
                      >
                        {selectedCategoryObj?.name || selectedCategory}
                      </button>
                    </>
                  )}
                  {selectedSubCategory !== 'all' && (
                    <>
                      <span className="crumb-sep">›</span>
                      <span className="crumb-current">{selectedSubCategory}</span>
                    </>
                  )}
                </div>

                <h2 className="specific-title">
                  {searchQuery 
                    ? `Results for "${searchQuery}"` 
                    : selectedSubCategory !== 'all'
                      ? `${getSubCategoryEmoji(selectedSubCategory)} ${selectedSubCategory}`
                      : `${selectedCategoryObj?.emoji || '🧺'} ${selectedCategoryObj?.name || 'Fresh Market'}`}
                </h2>
                <span className="specific-count-tag">
                  {specificProducts.length} {specificProducts.length === 1 ? 'item' : 'items'} available
                </span>
              </div>

              <div className="specific-header-actions">
                {selectedSubCategory !== 'all' && (
                  <button 
                    type="button" 
                    className="see-all-aisles-btn"
                    onClick={() => handleSubCategoryTabClick('all')}
                  >
                    All {selectedCategoryObj?.name || 'Category'}
                  </button>
                )}
                <button type="button" className="see-all-aisles-btn" onClick={resetAllFilters}>
                  View All Aisles
                </button>
              </div>
            </div>

            {specificProducts.length === 0 ? (
              <div className="toters-empty-state-card">
                <div className="empty-icon-wrap">🧺</div>
                <h3>No fresh items found</h3>
                <p>Try searching with another keyword or reset the active filter tags.</p>
                <button type="button" onClick={resetAllFilters} className="toters-refresh-btn">
                  Browse All Categories
                </button>
              </div>
            ) : (
              /* CLEAN 3-COL RESPONSIVE PRODUCT GRID */
              <div className="toters-grid-3col">
                {specificProducts.map((product) => (
                  <ProductCard
                    key={product.id || product._id}
                    product={{
                      ...product,
                      _id: product.id || product._id,
                      rating: product.rating || 4.9,
                      reviews: product.reviews || 16,
                      isNew: product.isNew || false,
                      discount: product.discount || 0
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TOTERS STREAM: ALL PRODUCTS IN 3-COL GRID */
          <div className="toters-aisles-stream">
            {filteredProducts.length === 0 ? (
              <div className="toters-empty-state-card">
                <div className="empty-icon-wrap">🧺</div>
                <h3>No harvest currently available</h3>
                <p>Try resetting the filter tags to explore our full seasonal catalog.</p>
                <button type="button" onClick={resetAllFilters} className="toters-refresh-btn">
                  Show All Produce
                </button>
              </div>
            ) : (
              <div className="toters-grid-3col">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id || product._id}
                    product={{
                      ...product,
                      _id: product.id || product._id,
                      rating: product.rating || 4.9,
                      reviews: product.reviews || 16,
                      isNew: product.isNew || false,
                      discount: product.discount || 0
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==========================================
          5. BOTTOM SHEET FILTER & SORT MODAL
          ========================================== */}
      {showFilterDrawer && (
        <div className="toters-modal-overlay" onClick={() => setShowFilterDrawer(false)}>
          <div className="toters-bottom-sheet-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-handle-bar" />
            
            <div className="drawer-header-row">
              <h3 className="drawer-title">Filter & Sort Harvest</h3>
              <button 
                type="button" 
                className="drawer-close-icon"
                onClick={() => setShowFilterDrawer(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body-scroll">
              {/* Subcategories Filter (if available) */}
              {subCategoriesList.length > 0 && (
                <div className="drawer-group">
                  <label className="drawer-group-label">Filter by Variety / Type</label>
                  <div className="drawer-options-grid">
                    <button
                      type="button"
                      className={`drawer-option-pill ${selectedSubCategory === 'all' ? 'active' : ''}`}
                      onClick={() => handleSubCategoryTabClick('all')}
                    >
                      ✨ All Types ({baseCategoryProducts.length})
                    </button>
                    {subCategoriesList.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        className={`drawer-option-pill ${String(selectedSubCategory || '').toLowerCase() === String(sub.name || '').toLowerCase() ? 'active' : ''}`}
                        onClick={() => handleSubCategoryTabClick(sub.name)}
                      >
                        {sub.emoji} {sub.name} ({sub.count})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sort By Section */}
              <div className="drawer-group">
                <label className="drawer-group-label">Sort Products By</label>
                <div className="drawer-options-grid">
                  {[
                    { id: 'featured', label: 'Featured Picks' },
                    { id: 'price-asc', label: 'Price: Low to High' },
                    { id: 'price-desc', label: 'Price: High to Low' },
                    { id: 'discount', label: 'Biggest Discount' },
                    { id: 'name-asc', label: 'Name: A to Z' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`drawer-option-pill ${sortOption === opt.id ? 'active' : ''}`}
                      onClick={() => setSortOption(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles Section */}
              <div className="drawer-group">
                <label className="drawer-group-label">Product Availability</label>
                
                <div className="drawer-toggle-row" onClick={() => setOnlyDiscounted(!onlyDiscounted)}>
                  <div className="toggle-label-text">
                    <Flame size={16} className="fire-color" />
                    <span>Special Deals & Offers Only</span>
                  </div>
                  <input type="checkbox" checked={onlyDiscounted} readOnly />
                </div>

                <div className="drawer-toggle-row" onClick={() => setOnlyInStock(!onlyInStock)}>
                  <div className="toggle-label-text">
                    <Sparkles size={16} className="green-color" />
                    <span>In Stock Only</span>
                  </div>
                  <input type="checkbox" checked={onlyInStock} readOnly />
                </div>
              </div>
            </div>

            <div className="drawer-footer-actions">
              <button 
                type="button" 
                className="drawer-reset-btn"
                onClick={resetAllFilters}
              >
                Reset All
              </button>
              <button 
                type="button" 
                className="drawer-apply-btn"
                onClick={() => setShowFilterDrawer(false)}
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          6. FLOATING CIRCULAR PILL CART BAR (TOTERS STYLE)
          ========================================== */}
      {cartCount > 0 && (
        <aside className="toters-floating-cart-dock" aria-label="Shopping Cart Summary">
          <div className="toters-floating-cart-pill" onClick={() => navigate('/cart')}>
            <div className="toters-cart-left-wrap">
              {/* Overlapping Product Thumbnails Stack */}
              <div className="toters-cart-thumbnails-stack">
                {cartItems.slice(0, 3).map((item, idx) => {
                  const itemImg = getAssetUrl(item.image) || '/assets/images/products/placeholder.jpg';
                  return (
                    <div 
                      key={item._id || item.id || idx} 
                      className="toters-cart-thumb-item"
                      style={{ zIndex: 10 - idx }}
                    >
                      <img
                        src={itemImg}
                        alt={item.name}
                        className="toters-cart-thumb-img"
                        onError={(e) => { e.currentTarget.src = '/assets/images/products/placeholder.jpg'; }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Items Count & Total Price */}
              <div className="toters-cart-info-col">
                <span className="toters-cart-items-label">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </span>
                <span className="toters-cart-price-val">
                  {formatCurrency(cartTotal)}
                </span>
              </div>
            </div>

            {/* Circular Green Arrow Action Button */}
            <div className="toters-cart-arrow-bubble">
              <ChevronRight size={22} strokeWidth={3} />
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default Shop;
