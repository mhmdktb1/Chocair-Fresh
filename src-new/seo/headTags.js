/**
 * Builds the per-page <head> SEO tags. Used at runtime (useSeo) and at build time
 * (scripts/seo-prerender.mjs) so static HTML and client navigation stay identical.
 */
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, DEFAULT_TITLE, SITE_LOCALE, SITE_NAME, absoluteUrl } from './siteConfig.js';

export const SEO_ATTR = 'data-seo';

/**
 * @param {object} cfg
 * @param {string} [cfg.title]        Full document title.
 * @param {string} [cfg.description]
 * @param {string} [cfg.path]         Canonical path (no query string). Ignored when noindex.
 * @param {boolean} [cfg.noindex]     Private/thin pages: "noindex, follow" and no canonical.
 * @param {{url:string,width?:number,height?:number,alt?:string}} [cfg.image] Absolute image URL.
 * @param {string} [cfg.type]         og:type (website | product | article).
 * @param {Array<{property?:string,name?:string,content:string}>} [cfg.extraMeta]
 * @param {object|null} [cfg.jsonLd]
 */
export const buildHeadTags = (cfg = {}) => {
  const title = cfg.title || DEFAULT_TITLE;
  const description = cfg.description || DEFAULT_DESCRIPTION;
  const canonical = cfg.noindex ? null : absoluteUrl(cfg.path || '/');
  const image = cfg.image?.url
    ? cfg.image
    : { ...DEFAULT_OG_IMAGE, url: absoluteUrl(DEFAULT_OG_IMAGE.url) };

  const meta = [
    { name: 'description', content: description },
    { name: 'robots', content: cfg.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:locale', content: SITE_LOCALE },
    { property: 'og:type', content: cfg.type || 'website' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    ...(canonical ? [{ property: 'og:url', content: canonical }] : []),
    { property: 'og:image', content: image.url },
    ...(image.width ? [{ property: 'og:image:width', content: String(image.width) }] : []),
    ...(image.height ? [{ property: 'og:image:height', content: String(image.height) }] : []),
    ...(image.alt ? [{ property: 'og:image:alt', content: image.alt }] : []),
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image.url },
    ...(image.alt ? [{ name: 'twitter:image:alt', content: image.alt }] : []),
    ...(cfg.extraMeta || []),
  ].filter((m) => m.content !== undefined && m.content !== null && m.content !== '');

  return {
    title,
    meta,
    links: canonical ? [{ rel: 'canonical', href: canonical }] : [],
    jsonLd: cfg.jsonLd || null,
  };
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** JSON for an inline <script>: escape "<" so content can never close the tag. */
export const serializeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

export const renderHeadTagsHtml = (tags, indent = '    ') => {
  const lines = [`<title>${escapeHtml(tags.title)}</title>`];
  tags.meta.forEach((m) => {
    const key = m.property ? `property="${escapeHtml(m.property)}"` : `name="${escapeHtml(m.name)}"`;
    lines.push(`<meta ${key} content="${escapeHtml(m.content)}" ${SEO_ATTR} />`);
  });
  tags.links.forEach((l) => lines.push(`<link rel="${escapeHtml(l.rel)}" href="${escapeHtml(l.href)}" ${SEO_ATTR} />`));
  if (tags.jsonLd) {
    lines.push(`<script type="application/ld+json" ${SEO_ATTR}>${serializeJsonLd(tags.jsonLd)}</script>`);
  }
  return lines.map((l) => `${indent}${l}`).join('\n');
};

export { escapeHtml };
