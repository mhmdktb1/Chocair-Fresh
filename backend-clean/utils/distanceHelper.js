export const STORE_COORDS = {
  lat: 33.8938,
  lng: 35.5018,
  name: 'Chocair Market "Anas Fruits"',
  address: 'Beirut, Lebanon'
};

export const MAX_DELIVERY_RADIUS_KM = 5.0;

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
 * Check if given coordinates are within the 5 km delivery radius
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
