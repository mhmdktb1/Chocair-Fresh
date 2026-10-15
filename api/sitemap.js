import process from 'node:process';
import { getIndexableCategories, productPath } from '../src-new/seo/catalog.js';
import { renderSitemap } from '../src-new/seo/sitemap.js';

const API_BASE = String(process.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const fetchJson = async (url) => {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

const isoDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : undefined;
};

const latestDate = (items) =>
  items.map((item) => isoDate(item?.updatedAt || item?.createdAt)).filter(Boolean).sort().pop();

export default async function sitemap(_req, res) {
  if (!API_BASE) {
    res.status(503).send('Sitemap source is not configured');
    return;
  }

  try {
    const [products, categories] = await Promise.all([
      fetchJson(`${API_BASE}/products`),
      fetchJson(`${API_BASE}/categories`),
    ]);
    if (!Array.isArray(products) || !Array.isArray(categories)) throw new Error('Unexpected catalog response');
    if (products.some((product) => product?.name && !product.slug)) {
      throw new Error('Catalog contains products without slugs; run the slug migration');
    }

    const indexableProducts = products.filter((product) => product?.name && product?.slug);
    const sitemapEntries = [
      { route: '/', lastmod: latestDate(indexableProducts) },
      { route: '/shop', lastmod: latestDate(indexableProducts) },
      ...getIndexableCategories(indexableProducts, categories).map((category) => ({
        route: category.path,
        lastmod: latestDate(indexableProducts.filter((product) => product.category === category.name)),
      })),
      ...indexableProducts.map((product) => ({
        route: productPath(product),
        lastmod: isoDate(product.updatedAt || product.createdAt),
      })),
      { route: '/about' },
      { route: '/contact' },
    ];

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.status(200).send(renderSitemap(sitemapEntries));
  } catch (error) {
    console.error('Sitemap catalog fetch failed:', error.message);
    res.status(503).send('Sitemap is temporarily unavailable');
  }
}
