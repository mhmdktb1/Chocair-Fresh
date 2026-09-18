import { getAssetUrl } from './api';

export const MASCOTS = [
  { key: 'apple', name: 'Crisp Apple', image: '/assets/images/mascots/apple.png' },
  { key: 'avocado', name: 'Creamy Avocado', image: '/assets/images/mascots/avocado.png' },
  { key: 'banana', name: 'Cheerful Banana', image: '/assets/images/mascots/banana.png' },
  { key: 'broccoli', name: 'Happy Broccoli', image: '/assets/images/mascots/broccoli.png' },
  { key: 'carrot', name: 'Crunchy Carrot', image: '/assets/images/mascots/carrot.png' },
  { key: 'eggplant', name: 'Royal Eggplant', image: '/assets/images/mascots/eggplant.png' },
  { key: 'grapes', name: 'Fresh Grapes', image: '/assets/images/mascots/grapes.png' },
  { key: 'lemon', name: 'Zesty Lemon', image: '/assets/images/mascots/lemon.png' },
  { key: 'orange', name: 'Juicy Orange', image: '/assets/images/mascots/orange.png' },
  { key: 'peach', name: 'Sweet Peach', image: '/assets/images/mascots/peach.png' },
  { key: 'strawberry', name: 'Sweet Strawberry', image: '/assets/images/mascots/strawberry.png' },
  { key: 'watermelon', name: 'Cool Watermelon', image: '/assets/images/mascots/watermelon.png' },
];

export const MASCOT_MAP = MASCOTS.reduce((acc, m) => {
  acc[m.key] = m;
  return acc;
}, {});

/**
 * Returns the URL of the mascot image given its key
 */
export const getMascotImage = (key) => {
  if (!key) return MASCOTS[0].image;
  const cleanKey = String(key).toLowerCase().trim();
  if (MASCOT_MAP[cleanKey]) {
    return MASCOT_MAP[cleanKey].image;
  }
  return MASCOTS[0].image;
};

/**
 * Deterministically generates a mascot key from any string seed (User ID, phone, email, name)
 */
export const getDeterministicMascotKey = (seed = '') => {
  if (!seed) return MASCOTS[0].key;
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % MASCOTS.length;
  return MASCOTS[index].key;
};

/**
 * Resolves the display avatar URL for a user object or string:
 * 1. If user has a custom uploaded avatar (http, data:, or /uploads/), returns full URL.
 * 2. If user has a mascot key (user.mascot or avatar is a mascot key), returns the mascot PNG.
 * 3. Otherwise, deterministically computes a mascot from user ID, phone, email, or name.
 */
export const getUserAvatarUrl = (user) => {
  if (!user) {
    return MASCOTS[0].image;
  }

  // If user is passed as a string directly
  if (typeof user === 'string') {
    const val = user.trim().toLowerCase();
    if (MASCOT_MAP[val]) {
      return MASCOT_MAP[val].image;
    }
    if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:') || val.startsWith('/uploads/')) {
      return getAssetUrl(user);
    }
    return getMascotImage(getDeterministicMascotKey(user));
  }

  // If user object has custom avatar photo
  if (user.avatar && typeof user.avatar === 'string' && user.avatar.trim()) {
    const trimmed = user.avatar.trim().toLowerCase();
    if (MASCOT_MAP[trimmed]) {
      return MASCOT_MAP[trimmed].image;
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('/uploads/')) {
      return getAssetUrl(user.avatar);
    }
  }

  // If user object has a mascot key
  if (user.mascot && typeof user.mascot === 'string' && user.mascot.trim()) {
    return getMascotImage(user.mascot);
  }

  // Fallback to deterministic mascot based on unique user field
  const seed = user._id || user.id || user.phone || user.email || user.name || 'fresh';
  const mascotKey = getDeterministicMascotKey(seed);
  return getMascotImage(mascotKey);
};

export const isMascotAvatar = (user) => {
  if (!user) return true;
  if (typeof user === 'string') {
    return !!MASCOT_MAP[user.trim().toLowerCase()];
  }
  if (user.avatar && typeof user.avatar === 'string') {
    const trimmed = user.avatar.trim().toLowerCase();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('/uploads/')) {
      return false;
    }
  }
  return true;
};
