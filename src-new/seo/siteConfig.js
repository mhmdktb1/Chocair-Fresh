/**
 * Single source of truth for SEO + verified business details.
 *
 * Plain ESM with no browser/Vite APIs so it can be imported both by the React app
 * and by the build-time prerender script (scripts/seo-prerender.mjs).
 *
 * Only add details here that are verified public facts about the business.
 */

// Production origin. Apex and http:// already 308-redirect to this host on Vercel.
export const SITE_URL = 'https://www.choucairfresh.com';
export const SITE_NAME = 'Choucair Fresh';
export const SITE_LOCALE = 'en_US';
export const THEME_COLOR = '#27ae60';

export const DEFAULT_TITLE = 'Choucair Fresh | Fresh Fruits & Vegetables in Lebanon';
export const DEFAULT_DESCRIPTION =
  'Order fresh fruits and vegetables online from Choucair Fresh, the online store of Choucair Market \u201cAnas Fruits\u201d in Dbayeh, Metn, with local delivery.';

export const DEFAULT_OG_IMAGE = {
  url: '/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'Choucair Fresh \u2013 fresh fruits and vegetables, Dbayeh, Lebanon',
};

export const LOGO_URL = '/icons/icon-512.png';

export const BUSINESS = {
  brandName: SITE_NAME,
  // Public name of the physical shop operated by the same business.
  storeName: 'Choucair Market "Anas Fruits"',
  phoneE164: '+96171966828',
  phoneDisplay: '+961 71 966 828',
  whatsappUrl: 'https://wa.me/96171966828',
  address: {
    locality: 'Dbayeh',
    district: 'Metn',
    region: 'Mount Lebanon',
    countryCode: 'LB',
    countryName: 'Lebanon',
  },
  geo: { lat: 33.94376, lng: 35.59213 },
  plusCode: 'WHVR+GVR',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=33.94376%2C35.59213',
  openingHours: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '07:30',
    closes: '22:30',
    display: 'Mon \u2013 Sun: 7:30 AM \u2013 10:30 PM',
  },
  currency: 'USD',
  // Add only real, verified profile URLs (Instagram, Facebook, TikTok, Google Business Profile...).
  sameAs: [],
};

export const STORE_ADDRESS_TEXT = `${BUSINESS.storeName}, ${BUSINESS.address.locality}, ${BUSINESS.address.district}, ${BUSINESS.address.countryName}`;

/** Absolute URL on the canonical host. Strips query/hash and trailing slashes (except root). */
export const absoluteUrl = (path = '/') => {
  if (!path) return `${SITE_URL}/`;
  if (/^https?:\/\//i.test(path)) return path;
  const clean = String(path).split(/[?#]/)[0].replace(/\/+$/, '');
  return clean ? `${SITE_URL}${clean.startsWith('/') ? '' : '/'}${clean}` : `${SITE_URL}/`;
};

/**
 * Absolute URL for an image. Mirrors utils/api.js#getAssetUrl: `/assets/*` ships with the
 * frontend, other relative paths (e.g. `/uploads/*`) are served by the API host.
 */
export const absoluteAssetUrl = (url, apiHost = '') => {
  if (!url) return '';
  if (/^(https?:)?\/\//i.test(url)) return url.startsWith('//') ? `https:${url}` : url;
  if (url.startsWith('data:') || url.startsWith('blob:')) return '';
  const path = url.startsWith('/') ? url : `/${url}`;
  if (path.startsWith('/assets/') || path.startsWith('/icons/') || !apiHost) return `${SITE_URL}${path}`;
  return `${apiHost.replace(/\/+$/, '')}${path}`;
};
