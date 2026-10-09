/**
 * schema.org JSON-LD builders (shared by the app and the prerender script).
 * Only verified business data is used; never add ratings, reviews or invented details.
 */
import { BUSINESS, DEFAULT_OG_IMAGE, LOGO_URL, SITE_NAME, SITE_URL, absoluteAssetUrl, absoluteUrl } from './siteConfig.js';
import { cleanDescription, getProductAvailability, getProductPricing, productPath } from './catalog.js';

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const STORE_ID = `${SITE_URL}/#store`;

const withSameAs = (node) => (BUSINESS.sameAs.length ? { ...node, sameAs: BUSINESS.sameAs } : node);

export const organizationSchema = () =>
  withSameAs({
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(LOGO_URL),
      width: 512,
      height: 512,
    },
    telephone: BUSINESS.phoneE164,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: BUSINESS.phoneE164,
        contactType: 'customer service',
        areaServed: BUSINESS.address.countryCode,
      },
    ],
  });

export const websiteSchema = () => ({
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  inLanguage: 'en',
  publisher: { '@id': ORGANIZATION_ID },
});

export const storeSchema = ({ deliveryRadiusKm } = {}) => {
  const node = {
    '@type': 'GroceryStore',
    '@id': STORE_ID,
    name: BUSINESS.storeName,
    url: `${SITE_URL}/`,
    image: absoluteUrl(DEFAULT_OG_IMAGE.url),
    telephone: BUSINESS.phoneE164,
    address: {
      '@type': 'PostalAddress',
      addressLocality: BUSINESS.address.locality,
      addressRegion: BUSINESS.address.region,
      addressCountry: BUSINESS.address.countryCode,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BUSINESS.geo.lat,
      longitude: BUSINESS.geo.lng,
    },
    hasMap: BUSINESS.mapsUrl,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: BUSINESS.openingHours.days,
        opens: BUSINESS.openingHours.opens,
        closes: BUSINESS.openingHours.closes,
      },
    ],
    currenciesAccepted: BUSINESS.currency,
    parentOrganization: { '@id': ORGANIZATION_ID },
  };
  const radius = Number(deliveryRadiusKm);
  if (Number.isFinite(radius) && radius > 0) {
    node.areaServed = {
      '@type': 'GeoCircle',
      geoMidpoint: { '@type': 'GeoCoordinates', latitude: BUSINESS.geo.lat, longitude: BUSINESS.geo.lng },
      geoRadius: Math.round(radius * 1000),
    };
  }
  return node;
};

/** items: [{ name, path }] — the last item is the current page. */
export const breadcrumbSchema = (items = []) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

const isActiveDiscountWithEnd = (product) => {
  const end = product?.discount?.isActive && product?.discount?.endDate ? new Date(product.discount.endDate) : null;
  return end && !Number.isNaN(end.getTime()) && end.getTime() > Date.now() ? end : null;
};

/** Returns null when there is not enough accurate data for a Product entity. */
export const productSchema = (product, { apiHost = '' } = {}) => {
  if (!product?.name) return null;
  const url = absoluteUrl(productPath(product));
  const image = absoluteAssetUrl(product.image, apiHost);
  const { current } = getProductPricing(product);
  const availability = getProductAvailability(product);
  const description = cleanDescription(product.description);

  const node = {
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.name,
    url,
  };
  if (image) node.image = [image];
  if (description) node.description = description;
  if (product.category) node.category = String(product.category).trim();
  if (product.brand) node.brand = { '@type': 'Brand', name: String(product.brand).trim() };

  if (current > 0) {
    const offer = {
      '@type': 'Offer',
      url,
      priceCurrency: BUSINESS.currency,
      price: current.toFixed(2),
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': ORGANIZATION_ID },
    };
    if (availability) offer.availability = `https://schema.org/${availability}`;
    const discountEnd = isActiveDiscountWithEnd(product);
    if (discountEnd) offer.priceValidUntil = discountEnd.toISOString().slice(0, 10);
    node.offers = offer;
  }
  return node;
};

export const toJsonLdGraph = (nodes = []) => {
  const graph = nodes.filter(Boolean);
  return graph.length ? { '@context': 'https://schema.org', '@graph': graph } : null;
};
