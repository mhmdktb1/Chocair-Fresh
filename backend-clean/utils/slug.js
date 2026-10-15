const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670]/g;
const NON_SLUG_CHARACTERS = /[^a-z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+/g;

export const slugify = (value) =>
  String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, '')
    .replace(/&/g, ' and ')
    .replace(NON_SLUG_CHARACTERS, '-')
    .replace(/^-+|-+$/g, '');

export const createUniqueSlug = async (Model, value, id, fallbackPrefix) => {
  let base = slugify(value) || `${fallbackPrefix}-${String(id).slice(-8)}`;
  if (fallbackPrefix === 'product' && /^[a-f0-9]{24}$/i.test(base)) base = `${base}-item`;
  let candidate = base;
  let suffix = 1;

  while (await Model.exists({ slug: candidate, _id: { $ne: id } })) {
    candidate = `${base}-${String(id).slice(-6)}${suffix > 1 ? `-${suffix}` : ''}`;
    suffix += 1;
  }

  return candidate;
};
