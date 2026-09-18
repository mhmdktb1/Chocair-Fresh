/**
 * Chocair Fresh Mascot Avatars Utility (Backend)
 * Reusable fruit and vegetable mascot set
 */

export const MASCOT_KEYS = [
  'apple',
  'avocado',
  'banana',
  'broccoli',
  'carrot',
  'eggplant',
  'grapes',
  'lemon',
  'orange',
  'peach',
  'strawberry',
  'watermelon',
];

export const getRandomMascot = () => {
  const index = Math.floor(Math.random() * MASCOT_KEYS.length);
  return MASCOT_KEYS[index];
};

export const getDeterministicMascot = (seed = '') => {
  if (!seed) return MASCOT_KEYS[0];
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % MASCOT_KEYS.length;
  return MASCOT_KEYS[index];
};

export const isValidMascot = (key) => {
  return typeof key === 'string' && MASCOT_KEYS.includes(key.toLowerCase().trim());
};
