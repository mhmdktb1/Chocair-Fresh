/**
 * Catalog helpers shared by the React app and the build-time prerender script.
 * Keep this file free of browser/Vite APIs.
 */
import { BUSINESS, SITE_NAME } from './siteConfig.js';

const OFFER_ALIASES = new Set(['offers', 'offer', 'deals', 'deal', 'discounts', 'discount', 'special offers']);

export const isOffersCategoryName = (name) => OFFER_ALIASES.has(String(name || '').trim().toLowerCase());

/** "Raw Nuts" -> "raw-nuts", "Seasonal Fruits " -> "seasonal-fruits". */
export const categorySlug = (name) =>
  String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const categoryPath = (name) => {
  if (!name || String(name).trim().toLowerCase() === 'all') return '/shop';
  if (isOffersCategoryName(name)) return '/shop/offers';
  const slug = categorySlug(name);
  return slug ? `/shop/${encodeURIComponent(slug)}` : '/shop';
};

const sameText = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

/**
 * Union of visible admin categories and categories used by products (same rules as the
 * Shop page), with product counts. Includes empty categories; filter on `count` as needed.
 */
export const getCatalogCategories = (products = [], categories = []) => {
  const names = [];
  const seen = new Set();
  const add = (raw) => {
    const name = String(raw || '').trim();
    if (!name || sameText(name, 'all') || isOffersCategoryName(name)) return;
    const slug = categorySlug(name);
    if (!slug || seen.has(slug)) return;
    seen.add(slug);
    names.push(name);
  };
  (categories || []).filter((c) => c && c.isVisible !== false).forEach((c) => add(c.name));
  (products || []).forEach((p) => add(p?.category));

  return names.map((name) => {
    const adminCat = (categories || []).find((c) => sameText(c?.name, name));
    return {
      name,
      slug: categorySlug(name),
      path: categoryPath(name),
      count: (products || []).filter((p) => sameText(p?.category, name)).length,
      image: adminCat?.image || '',
    };
  });
};

/** Categories worth indexing: real, non-empty product categories. */
export const getIndexableCategories = (products = [], categories = []) =>
  getCatalogCategories(products, categories).filter((c) => c.count > 0);

export const findCategoryBySlug = (slug, products = [], categories = []) => {
  if (!slug) return null;
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // keep raw slug
  }
  const target = categorySlug(decoded);
  return getCatalogCategories(products, categories).find((c) => c.slug === target) || null;
};

export const getProductId = (product) => String(product?._id || product?.id || '');

export const productPath = (product) => `/product/${encodeURIComponent(getProductId(product))}`;

export const getProductPricing = (product) => {
  const current = Number(product?.finalPrice ?? product?.price ?? 0);
  const original = Number(product?.originalPrice ?? product?.oldPrice ?? current);
  return {
    current: Number.isFinite(current) ? current : 0,
    original: Number.isFinite(original) ? original : current,
  };
};

/** 'InStock' | 'OutOfStock' | null when stock is not tracked for the product. */
export const getProductAvailability = (product) => {
  const stock = Number(product?.countInStock ?? product?.stock);
  if (product?.countInStock === undefined && product?.stock === undefined) return null;
  if (!Number.isFinite(stock)) return null;
  return stock > 0 ? 'InStock' : 'OutOfStock';
};

const PLACEHOLDER_DESCRIPTIONS = new Set(['no description', 'no description available', 'n/a']);

export const cleanDescription = (text) => {
  const raw = typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';
  return PLACEHOLDER_DESCRIPTIONS.has(raw.toLowerCase()) ? '' : raw;
};

export const truncate = (text, max = 160) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, '')}\u2026`;
};

const LOCAL_AREA = `${BUSINESS.address.locality}, ${BUSINESS.address.district}`;

export const formatUsd = (amount) => `$${Number(amount || 0).toFixed(2)}`;

export const getProductSeo = (product) => {
  const name = String(product?.name || 'Product').trim();
  const unit = String(product?.unit || '').trim();
  const { current } = getProductPricing(product);
  const label = unit ? `${name} (${unit})` : name;
  const base = current > 0 ? `${label} for ${formatUsd(current)} at ${SITE_NAME}.` : `${label} at ${SITE_NAME}.`;
  const desc = cleanDescription(product?.description);
  const tail = `Order online for local delivery from our store in ${LOCAL_AREA}.`;
  const withDesc = desc ? `${base} ${desc}` : base;
  const description = withDesc.length + tail.length + 1 <= 160 ? `${withDesc} ${tail}` : truncate(withDesc, 160);
  return { title: `${label} | ${SITE_NAME}`, description };
};

export const getCategorySeo = (category) => {
  const name = String(category?.name || '').trim();
  return {
    title: `${name} \u2013 Order Online | ${SITE_NAME}`,
    description: truncate(
      `Shop ${name.toLowerCase()} online at ${SITE_NAME} and get them delivered from our store in ${LOCAL_AREA}. See current prices and availability.`,
      160
    ),
  };
};
