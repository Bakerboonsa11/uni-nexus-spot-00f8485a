import { precacheAndRoute } from 'workbox-precaching';

const CACHE_NAME = 'nexus-spot-cache-v1';

// The vite-plugin-pwa will inject the manifest here
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('install', (event) => {
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
            return networkResponse;
        });
      })
  );
});
