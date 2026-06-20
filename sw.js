/**
 * sw.js
 * Caches the app shell (HTML/CSS/JS) so the app opens instantly offline.
 * Data itself (products, transactions) lives in IndexedDB, not here —
 * this worker only makes sure the UI loads without a network connection.
 * Bump CACHE_NAME whenever you change any cached file so old clients
 * pick up the update instead of serving stale code forever.
 */

// Bumped cache name so clients fetch updated JS after this deploy
const CACHE_NAME = 'utility-store-shell-v4';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/config.js',
  './js/db.js',
  './js/hash.js',
  './js/api.js',
  './js/auth.js',
  './js/sync.js',
  './js/inventory.js',
  './js/billing.js',
  './js/app.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return; // never intercept POSTs to the Apps Script backend

  // Network-first for navigations so updates show up when online;
  // fall back to the cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-first for the static shell assets.
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const resClone = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
      return res;
    }).catch(() => cached))
  );
});
