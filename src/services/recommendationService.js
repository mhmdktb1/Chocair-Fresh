/**
 * Recommendation Service
 * Handles all recommendation API calls
 */

const API_BASE_URL = 'http://localhost:5000/api/recommend';

/**
 * Get trending products
 */
export const getTrendingProducts = async (limit = 8) => {
  try {
    const response = await fetch(`${API_BASE_URL}/trending?limit=${limit}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching trending products:', error);
    return [];
  }
};

/**
 * Get product recommendations based on a product ID
 */
export const getProductRecommendations = async (productId, limit = 4) => {
  try {
    const response = await fetch(`${API_BASE_URL}/product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId, limit }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching product recommendations:', error);
    return [];
  }
};

/**
 * Get recommendations for multiple products (e.g., cart items)
 */
export const getCartRecommendations = async (productIds, limit = 6) => {
  try {
    const allRecommendations = [];
    const seenIds = new Set();
    
    // Add all cart item IDs to seenIds to exclude them
    productIds.forEach(id => seenIds.add(id));

    // Get recommendations for each product
    for (const productId of productIds.slice(0, 3)) { // Limit to first 3 cart items
      const recs = await getProductRecommendations(productId, 5);
      recs.forEach(rec => {
        const product = rec.product || rec;
        const productId = product._id || product.id;
        
        // Only add if not already in cart and not already recommended
        if (!seenIds.has(productId)) {
          allRecommendations.push(rec);
          seenIds.add(productId);
        }
      });
    }

    // Return unique recommendations up to the limit
    return allRecommendations.slice(0, limit);
  } catch (error) {
    console.error('Error fetching cart recommendations:', error);
    return [];
  }
};

/**
 * Get recommendation system status
 */
export const getRecommendationStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/status`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching recommendation status:', error);
    return null;
  }
};
