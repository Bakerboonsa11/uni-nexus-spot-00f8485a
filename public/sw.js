const CACHE_NAME = 'nexus-spot-v1';
const urlsToCache = [
  '/',
  '/home',
  '/services',
  '/market',
  '/jobs',
  '/dashboard',
  '/auth'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
