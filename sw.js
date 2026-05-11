const CACHE_NAME = 'staffalpine-v10';
const urlsToCache = [
  '/index.html',
  '/login.html',
  '/come-funziona.html',
  '/recensione.html',
  '/dashboard-lavoratore.html',
  '/dashboard-azienda.html',
  '/dettaglio-azienda.html',
  '/esplora-aziende.html',
  '/offerta.html',
  '/registrazione_aziende.html',
  '/stella-alpina.svg',
  '/manifest.json',
  '/informativa-privacy.html',
  '/termini.html',
  '/cookie-policy.html',
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
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Non cachare le chiamate API e Supabase — sempre fresh
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('resend.com')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Per tutto il resto: network first, cache come fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Aggiorna la cache con la risposta fresca
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
