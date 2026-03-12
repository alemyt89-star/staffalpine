const CACHE_NAME = 'staffalpine-v3';
const urlsToCache = [
  '/index.html',
  '/dashboard-lavoratore.html',
  '/dashboard-azienda.html',
  '/login.html',
  '/recensione.html',
  '/esplora-aziende.html'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});