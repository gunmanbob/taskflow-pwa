// TaskFlow PWA service worker (v2).
// Strategy: always revalidate same-origin requests against the network so new
// deploys load immediately; fall back to the cached shell only when offline.
// Supabase requests (API, auth, realtime websockets) and any cross-origin or
// non-GET request are left completely untouched.
//
// Bumping CACHE forces this worker to replace the old one, claim open pages,
// and delete the previous cache — which is what clears a stuck old copy.

const CACHE = 'taskflow-shell-v42';
const SHELL = [
  './',
  './index.html',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Leave everything that isn't a same-origin GET alone (incl. all Supabase calls).
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Revalidate with the server every time (download only if changed); use the
  // cached copy only if the network is unavailable.
  event.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
