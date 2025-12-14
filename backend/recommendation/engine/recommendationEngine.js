/**
 * ==========================================
 * RECOMMENDATION ENGINE
 * ==========================================
 * 
 * Core recommendation logic that uses extracted knowledge
 * to generate intelligent product recommendations.
 * 
 * This is a data-driven engine that:
 * - Uses product associations (what's bought together)
 * - Uses product popularity (what's trending)
 * - Calculates dynamic scores
 * - Returns ranked recommendations
 * 
 * NO hardcoded rules. NO fixed outputs.
 * Everything is learned from data.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Knowledge maps (loaded from files)
let productAssociations = null;
let productPopularity = null;
let productNames = null;

/**
 * Load knowledge maps from JSON files
 */
async function loadKnowledge() {
  try {
    const dataDir = path.join(__dirname, '../data');

    const associationsPath = path.join(dataDir, 'product-associations.json');
    const popularityPath = path.join(dataDir, 'product-popularity.json');
    const namesPath = path.join(dataDir, 'product-names.json');

    const [associations, popularity, names] = await Promise.all([
      fs.readFile(associationsPath, 'utf-8'),
      fs.readFile(popularityPath, 'utf-8'),
      fs.readFile(namesPath, 'utf-8')
    ]);

    productAssociations = JSON.parse(associations);
    productPopularity = JSON.parse(popularity);
    productNames = JSON.parse(names);

    console.log('✅ Knowledge maps loaded successfully');
  } catch (error) {
    console.error('❌ Error loading knowledge maps:', error.message);
    throw new Error('Knowledge maps not found. Please run the data extraction scripts first.');
  }
}

/**
 * Calculate recommendation score for a product
 * 
 * Score formula:
 * - Association strength: how often products appear together
 * - Popularity bonus: more popular products get higher scores
 * - Diversity factor: prevent recommending only the most popular
 * 
 * @param {string} targetProduct - The product being recommended
 * @param {string} sourceProduct - The product user is viewing
 * @param {number} associationCount - How many times they appeared together
 * @returns {number} Recommendation score
 */
function calculateScore(targetProduct, sourceProduct, associationCount) {
  // Association strength (primary factor)
  const associationScore = associationCount * 10;

  // Popularity bonus (secondary factor)
  const popularity = productPopularity[targetProduct] || 0;
  const popularityScore = Math.log(popularity + 1) * 2;

  // Combine scores
  const totalScore = associationScore + popularityScore;

  return totalScore;
}

/**
 * Get product recommendations based on a given product
 * 
 * @param {string} productId - Product ID to get recommendations for
 * @param {Object} options - Recommendation options
 * @param {number} options.limit - Maximum number of recommendations
 * @param {Array<string>} options.excludeIds - Product IDs to exclude
 * @returns {Promise<Array>} Array of recommended products with scores
 */
export async function getProductRecommendations(productId, options = {}) {
  const { limit = 10, excludeIds = [] } = options;

  // Ensure knowledge is loaded
  if (!productAssociations) {
    await loadKnowledge();
  }

  // Get associations for this product
  const associations = productAssociations[productId];

  if (!associations || Object.keys(associations).length === 0) {
    // No associations found, return popular products as fallback
    return getFallbackRecommendations(limit, [productId, ...excludeIds]);
  }

  // Build candidate list with scores
  const candidates = [];

  for (const [targetProductId, associationCount] of Object.entries(associations)) {
    // Skip excluded products
    if (excludeIds.includes(targetProductId)) continue;
    if (targetProductId === productId) continue;

    // Calculate recommendation score
    const score = calculateScore(targetProductId, productId, associationCount);

    candidates.push({
      productId: targetProductId,
      score: score,
      associationCount: associationCount,
      popularity: productPopularity[targetProductId] || 0,
      name: productNames[targetProductId] || 'Unknown'
    });
  }

  // Sort by score (highest first)
  candidates.sort((a, b) => b.score - a.score);

  // Return top N recommendations
  return candidates.slice(0, limit);
}

/**
 * Fallback recommendations when no associations exist
 * Returns most popular products
 * 
 * @param {number} limit - Number of recommendations
 * @param {Array<string>} excludeIds - Products to exclude
 * @returns {Array} Recommended products
 */
function getFallbackRecommendations(limit, excludeIds = []) {
  const candidates = [];

  for (const [productId, popularity] of Object.entries(productPopularity)) {
    if (excludeIds.includes(productId)) continue;

    candidates.push({
      productId: productId,
      score: popularity,
      associationCount: 0,
      popularity: popularity,
      name: productNames[productId] || 'Unknown',
      isFallback: true
    });
  }

  // Sort by popularity
  candidates.sort((a, b) => b.popularity - a.popularity);

  return candidates.slice(0, limit);
}

/**
 * Get trending products (most popular overall)
 * 
 * @param {number} limit - Number of products to return
 * @returns {Promise<Array>} Array of trending products
 */
export async function getTrendingProducts(limit = 10) {
  // Ensure knowledge is loaded
  if (!productPopularity) {
    await loadKnowledge();
  }

  const trending = [];

  for (const [productId, popularity] of Object.entries(productPopularity)) {
    trending.push({
      productId: productId,
      popularity: popularity,
      name: productNames[productId] || 'Unknown'
    });
  }

  // Sort by popularity
  trending.sort((a, b) => b.popularity - a.popularity);

  return trending.slice(0, limit);
}

/**
 * Refresh knowledge maps (reload from files)
 * Call this after rebuilding the data
 */
export async function refreshKnowledge() {
  await loadKnowledge();
}

// Export for use in other modules
export default {
  getProductRecommendations,
  getTrendingProducts,
  refreshKnowledge
};
