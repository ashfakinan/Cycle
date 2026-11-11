// High-Performance Service Worker for Cycle PWA
// Provides instantaneous (<50ms) App Shell launches via Cache-First + Stale-While-Revalidate

const CACHE_NAME = 'cycle-pwa-v3';

const CRITICAL_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png'
];

// Offline HTML fallback if network is completely down and cache missed
const OFFLINE_FALLBACK = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cycle — Offline</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #F9F8F5; color: #1B1A17; text-align: center; padding: 24px; box-sizing: border-box; }
    .card { background: #fff; padding: 36px 28px; border-radius: 16px; border: 1px solid #E4E2DA; max-width: 380px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .mark { width: 44px; height: 44px; border-radius: 12px; background: #4E7A5D; display: inline-flex; align-items: center; justify-content: center; color: #fff; margin-bottom: 16px; }
    h2 { margin: 0 0 8px; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    p { margin: 0 0 20px; font-size: 13px; color: #7A7872; line-height: 1.5; }
    button { background: #4E7A5D; color: #fff; border: 0; padding: 11px 22px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <div class="mark">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a9 9 0 0 1 9 9" stroke-linecap="round"/><path d="M12 2a9 9 0 1 0 9 9" stroke-linecap="round" stroke-dasharray="2 3"/></svg>
    </div>
    <h2>Cycle is Offline</h2>
    <p>Saved local progress is secure. Tap reload once connection is restored to sync with the cloud.</p>
    <button onclick="window.location.reload()">Reload App</button>
  </div>
</body>
</html>`;

// Install: precache critical assets and skip waiting for immediate activation
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        CRITICAL_SHELL.map((url) =>
          fetch(url)
            .then((res) => {
              if (res.ok) return cache.put(url, res);
            })
            .catch(() => {})
        )
      );
    })
  );
});

// Activate: claim clients immediately and purge obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: instant cache responses with background revalidation
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = req.url;

  // 1. Pass-through live Firebase/Firestore/Google API calls directly
  // (Firebase SDK handles its own internal offline IndexedDb cache)
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('identitytoolkit.googleapis.com') ||
    url.includes('securetoken.googleapis.com') ||
    url.includes('apis.google.com') ||
    url.includes('accounts.google.com')
  ) {
    return;
  }

  // 2. Only intercept GET requests
  if (req.method !== 'GET') {
    return;
  }

  // 3. Skip development socket / HMR internals
  if (url.includes('__vite') || url.includes('@vite/client')) {
    return;
  }

  // 4. Navigation requests (App launch & route changes)
  // Cache-First with Background Revalidation = Instantaneous PWA load!
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        // Check if we have the shell in cache
        const cachedShell =
          (await cache.match(req)) ||
          (await cache.match('/')) ||
          (await cache.match('/index.html'));

        // Background update task: fetch freshest version from network
        const networkUpdate = fetch(req)
          .then(async (response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              await cache.put(req, clone.clone());
              await cache.put('/', clone.clone());
              await cache.put('/index.html', clone);
            }
            return response;
          })
          .catch(() => null);

        // If shell is cached, return it IMMEDIATELY (<10ms load time!)
        if (cachedShell) {
          // Let network update finish quietly in background
          networkUpdate.catch(() => {});
          return cachedShell;
        }

        // Cold first-time visit: wait for network response
        const networkResponse = await networkUpdate;
        if (networkResponse) {
          return networkResponse;
        }

        // If network failed and nothing cached, show clean offline shell
        return new Response(OFFLINE_FALLBACK, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      })()
    );
    return;
  }

  // 5. Static assets, scripts, stylesheets, Google Fonts & images
  // Strategy: Cache-First + Stale-While-Revalidate
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);

      // Background network fetch to keep cache fresh
      const networkFetch = fetch(req)
        .then(async (networkResponse) => {
          if (
            networkResponse &&
            (networkResponse.status === 200 || networkResponse.status === 0) &&
            !url.startsWith('chrome-extension')
          ) {
            try {
              await cache.put(req, networkResponse.clone());
            } catch {
              // Ignore cache put limits
            }
          }
          return networkResponse;
        })
        .catch(() => null);

      // If cached, return immediately from cache!
      if (cached) {
        return cached;
      }

      // If not cached, await network fetch
      const response = await networkFetch;
      if (response) {
        return response;
      }

      // Return a safe 404 response instead of throwing undefined
      return new Response(null, { status: 404, statusText: 'Not Found' });
    })()
  );
});
