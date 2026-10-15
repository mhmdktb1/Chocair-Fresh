import process from 'node:process';
import { SITE_URL } from '../src-new/seo/siteConfig.js';

const API_BASE = String(process.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export default async function productRedirect(req, res) {
  const id = String(req.query?.id || '');
  if (!/^[a-f0-9]{24}$/i.test(id)) {
    res.status(404).send('Product not found');
    return;
  }
  if (!API_BASE) {
    res.status(503).send('Product redirect service is not configured');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (response.status === 404) {
      res.status(404).send('Product not found');
      return;
    }
    if (!response.ok) {
      console.error(`Product redirect lookup failed with HTTP ${response.status}`);
      res.status(503).send('Product redirect lookup is temporarily unavailable');
      return;
    }

    const product = await response.json();
    if (!product?.slug) {
      console.error(`Product ${id} has no slug; run the slug migration before enabling slug URLs`);
      res.status(503).send('Product slug is not available');
      return;
    }

    const destination = new URL(`/product/${encodeURIComponent(product.slug)}`, SITE_URL);
    const query = new URL(req.url, 'https://internal.invalid').searchParams;
    query.delete('id');
    destination.search = query.toString();
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.redirect(301, destination.toString());
  } catch (error) {
    console.error('Product redirect lookup failed:', error.message);
    res.status(503).send('Product redirect lookup is temporarily unavailable');
  }
}
