export const DEFAULT_STORY_LEAD = "We started with a simple idea: fresh produce should feel better from the moment you order it to the moment it reaches your kitchen.";
export const DEFAULT_STORY_BODY = "At Choucair Fresh, we carefully select, check, and pack every order before it leaves us. We focus on the little details — choosing clean, good-looking pieces and packing them neatly so your order arrives the way you’d expect it to.";
export const DEFAULT_STORY_IMAGE = "https://images.unsplash.com/photo-1595855709915-445676d2f6cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";

/** Resolves the CMS "Our Story" block the same way on the homepage and the About page. */
export const getStoryContent = (data) => {
  const title = (data?.title && data.title !== 'Cultivating Goodness') ? data.title : 'Our Story';
  const isOldDefault = data?.description?.includes('bridging the gap between local farmers');
  const lead = (data?.lead || data?.subtitle) && !isOldDefault ? (data?.lead || data?.subtitle) : DEFAULT_STORY_LEAD;
  const body = (data?.description && !isOldDefault) ? data.description : DEFAULT_STORY_BODY;
  const image = data?.image || DEFAULT_STORY_IMAGE;
  return { title, lead, body, image, hasCustomImage: Boolean(data?.image) };
};
