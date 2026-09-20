// Self-destructing service worker to invalidate old caches and unregister stale workers
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Delete all caches in CacheStorage
      if ('caches' in self) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }

      // Claim clients and unregister
      await self.clients.claim();
      await self.registration.unregister();

      // Notify open windows/tabs to refresh with fresh content
      const windowClients = await self.clients.matchAll({ type: 'window' });
      for (const client of windowClients) {
        client.postMessage({ type: 'SW_RELOAD' });
        if (client.url && 'navigate' in client) {
          try {
            await client.navigate(client.url);
          } catch (e) {
            // ignore navigation errors if client closed
          }
        }
      }
    })()
  );
});

// Network-only fallback: never serve stale cached requests
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
