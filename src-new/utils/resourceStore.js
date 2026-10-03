import { useEffect, useSyncExternalStore } from 'react';
import api from './api';

/**
 * Shared, app-wide cache for read-mostly API collections (products, categories).
 *
 * - One in-flight request per resource no matter how many components ask for it.
 * - Instant render from the last good snapshot in localStorage, then revalidate.
 * - A failed refresh never wipes good data; it retries with backoff and again on
 *   tab focus / reconnect.
 */
const createResourceStore = ({ url, cacheKey, legacyCacheKeys = [], staleMs = 30000 }) => {
  const readCache = () => {
    try {
      legacyCacheKeys.forEach((k) => localStorage.removeItem(k));
      const raw = localStorage.getItem(cacheKey);
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const writeCache = (data) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch {
      // Storage full or unavailable – the in-memory copy is still used.
    }
  };

  let state = { data: readCache(), status: 'idle', error: null, updatedAt: 0 };
  const listeners = new Set();
  let inflight = null;
  let retryTimer = null;
  let retryAttempt = 0;

  const emit = () => listeners.forEach((listener) => listener());

  const setState = (patch) => {
    state = { ...state, ...patch };
    emit();
  };

  const scheduleRetry = () => {
    clearTimeout(retryTimer);
    const delay = Math.min(60000, 3000 * 2 ** retryAttempt);
    retryAttempt += 1;
    retryTimer = setTimeout(() => fetchData({ force: true }), delay);
  };

  const fetchData = ({ force = false } = {}) => {
    if (inflight) return inflight;
    if (!force && state.data && Date.now() - state.updatedAt < staleMs) {
      return Promise.resolve(state.data);
    }

    clearTimeout(retryTimer);
    if (state.status !== 'loading') setState({ status: 'loading' });

    const request = api
      .get(url)
      .then((res) => {
        if (!Array.isArray(res.data)) throw new Error('Unexpected response from server');
        retryAttempt = 0;
        writeCache(res.data);
        setState({ data: res.data, status: 'success', error: null, updatedAt: Date.now() });
        return res.data;
      })
      .catch((err) => {
        setState({ status: 'error', error: err?.message || 'Failed to load data' });
        scheduleRetry();
        return state.data;
      })
      .finally(() => {
        if (inflight === request) inflight = null;
      });

    inflight = request;
    return request;
  };

  /** Local optimistic update (admin create/update/delete). */
  const mutate = (updater) => {
    const next = updater(state.data || []);
    writeCache(next);
    setState({ data: next });
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const getSnapshot = () => state;

  return { fetch: fetchData, mutate, subscribe, getSnapshot };
};

export const productsStore = createResourceStore({
  url: '/products',
  cacheKey: 'cf_products_v2',
  legacyCacheKeys: ['cf_cached_products'],
});

export const categoriesStore = createResourceStore({
  url: '/categories',
  cacheKey: 'cf_cached_categories',
  staleMs: 60000,
});

const stores = [productsStore, categoriesStore];

if (typeof window !== 'undefined') {
  const revalidateAll = () => stores.forEach((store) => store.fetch());
  window.addEventListener('online', revalidateAll);
  window.addEventListener('focus', revalidateAll);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') revalidateAll();
  });
}

/** Kick off loading as early as possible (called before React renders). */
export const prefetchCatalog = () => stores.forEach((store) => store.fetch());

const EMPTY = [];

export const useResource = (store) => {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  useEffect(() => {
    store.fetch();
  }, [store]);

  const hasData = snapshot.data !== null;
  return {
    data: snapshot.data || EMPTY,
    loading: !hasData && snapshot.status !== 'error',
    error: !hasData && snapshot.status === 'error' ? snapshot.error : null,
    refreshing: snapshot.status === 'loading',
    refetch: () => store.fetch({ force: true }),
  };
};
