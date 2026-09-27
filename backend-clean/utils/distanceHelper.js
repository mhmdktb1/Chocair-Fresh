export const STORE_COORDS = {
  lat: 33.94376,
  lng: 35.59213,
  name: 'Chocair Market "Anas Fruits"',
  address: 'Chocair Market "Anas Fruits", Beirut, Lebanon',
  plusCode: 'WHVR+GVR, Beirut, Lebanon'
};

export const MAX_DELIVERY_RADIUS_KM = 4.0;

export const DEFAULT_DELIVERY_CONFIG = {
  maxDeliveryRadiusKm: 4.0,
  pricingType: 'distance',
  fixedFee: 2.0,
  freeDeliveryThreshold: 50.0,
  freeDeliveryEnabled: true,
  distanceTiers: {
    tier1MaxKm: 1.5,
    tier1Fee: 1.50, // < 1.5km
    tier2MaxKm: 2.5,
    tier2Fee: 2.50, // 1.5km - 2.5km
    tier3Fee: 3.50  // > 2.5km
  }
};

/**
 * Calculate delivery fee based on store delivery configuration
 */
export const calculateDeliveryFee = (distanceKm, itemsPrice = 0, config = DEFAULT_DELIVERY_CONFIG) => {
  const merged = {
    ...DEFAULT_DELIVERY_CONFIG,
    ...(config || {}),
    distanceTiers: {
      ...DEFAULT_DELIVERY_CONFIG.distanceTiers,
      ...((config && config.distanceTiers) || {})
    }
  };

  // 1. Check free delivery threshold
  if (merged.freeDeliveryEnabled && Number(itemsPrice) >= Number(merged.freeDeliveryThreshold)) {
    return {
      fee: 0,
      isFree: true,
      reason: `Free delivery on orders over $${merged.freeDeliveryThreshold}`,
      tier: 'free',
      pricingType: merged.pricingType
    };
  }

  // 2. Fixed rate
  if (merged.pricingType === 'fixed') {
    return {
      fee: Number(merged.fixedFee ?? 2.0),
      isFree: false,
      reason: 'Standard flat rate',
      tier: 'fixed',
      pricingType: 'fixed'
    };
  }

  // 3. Distance-based rate
  const dist = distanceKm != null ? Number(distanceKm) : null;
  const tiers = merged.distanceTiers;
  const tier1Max = Number(tiers.tier1MaxKm || 1.5);
  const tier2Max = Number(tiers.tier2MaxKm || 2.5);

  if (dist == null || isNaN(dist)) {
    return {
      fee: Number(tiers.tier2Fee ?? 2.50),
      isFree: false,
      reason: 'Standard delivery fee',
      tier: 'tier2',
      pricingType: 'distance'
    };
  }

  if (dist < tier1Max) {
    return {
      fee: Number(tiers.tier1Fee ?? 1.50),
      isFree: false,
      reason: `Under ${tier1Max} km ($${tiers.tier1Fee})`,
      tier: 'tier1',
      pricingType: 'distance'
    };
  } else if (dist <= tier2Max) {
    return {
      fee: Number(tiers.tier2Fee ?? 2.50),
      isFree: false,
      reason: `${tier1Max} km - ${tier2Max} km ($${tiers.tier2Fee})`,
      tier: 'tier2',
      pricingType: 'distance'
    };
  } else {
    return {
      fee: Number(tiers.tier3Fee ?? 3.50),
      isFree: false,
      reason: `Over ${tier2Max} km ($${tiers.tier3Fee})`,
      tier: 'tier3',
      pricingType: 'distance'
    };
  }
};

/**
 * Calculate Great-Circle distance between two coordinates in kilometers using Haversine formula
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);

  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return null;

  const R = 6371; // Earth's radius in km
  const dLat = (numLat2 - numLat1) * (Math.PI / 180);
  const dLon = (numLon2 - numLon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(numLat1 * (Math.PI / 180)) *
      Math.cos(numLat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Number(d.toFixed(2));
};

/**
 * Check if given coordinates are within the 4 km delivery radius
 */
export const isWithinDeliveryRadius = (lat, lng, maxRadiusKm = MAX_DELIVERY_RADIUS_KM) => {
  if (lat == null || lng == null) return { isWithin: true, distanceKm: null };
  const distanceKm = calculateDistanceKm(STORE_COORDS.lat, STORE_COORDS.lng, lat, lng);
  if (distanceKm == null) return { isWithin: true, distanceKm: null };
  return {
    isWithin: distanceKm <= maxRadiusKm,
    distanceKm,
    maxRadiusKm
  };
};

/**
 * Helper to extract coordinates from Google Maps search link if present
 * e.g. https://www.google.com/maps/search/?api=1&query=33.8938,35.5018
 */
export const extractCoordsFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/query=([-+]?[0-9]*\.?[0-9]+),([-+]?[0-9]*\.?[0-9]+)/i);
  if (match && match[1] && match[2]) {
    return {
      lat: Number(match[1]),
      lng: Number(match[2]),
    };
  }
  return null;
};
