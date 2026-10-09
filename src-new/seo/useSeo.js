import { useEffect } from 'react';
import { SEO_ATTR, buildHeadTags } from './headTags';

const applyHeadTags = (tags) => {
  const head = document.head;
  if (!head) return;

  document.title = tags.title;

  // Replace every managed tag (including the ones prerendered into the HTML) so client-side
  // navigation never leaves stale canonicals, robots directives or duplicate JSON-LD behind.
  head.querySelectorAll(`[${SEO_ATTR}]`).forEach((el) => el.remove());

  const fragment = document.createDocumentFragment();
  tags.meta.forEach((m) => {
    const el = document.createElement('meta');
    if (m.property) el.setAttribute('property', m.property);
    else el.setAttribute('name', m.name);
    el.setAttribute('content', m.content);
    el.setAttribute(SEO_ATTR, '');
    fragment.appendChild(el);
  });
  tags.links.forEach((l) => {
    const el = document.createElement('link');
    el.setAttribute('rel', l.rel);
    el.setAttribute('href', l.href);
    el.setAttribute(SEO_ATTR, '');
    fragment.appendChild(el);
  });
  if (tags.jsonLd) {
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute(SEO_ATTR, '');
    el.textContent = JSON.stringify(tags.jsonLd);
    fragment.appendChild(el);
  }
  head.appendChild(fragment);
};

/**
 * Sets title, description, robots, canonical, Open Graph/Twitter tags and JSON-LD for the page.
 * Pass `null` while data is still loading to keep the current (e.g. prerendered) tags untouched.
 */
export const useSeo = (config) => {
  const serialized = config ? JSON.stringify(config) : '';
  useEffect(() => {
    if (!serialized) return;
    applyHeadTags(buildHeadTags(JSON.parse(serialized)));
  }, [serialized]);
};

export const Seo = (props) => {
  useSeo(props);
  return null;
};

export default Seo;
