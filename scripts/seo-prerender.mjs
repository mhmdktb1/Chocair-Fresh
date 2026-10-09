/**
 * Build-time SEO prerender for the Vite SPA (runs after `vite build`).
 *
 * For every public route it writes a static HTML file (dist/<route>.html, served by Vercel
 * `cleanUrls`) containing that route's title, description, canonical, Open Graph/Twitter tags,
 * JSON-LD and a <noscript> content fallback. The React app still boots client-side exactly as
 * before and keeps the tags in sync on navigation (src-new/seo/useSeo.js).
 *
 * It also generates dist/sitemap.xml from the live catalog and the 404 / SPA fallback shells.
 *
 * Env:
 *   VITE_API_BASE_URL     API used to read products/categories (same one the app uses).
 *   SEO_PRERENDER_STRICT  "true" to fail the build when the catalog cannot be fetched.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { BUSINESS, SITE_NAME, absoluteUrl } from '../src-new/seo/siteConfig.js';
import { buildHeadTags, escapeHtml, renderHeadTagsHtml } from '../src-new/seo/headTags.js';
import {
  categoryPath,
  cleanDescription,
  formatUsd,
  getIndexableCategories,
  getProductAvailability,
  getProductId,
  getProductPricing,
  productPath,
} from '../src-new/seo/catalog.js';
import {
  aboutSeo,
  categorySeo,
  contactSeo,
  homeSeo,
  notFoundSeo,
  privateSeo,
  productSeo,
  shopSeo,
} from '../src-new/seo/pageSeo.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const env = { ...loadEnv('production', ROOT, ['VITE_', 'SEO_']), ...process.env };
const API_BASE = String(env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const API_HOST = API_BASE.replace(/\/api$/, '');
const STRICT = String(env.SEO_PRERENDER_STRICT || '').toLowerCase() === 'true';

const SEO_BLOCK = /<!--seo:start-->[\s\S]*?<!--seo:end-->/;
const NOSCRIPT_SLOT = '<!--seo:noscript-->';
const SAFE_SEGMENT = /^[A-Za-z0-9_-]+$/;

const log = (...args) => console.log('[seo-prerender]', ...args);
const warn = (...args) => console.warn('[seo-prerender] WARNING:', ...args);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The Render free tier can take 30-60s to wake up, so allow generous retries.
const fetchJson = async (url, { attempts = 4, timeoutMs = 60000 } = {}) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastError = err;
      if (attempt < attempts) await sleep(2000 * attempt);
    }
  }
  throw new Error(`${url}: ${lastError?.message || lastError}`);
};

const loadCatalog = async () => {
  if (!API_BASE || /localhost|127\.0\.0\.1/.test(API_BASE)) {
    return { error: `VITE_API_BASE_URL is "${API_BASE || '(unset)'}" (not a public API)` };
  }
  try {
    const [products, categories, homeConfig] = await Promise.all([
      fetchJson(`${API_BASE}/products`),
      fetchJson(`${API_BASE}/categories`),
      fetchJson(`${API_BASE}/home-config`).catch((err) => {
        warn(`home-config unavailable (${err.message}); delivery area omitted from schema.`);
        return null;
      }),
    ]);
    if (!Array.isArray(products) || !Array.isArray(categories)) throw new Error('Unexpected catalog response shape');
    return { products, categories, homeConfig };
  } catch (err) {
    return { error: err.message };
  }
};

// ---------------------------------------------------------------- noscript content
const NAV_HTML = `<nav><a href="/">${SITE_NAME}</a> &middot; <a href="/shop">Shop</a> &middot; <a href="/about">About</a> &middot; <a href="/contact">Contact &amp; Delivery</a></nav>`;
const CONTACT_HTML = `<p>${escapeHtml(BUSINESS.storeName)}, ${escapeHtml(BUSINESS.address.locality)}, ${escapeHtml(BUSINESS.address.district)}, ${escapeHtml(BUSINESS.address.countryName)} &middot; ${escapeHtml(BUSINESS.openingHours.display)} &middot; WhatsApp <a href="${BUSINESS.whatsappUrl}">${escapeHtml(BUSINESS.phoneDisplay)}</a></p>`;

const noscript = (inner) =>
  `<noscript><main style="max-width:960px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif;line-height:1.6">${NAV_HTML}${inner}<p>Please enable JavaScript to order online.</p>${CONTACT_HTML}</main></noscript>`;

const linkList = (items) =>
  items.length ? `<ul>${items.map((i) => `<li><a href="${escapeHtml(i.href)}">${escapeHtml(i.label)}</a></li>`).join('')}</ul>` : '';

const productLinks = (products) =>
  linkList(products.map((p) => ({ href: productPath(p), label: `${p.name}${p.unit ? ` (${p.unit})` : ''}` })));

const productNoscript = (product) => {
  const { current } = getProductPricing(product);
  const availability = getProductAvailability(product);
  const desc = cleanDescription(product.description);
  const facts = [
    current > 0 ? `${formatUsd(current)}${product.unit ? ` per ${escapeHtml(product.unit)}` : ''}` : '',
    availability === 'InStock' ? 'In stock' : availability === 'OutOfStock' ? 'Out of stock' : '',
  ].filter(Boolean);
  const category = product.category
    ? `<p>Category: <a href="${categoryPath(product.category)}">${escapeHtml(String(product.category).trim())}</a></p>`
    : '';
  return noscript(
    `<h1>${escapeHtml(product.name)}</h1>${facts.length ? `<p>${facts.join(' &middot; ')}</p>` : ''}${desc ? `<p>${escapeHtml(desc)}</p>` : ''}${category}`
  );
};

// ---------------------------------------------------------------- page rendering
const renderPage = (template, seoConfig, noscriptHtml = '') => {
  const head = renderHeadTagsHtml(buildHeadTags(seoConfig));
  return template
    .replace(SEO_BLOCK, `<!--seo:start-->\n${head}\n    <!--seo:end-->`)
    .replace(NOSCRIPT_SLOT, noscriptHtml);
};

/** Generic shell for client-rendered routes that were not prerendered (e.g. brand-new products). */
const renderSpaFallback = (template) => {
  const tags = buildHeadTags({ title: SITE_NAME });
  tags.links = [];
  tags.meta = tags.meta.filter((m) => m.property !== 'og:url' && m.name !== 'robots');
  return template
    .replace(SEO_BLOCK, `<!--seo:start-->\n${renderHeadTagsHtml(tags)}\n    <!--seo:end-->`)
    .replace(NOSCRIPT_SLOT, '');
};

const routeToFile = (route) => (route === '/' ? 'index.html' : `${route.replace(/^\//, '')}.html`);

const writeHtml = async (route, html) => {
  const file = path.join(DIST, routeToFile(route));
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, html, 'utf8');
};

// ---------------------------------------------------------------- sitemap
const isoDate = (value) => {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null;
};

const latest = (items) =>
  items.map((i) => isoDate(i?.updatedAt || i?.createdAt)).filter(Boolean).sort().pop() || null;

const renderSitemap = (entries) => {
  const urls = entries
    .map(({ route, lastmod }) => {
      const loc = escapeHtml(absoluteUrl(route));
      return `  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

// ---------------------------------------------------------------- main
const main = async () => {
  const templatePath = path.join(DIST, 'index.html');
  const template = await fs.readFile(templatePath, 'utf8');
  if (!SEO_BLOCK.test(template) || !template.includes(NOSCRIPT_SLOT)) {
    throw new Error('dist/index.html is missing the <!--seo:start/end--> or <!--seo:noscript--> markers');
  }

  const catalog = await loadCatalog();
  if (catalog.error) {
    const message = `Catalog unavailable: ${catalog.error}. Product/category pages will be client-rendered only and left out of the sitemap.`;
    if (STRICT) throw new Error(message);
    warn(message);
  }

  const products = (catalog.products || []).filter((p) => p?.name && SAFE_SEGMENT.test(getProductId(p)));
  const categories = catalog.categories || [];
  const deliveryRadiusKm = catalog.homeConfig?.delivery?.maxDeliveryRadiusKm;
  const indexableCategories = getIndexableCategories(products, categories).filter((c) => {
    if (SAFE_SEGMENT.test(c.slug)) return true;
    warn(`Skipping prerender for category "${c.name}" (non-ASCII slug); it is still client-rendered.`);
    return false;
  });
  const productsIn = (cat) =>
    products.filter((p) => String(p.category || '').trim().toLowerCase() === cat.name.toLowerCase());

  const sitemap = [];
  const pages = [];

  pages.push({
    route: '/',
    seo: homeSeo({ deliveryRadiusKm }),
    body: noscript(
      `<h1>${SITE_NAME} &ndash; Fresh Fruits &amp; Vegetables in Lebanon</h1><p>Order fresh produce online from ${escapeHtml(BUSINESS.storeName)}.</p>${linkList(indexableCategories.map((c) => ({ href: c.path, label: c.name })))}`
    ),
  });
  sitemap.push({ route: '/', lastmod: isoDate(catalog.homeConfig?.updatedAt) });

  pages.push({
    route: '/shop',
    seo: shopSeo(),
    body: noscript(
      `<h1>Shop Fresh Fruits &amp; Vegetables</h1>${linkList(indexableCategories.map((c) => ({ href: c.path, label: c.name })))}${productLinks(products)}`
    ),
  });
  sitemap.push({ route: '/shop', lastmod: latest(products) });

  indexableCategories.forEach((cat) => {
    const items = productsIn(cat);
    pages.push({ route: cat.path, seo: categorySeo(cat), body: noscript(`<h1>${escapeHtml(cat.name)}</h1>${productLinks(items)}`) });
    sitemap.push({ route: cat.path, lastmod: latest(items) });
  });

  products.forEach((product) => {
    const route = productPath(product);
    pages.push({ route, seo: productSeo(product, { apiHost: API_HOST }), body: productNoscript(product) });
    sitemap.push({ route, lastmod: isoDate(product.updatedAt || product.createdAt) });
  });

  pages.push({
    route: '/about',
    seo: aboutSeo(),
    body: noscript(`<h1>About ${SITE_NAME}</h1><p>${SITE_NAME} is the online store of ${escapeHtml(BUSINESS.storeName)} in ${escapeHtml(BUSINESS.address.locality)}, ${escapeHtml(BUSINESS.address.district)}.</p>`),
  });
  sitemap.push({ route: '/about' });

  pages.push({
    route: '/contact',
    seo: contactSeo({ deliveryRadiusKm }),
    body: noscript(`<h1>Contact &amp; Delivery</h1>`),
  });
  sitemap.push({ route: '/contact' });

  // Private / utility routes: static "noindex, follow" so crawlers see it without rendering JS.
  [
    ['/cart', 'Your Cart'],
    ['/checkout', 'Checkout'],
    ['/login', 'Sign In'],
    ['/profile', 'My Account'],
    ['/loading', 'Loading'],
    ['/admin', 'Admin'],
  ].forEach(([route, title]) => pages.push({ route, seo: privateSeo(title) }));

  for (const page of pages) {
    await writeHtml(page.route, renderPage(template, page.seo, page.body || ''));
  }
  await fs.writeFile(path.join(DIST, '404.html'), renderPage(template, notFoundSeo()), 'utf8');
  await fs.writeFile(path.join(DIST, 'spa-fallback.html'), renderSpaFallback(template), 'utf8');
  await fs.writeFile(path.join(DIST, 'sitemap.xml'), renderSitemap(sitemap), 'utf8');

  log(`Prerendered ${pages.length} routes (${products.length} products, ${indexableCategories.length} categories); sitemap has ${sitemap.length} URLs.`);
};

main().catch((err) => {
  console.error('[seo-prerender] FAILED:', err.message);
  process.exit(1);
});
