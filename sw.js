// Service worker de FindBtc — app shell offline, network-first.
// Pugeu CACHE_VERSION en cada canvi important per invalidar la memòria cau.
const CACHE_VERSION = 'findbtc-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png', './maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Les APIs externes (mempool, preus…) van directes a la xarxa, sense memòria cau.
  if (url.origin !== location.origin) return;
  // Network-first: en línia sempre la versió fresca; si falla, la memòria cau.
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
  );
});
