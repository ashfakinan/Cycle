// Service Worker for Cycle PWA
const CACHE_NAME = 'cycle-cache-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png'
];

// Install: precache critical assets safely
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache each asset individually to prevent one failure from breaking the whole install
      await Promise.all(
        STATIC_ASSETS.map((url) =>
          fetch(url)
            .then((res) => {
              if (res.ok) return cache.put(url, res);
            })
            .catch((err) => {
              console.warn('[SW] Precache skipped for:', url, err);
            })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up older caches immediately
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

// Fetch: smart network-first for navigation, resilient fallback for assets
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 1. Pass through Google, Firebase, Firestore, and auth endpoints directly
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('identitytoolkit.googleapis.com') ||
    url.includes('securetoken.googleapis.com') ||
    url.includes('apis.google.com') ||
    url.includes('accounts.google.com')
  ) {
    return;
  }

  // 2. Navigation requests (opening or refreshing the PWA)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
              cache.put('/', clone.clone());
              cache.put('/index.html', clone.clone());
            });
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedNavigate =
            (await cache.match(event.request)) ||
            (await cache.match('/')) ||
            (await cache.match('/index.html'));

          if (cachedNavigate) {
            return cachedNavigate;
          }

          // Fallback offline shell response
          return new Response(
            `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cycle — Offline</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #F9F8F5; color: #202720; text-align: center; padding: 20px; box-sizing: border-box; }
    .card { background: #fff; padding: 32px 24px; border-radius: 16px; border: 1px solid #E6EAE3; max-width: 380px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
    h2 { margin: 0 0 8px; font-size: 20px; }
    p { margin: 0 0 20px; font-size: 13px; color: #7D877D; line-height: 1.5; }
    button { background: #4E7A5D; color: #fff; border: 0; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Cycle is Offline</h2>
    <p>We couldn't connect right now. When you're back online, tap reload to sync your study progress.</p>
    <button onclick="window.location.reload()">Reload Cycle</button>
  </div>
</body>
</html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // 3. Skip non-GET requests (e.g. POST, PUT, DELETE)
  if (event.request.method !== 'GET') {
    return;
  }

  // 4. Vite HMR and dynamic development resources
  if (url.includes('__vite') || url.includes('@vite')) {
    return;
  }

  // 5. Static resources: Cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset, revalidate in background if online
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Network failure during background revalidation is completely fine
          });
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            !url.startsWith('chrome-extension')
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Guaranteed safe response (never returns undefined)
          return new Response(null, { status: 404, statusText: 'Not Found Offline' });
        });
    })
  );
});
