import crypto from 'crypto';

/**
 * Tiny in-process cache for hot, read-mostly data (catalog, categories, home config).
 *
 * - Single-flight: concurrent misses share one DB round-trip.
 * - Stale-while-revalidate: slightly old data is served instantly while a refresh runs.
 * - Stale-on-error: if the DB is unreachable we keep serving the last good snapshot
 *   instead of an empty list.
 * - Tag invalidation: Mongoose model hooks call invalidateTag() on every write so
 *   admins and stock changes are reflected immediately.
 *
 * Disabled under NODE_ENV=test because the test-suite wipes collections with the raw
 * driver (bypassing Mongoose hooks).
 */

const CACHE_ENABLED = process.env.NODE_ENV !== 'test';

const tagListeners = new Map();

export const invalidateTag = (tag) => {
  const listeners = tagListeners.get(tag);
  if (listeners) listeners.forEach((fn) => fn());
};

const subscribe = (tag, fn) => {
  if (!tagListeners.has(tag)) tagListeners.set(tag, new Set());
  tagListeners.get(tag).add(fn);
};

const buildEntry = (value, ttlMs) => {
  const json = JSON.stringify(value);
  const etag = `W/"${crypto.createHash('sha1').update(json).digest('base64url')}"`;
  const now = Date.now();
  return { value, json, etag, createdAt: now, expiresAt: now + ttlMs };
};

/**
 * @param {object} opts
 * @param {string} opts.name           - label used in logs
 * @param {() => Promise<any>} opts.load - loader hitting the database
 * @param {string[]} opts.tags         - invalidation tags
 * @param {number} [opts.ttlMs]        - freshness window
 * @param {number} [opts.maxStaleMs]   - how long a stale entry may be served while refreshing
 */
export const createCachedResource = ({ name, load, tags = [], ttlMs = 30000, maxStaleMs = 10 * 60 * 1000 }) => {
  let entry = null;
  let inflight = null;
  let version = 0;

  const invalidate = () => {
    version += 1;
    entry = null;
    inflight = null;
  };

  tags.forEach((tag) => subscribe(tag, invalidate));

  const refresh = () => {
    if (inflight) return inflight;
    const startVersion = version;
    const promise = (async () => {
      const value = await load();
      const built = buildEntry(value, ttlMs);
      // Do not store a snapshot that was invalidated by a write while it was loading.
      if (CACHE_ENABLED && startVersion === version) entry = built;
      return built;
    })();
    inflight = promise;
    promise
      .catch(() => {})
      .finally(() => {
        if (inflight === promise) inflight = null;
      });
    return promise;
  };

  const get = async () => {
    if (!CACHE_ENABLED) return buildEntry(await load(), 0);

    const now = Date.now();
    if (entry && now < entry.expiresAt) return entry;

    if (entry && now - entry.expiresAt < maxStaleMs) {
      const stale = entry;
      refresh().catch((err) => console.error(`[cache:${name}] background refresh failed: ${err.message}`));
      return stale;
    }

    try {
      return await refresh();
    } catch (err) {
      if (entry) {
        console.error(`[cache:${name}] refresh failed, serving stale snapshot: ${err.message}`);
        return entry;
      }
      throw err;
    }
  };

  return { get, invalidate, refresh };
};

/**
 * Attach post-write hooks to a schema so any write through Mongoose invalidates the
 * given cache tags. Must be called before mongoose.model() compiles the schema.
 */
export const invalidateOnWrite = (schema, ...tags) => {
  const fire = () => tags.forEach(invalidateTag);
  const queryOps = [
    'updateOne',
    'updateMany',
    'findOneAndUpdate',
    'findOneAndReplace',
    'findOneAndDelete',
    'replaceOne',
    'deleteMany',
  ];
  schema.post('save', fire);
  schema.post('insertMany', fire);
  schema.post(queryOps, fire);
  schema.post('deleteOne', { document: true, query: true }, fire);
  schema.post('bulkWrite', fire);
};

/**
 * Send a cached entry with a strong validator so browsers can revalidate cheaply (304).
 */
export const sendCachedJson = (req, res, entry, cacheControl = 'no-cache') => {
  res.set('Cache-Control', cacheControl);
  res.set('ETag', entry.etag);
  if (req.fresh) {
    res.status(304).end();
    return;
  }
  res.type('application/json').send(entry.json);
};
