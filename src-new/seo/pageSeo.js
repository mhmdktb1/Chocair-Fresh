/**
 * Page-level SEO configs shared by React pages and the build-time prerender script.
 */
import { BUSINESS, DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, absoluteAssetUrl } from './siteConfig.js';
import {
  categoryPath,
  getCategorySeo,
  getProductAvailability,
  getProductPricing,
  getProductSeo,
  productPath,
} from './catalog.js';
import {
  breadcrumbSchema,
  organizationSchema,
  productSchema,
  storeSchema,
  toJsonLdGraph,
  websiteSchema,
} from './structuredData.js';

const HOME_CRUMB = { name: 'Home', path: '/' };
const SHOP_CRUMB = { name: 'Shop', path: '/shop' };
const LOCAL_AREA = `${BUSINESS.address.locality}, ${BUSINESS.address.district}`;

export const homeSeo = ({ deliveryRadiusKm } = {}) => ({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  path: '/',
  jsonLd: toJsonLdGraph([organizationSchema(), websiteSchema(), storeSchema({ deliveryRadiusKm })]),
});

export const shopSeo = () => ({
  title: `Shop Fresh Fruits & Vegetables Online | ${SITE_NAME}`,
  description: `Browse fresh fruits, vegetables and more at ${SITE_NAME}. See today\u2019s prices and order online for local delivery from our store in ${LOCAL_AREA}.`,
  path: '/shop',
  jsonLd: toJsonLdGraph([breadcrumbSchema([HOME_CRUMB, SHOP_CRUMB])]),
});

export const categorySeo = (category) => {
  const { title, description } = getCategorySeo(category);
  const path = categoryPath(category.name);
  return {
    title,
    description,
    path,
    jsonLd: toJsonLdGraph([breadcrumbSchema([HOME_CRUMB, SHOP_CRUMB, { name: category.name, path }])]),
  };
};

export const productSeo = (product, { apiHost = '' } = {}) => {
  const { title, description } = getProductSeo(product);
  const path = productPath(product);
  const imageUrl = absoluteAssetUrl(product.image, apiHost);
  const { current } = getProductPricing(product);
  const availability = getProductAvailability(product);
  const crumbs = [HOME_CRUMB, SHOP_CRUMB];
  if (product.category) crumbs.push({ name: String(product.category).trim(), path: categoryPath(product.category) });
  crumbs.push({ name: product.name, path });

  return {
    title,
    description,
    path,
    type: 'product',
    image: imageUrl ? { url: imageUrl, alt: product.name } : undefined,
    extraMeta: [
      ...(current > 0
        ? [
            { property: 'product:price:amount', content: current.toFixed(2) },
            { property: 'product:price:currency', content: BUSINESS.currency },
          ]
        : []),
      ...(availability
        ? [{ property: 'product:availability', content: availability === 'InStock' ? 'in stock' : 'out of stock' }]
        : []),
    ],
    jsonLd: toJsonLdGraph([productSchema(product, { apiHost }), breadcrumbSchema(crumbs)]),
  };
};

export const aboutSeo = () => ({
  title: `About Us \u2013 Our Story | ${SITE_NAME}`,
  description: `Learn about ${SITE_NAME}, the online store of ${BUSINESS.storeName} in ${LOCAL_AREA}: how we select, check and pack fresh produce for every order.`,
  path: '/about',
  type: 'website',
  jsonLd: toJsonLdGraph([breadcrumbSchema([HOME_CRUMB, { name: 'About', path: '/about' }])]),
});

export const contactSeo = ({ deliveryRadiusKm } = {}) => ({
  title: `Contact & Delivery Information | ${SITE_NAME}`,
  description: `Contact ${SITE_NAME} on WhatsApp at ${BUSINESS.phoneDisplay} or visit ${BUSINESS.storeName} in ${LOCAL_AREA}, open daily 7:30 AM\u201310:30 PM. Delivery area & fees.`,
  path: '/contact',
  jsonLd: toJsonLdGraph([
    storeSchema({ deliveryRadiusKm }),
    breadcrumbSchema([HOME_CRUMB, { name: 'Contact', path: '/contact' }]),
  ]),
});

export const privateSeo = (pageTitle) => ({
  title: `${pageTitle} | ${SITE_NAME}`,
  noindex: true,
});

export const notFoundSeo = () => ({
  title: `Page Not Found | ${SITE_NAME}`,
  description: DEFAULT_DESCRIPTION,
  noindex: true,
});
