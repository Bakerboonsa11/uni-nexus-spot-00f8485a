const CACHE_NAME = 'nexus-spot-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/education.svg',
  '/assets/placeholder.svg',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // The /assets path is based on the vite config base or publicDir setting
        // Assuming standard vite setup where `public` dir is root
        return fetch('/assets-manifest.json') 
          .then(response => response.json()) 
          .then(assets => {
            const viteAssets = Object.values(assets).map(asset => asset.file);
            const allToCache = [...ASSETS_TO_CACHE, ...viteAssets];
            console.log('Caching assets:', allToCache);
            return cache.addAll(allToCache);
          })
          .catch(err => {
            console.log('No assets-manifest.json found, caching default assets.', err);
            return cache.addAll(ASSETS_TO_CACHE);
          });
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // For API calls, always go to the network
  if (event.request.url.includes('/api/') || event.request.url.includes('firestore.googleapis.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Return from cache
        }
        // Not in cache, go to network
        return fetch(event.request).then((networkResponse) => {
            // Optionally, add the new request to the cache
            // Be careful with what you cache, especially with third-party URLs
            return networkResponse;
        });
      })
  );
});