export const STORE_COORDS = {
  lat: 33.94376,
  lng: 35.59213,
  name: 'Chocair Market "Anas Fruits"',
  address: 'Chocair Market "Anas Fruits", Beirut, Lebanon',
  plusCode: 'WHVR+GVR, Beirut, Lebanon'
};

export const MAX_DELIVERY_RADIUS_KM = 4.0;

// Known local areas around Beirut, Metn, and Mount Lebanon for high-precision area name detection
export const KNOWN_AREAS = [
  { name: "Dbayeh", lat: 33.9535, lng: 35.5947 },
  { name: "Marina Dbayeh", lat: 33.9592, lng: 35.5925 },
  { name: "Zouk El Kharab", lat: 33.9514, lng: 35.6111 },
  { name: "Naccache", lat: 33.9272, lng: 35.5958 },
  { name: "Antelias", lat: 33.9167, lng: 35.5897 },
  { name: "Rabieh", lat: 33.9308, lng: 35.6083 },
  { name: "Mtayleb", lat: 33.9214, lng: 35.6139 },
  { name: "Jal El Dib", lat: 33.9083, lng: 35.5806 },
  { name: "Bsalim", lat: 33.9056, lng: 35.6028 },
  { name: "Mezher", lat: 33.9139, lng: 35.5986 },
  { name: "Majzoub", lat: 33.9011, lng: 35.6022 },
  { name: "Zalka", lat: 33.8997, lng: 35.5714 },
  { name: "Dik El Mehdi", lat: 33.9367, lng: 35.6208 },
  { name: "Kornet Chehwan", lat: 33.9317, lng: 35.6322 },
  { name: "Ain Aar", lat: 33.9333, lng: 35.6444 },
  { name: "Beit Chabab", lat: 33.9389, lng: 35.6606 },
  { name: "Broummana", lat: 33.8833, lng: 35.6250 },
  { name: "Beit Mery", lat: 33.8722, lng: 35.6028 },
  { name: "Ain Saadeh", lat: 33.8694, lng: 35.5861 },
  { name: "Mansourieh", lat: 33.8667, lng: 35.5667 },
  { name: "Jdeideh", lat: 33.8833, lng: 35.5667 },
  { name: "Sed El Bauchrieh", lat: 33.8867, lng: 35.5583 },
  { name: "Dekwaneh", lat: 33.8767, lng: 35.5458 },
  { name: "Sin El Fil", lat: 33.8694, lng: 35.5361 },
  { name: "Bourj Hammoud", lat: 33.8944, lng: 35.5389 },
  { name: "Achrafieh", lat: 33.8889, lng: 35.5222 },
  { name: "Mar Mikhael", lat: 33.8986, lng: 35.5264 },
  { name: "Gemmayzeh", lat: 33.8967, lng: 35.5139 },
  { name: "Downtown Beirut", lat: 33.8989, lng: 35.5064 },
  { name: "Hamra", lat: 33.8972, lng: 35.4819 },
  { name: "Ras Beirut", lat: 33.8983, lng: 35.4722 },
  { name: "Verdun", lat: 33.8861, lng: 35.4861 },
  { name: "Badaro", lat: 33.8722, lng: 35.5194 },
  { name: "Hazmieh", lat: 33.8583, lng: 35.5389 },
  { name: "Furn El Chebbak", lat: 33.8694, lng: 35.5250 },
];

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
 * Get nearest area name for a coordinate pair
 */
export const getNearestAreaName = (lat, lng) => {
  if (lat == null || lng == null) return "Dbayeh Area";
  let minDistance = Infinity;
  let closestName = "Dbayeh Area";

  for (const area of KNOWN_AREAS) {
    const dist = calculateDistanceKm(lat, lng, area.lat, area.lng);
    if (dist != null && dist < minDistance) {
      minDistance = dist;
      closestName = `${area.name}`;
    }
  }

  return closestName;
};

/**
 * Extract clean, human-readable area name from Google Geocoder results
 */
export const extractAreaName = (results, coords) => {
  if (!Array.isArray(results) || results.length === 0) {
    return coords ? getNearestAreaName(coords.lat, coords.lng) : "Dbayeh Area";
  }

  // 1. Try to find neighborhood, sublocality, route, locality in address components
  for (const res of results) {
    if (res.address_components && Array.isArray(res.address_components)) {
      const parts = [];
      let neighborhood = '';
      let sublocality = '';
      let route = '';
      let locality = '';
      let admin2 = '';

      for (const comp of res.address_components) {
        const types = comp.types || [];
        if (types.includes('neighborhood') || types.includes('sublocality_level_1')) {
          neighborhood = comp.long_name || comp.short_name;
        } else if (types.includes('sublocality') || types.includes('sublocality_level_2')) {
          sublocality = comp.long_name || comp.short_name;
        } else if (types.includes('route')) {
          route = comp.long_name || comp.short_name;
        } else if (types.includes('locality')) {
          locality = comp.long_name || comp.short_name;
        } else if (types.includes('administrative_area_level_2')) {
          admin2 = comp.long_name || comp.short_name;
        }
      }

      const primary = neighborhood || sublocality || route || locality;
      const secondary = (locality && locality !== primary) ? locality : ((admin2 && admin2 !== primary) ? admin2 : '');

      if (primary) {
        if (secondary && !primary.toLowerCase().includes(secondary.toLowerCase())) {
          return `${primary}, ${secondary}`;
        }
        return primary;
      }
    }
  }

  // 2. Try cleaning formatted address
  if (results[0]?.formatted_address) {
    let formatted = results[0].formatted_address;
    // Remove plus codes e.g. WHVR+GVR,
    formatted = formatted.replace(/^[A-Z0-9\+]{4,}\+?[A-Z0-9]*,?\s*/i, '').trim();
    // Remove trailing country "Lebanon" or postal codes if it leaves a nice area name
    const pieces = formatted.split(',').map(s => s.trim()).filter(Boolean);
    if (pieces.length > 0) {
      const cleanPieces = pieces.filter(p => !/^[0-9\-]+$/.test(p) && p.toLowerCase() !== 'lebanon');
      if (cleanPieces.length > 0) {
        return cleanPieces.slice(0, 2).join(', ');
      }
    }
  }

  // 3. Fallback to nearest recognized Lebanese area name
  if (coords && coords.lat != null && coords.lng != null) {
    return getNearestAreaName(coords.lat, coords.lng);
  }

  return "Dbayeh Area";
};

/**
 * Format any saved location string to replace raw 'Lat:...', 'GPS Pinned Location', or 'Pinned Location'
 * with a friendly area name.
 */
export const formatLocationDisplay = (locationStr) => {
  if (!locationStr || typeof locationStr !== 'string') return '';
  const trimmed = locationStr.trim();
  if (!trimmed || trimmed === 'Unknown') return '';

  if (trimmed.startsWith('Lat:') || trimmed.includes('query=')) {
    const latMatch = trimmed.match(/Lat:\s*([-+]?[0-9]*\.?[0-9]+)/i) || trimmed.match(/query=([-+]?[0-9]*\.?[0-9]+)/i);
    const lngMatch = trimmed.match(/Lng:\s*([-+]?[0-9]*\.?[0-9]+)/i) || trimmed.match(/,([-+]?[0-9]*\.?[0-9]+)/i);
    if (latMatch && lngMatch) {
      const lat = parseFloat(latMatch[1]);
      const lng = parseFloat(lngMatch[1]);
      return getNearestAreaName(lat, lng);
    }
    return "Selected Area";
  }

  if (trimmed.toLowerCase().includes('pinned location') || trimmed.toLowerCase().includes('pinned gps location')) {
    return trimmed
      .replace(/pinned\s+gps\s+location/gi, 'Selected Area')
      .replace(/pinned\s+location/gi, 'Selected Area');
  }

  return trimmed;
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
