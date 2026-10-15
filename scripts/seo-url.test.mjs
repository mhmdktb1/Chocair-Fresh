import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categoryPath, categorySlug, findCategoryBySlug, getProductSeo, productPath } from '../src-new/seo/catalog.js';
import { categorySeo, productSeo } from '../src-new/seo/pageSeo.js';
import { buildHeadTags } from '../src-new/seo/headTags.js';
import { renderSitemap } from '../src-new/seo/sitemap.js';

test('product and category paths use slugs, with Arabic preserved as encoded URL segments', () => {
  assert.equal(productPath({ slug: 'fresh-avocados', _id: 'legacy-id' }), '/product/fresh-avocados');
  assert.equal(productPath({ slug: 'تفاح-أحمر' }), '/product/%D8%AA%D9%81%D8%A7%D8%AD-%D8%A3%D8%AD%D9%85%D8%B1');
  assert.equal(categoryPath({ name: 'Fruits', slug: 'fresh-fruits' }), '/category/fresh-fruits');
  assert.equal(categorySlug('Fruits & Vegetables'), 'fruits-and-vegetables');
});

test('category lookup and SEO canonical metadata use the persisted slug', () => {
  const category = { name: 'Seasonal Produce', slug: 'seasonal-produce', count: 2 };
  assert.equal(findCategoryBySlug(category.slug, [], [category]).name, category.name);
  const tags = buildHeadTags(categorySeo(category));
  assert.equal(tags.links[0].href, 'https://www.choucairfresh.com/category/seasonal-produce');
  assert.equal(tags.meta.find((tag) => tag.property === 'og:url').content, tags.links[0].href);
});

test('product SEO uses the canonical slug and accurate product offer values', () => {
  const product = {
    _id: '507f1f77bcf86cd799439011',
    slug: 'fresh-avocados',
    name: 'Fresh Avocados',
    description: 'Ripe local avocados',
    price: 3.5,
    unit: '1kg',
    countInStock: 5,
    category: 'Fruits',
  };
  const tags = buildHeadTags(productSeo(product));
  assert.equal(tags.links[0].href, 'https://www.choucairfresh.com/product/fresh-avocados');
  assert.equal(tags.meta.find((tag) => tag.property === 'product:price:amount').content, '3.50');
  assert.equal(tags.meta.find((tag) => tag.property === 'product:price:currency').content, 'USD');
  assert.equal(getProductSeo(product).description.includes('Ripe local avocados'), true);
});

test('sitemap XML contains absolute canonical URLs and escapes XML-sensitive text', () => {
  const xml = renderSitemap([
    { route: '/product/fresh-avocados', lastmod: '2026-10-01' },
    { route: '/category/fruits&vegetables' },
  ]);
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /https:\/\/www\.choucairfresh\.com\/product\/fresh-avocados/);
  assert.match(xml, /fruits&amp;vegetables/);
  assert.doesNotMatch(xml, /\/product\/[a-f0-9]{24}/i);
});

test('legacy ID product URLs receive a 301 and keep query parameters', async () => {
  process.env.VITE_API_BASE_URL = 'https://api.example.test/api';
  const { default: handler } = await import('../api/product-redirect.js');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ slug: 'fresh-avocados' }),
  });

  const response = {
    code: null,
    headers: {},
    status(code) {
      this.code = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    redirect(code, location) {
      this.code = code;
      this.location = location;
      return this;
    },
  };

  try {
    await handler(
      {
        query: { id: '507f1f77bcf86cd799439011' },
        url: '/api/product-redirect?id=507f1f77bcf86cd799439011&campaign=spring',
      },
      response
    );
    assert.equal(response.code, 301);
    assert.equal(response.location, 'https://www.choucairfresh.com/product/fresh-avocados?campaign=spring');
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.VITE_API_BASE_URL;
  }
});

test('live sitemap handler returns current slugs as absolute XML URLs', async () => {
  process.env.VITE_API_BASE_URL = 'https://api.example.test/api';
  const { default: handler } = await import('../api/sitemap.js');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => ({
    ok: true,
    status: 200,
    json: async () =>
      String(url).endsWith('/products')
        ? [{
            _id: '507f1f77bcf86cd799439011',
            slug: 'fresh-avocados',
            name: 'Fresh Avocados',
            category: 'Fruits',
            updatedAt: '2026-10-01T00:00:00.000Z',
          }]
        : [{ name: 'Fruits', slug: 'fruits', isVisible: true }],
  });
  const response = {
    headers: {},
    status(code) {
      this.code = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };

  try {
    await handler({}, response);
    assert.equal(response.code, 200);
    assert.match(response.headers['Content-Type'], /application\/xml/i);
    assert.match(response.body, /https:\/\/www\.choucairfresh\.com\/product\/fresh-avocados/);
    assert.match(response.body, /https:\/\/www\.choucairfresh\.com\/category\/fruits/);
    assert.doesNotMatch(response.body, /507f1f77bcf86cd799439011/);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.VITE_API_BASE_URL;
  }
});

test('legacy category ID URLs receive a 301 and retain query parameters', async () => {
  process.env.VITE_API_BASE_URL = 'https://api.example.test/api';
  const { default: handler } = await import('../api/category-redirect.js');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => [{ _id: '507f1f77bcf86cd799439011', slug: 'fresh-fruits' }],
  });
  const response = {
    code: null,
    status(code) {
      this.code = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
    setHeader() {},
    redirect(code, location) {
      this.code = code;
      this.location = location;
      return this;
    },
  };

  try {
    await handler(
      {
        query: { id: '507f1f77bcf86cd799439011' },
        url: '/api/category-redirect?id=507f1f77bcf86cd799439011&source=legacy',
      },
      response
    );
    assert.equal(response.code, 301);
    assert.equal(response.location, 'https://www.choucairfresh.com/category/fresh-fruits?source=legacy');
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.VITE_API_BASE_URL;
  }
});
