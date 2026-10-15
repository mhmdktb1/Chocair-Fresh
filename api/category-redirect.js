import process from 'node:process';
import { SITE_URL } from '../src-new/seo/siteConfig.js';

const API_BASE = String(process.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export default async function categoryRedirect(req, res) {
  const id = String(req.query?.id || '');
  if (!/^[a-f0-9]{24}$/i.test(id)) {
    res.status(404).send('Category not found');
    return;
  }
  if (!API_BASE) {
    res.status(503).send('Category redirect service is not configured');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/categories`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      console.error(`Category redirect lookup failed with HTTP ${response.status}`);
      res.status(503).send('Category redirect lookup is temporarily unavailable');
      return;
    }

    const categories = await response.json();
    if (!Array.isArray(categories)) throw new Error('Unexpected categories response');
    const category = categories.find((item) => String(item?._id) === id);
    if (!category) {
      res.status(404).send('Category not found');
      return;
    }
    if (!category.slug) {
      console.error(`Category ${id} has no slug; run the slug migration before enabling slug URLs`);
      res.status(503).send('Category slug is not available');
      return;
    }

    const destination = new URL(`/category/${encodeURIComponent(category.slug)}`, SITE_URL);
    const query = new URL(req.url, 'https://internal.invalid').searchParams;
    query.delete('id');
    destination.search = query.toString();
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.redirect(301, destination.toString());
  } catch (error) {
    console.error('Category redirect lookup failed:', error.message);
    res.status(503).send('Category redirect lookup is temporarily unavailable');
  }
}
