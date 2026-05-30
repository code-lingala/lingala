// Lingala service worker — minimal, network-first.
//
// The previous version was an aggressive precache that hid every code change
// behind stale responses; the one before that was a kill-switch (unregister on
// activate). This version is the safe middle: it exists so Chrome considers
// the site installable (PWA install criteria require a fetch handler), but it
// ALWAYS tries the network first and only falls back to cache when offline.
// Your latest deploy is what users see; offline gets a best-effort fallback.

const CACHE = 'lingala-v1';
const OFFLINE_FALLBACK = [
  '/',
  '/card.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(OFFLINE_FALLBACK).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  // GET only — never intercept POST/PUT/etc.
  if (e.request.method !== 'GET') return;

  // Don't touch cross-origin (Google Fonts, GA, etc.) — let them stream.
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith((async () => {
    try {
      // Network first. Update cache opportunistically for next-offline.
      const fresh = await fetch(e.request);
      if (fresh && fresh.ok && fresh.type === 'basic') {
        const copy = fresh.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy).catch(() => {}));
      }
      return fresh;
    } catch (_) {
      // Offline: serve from cache if we have it, otherwise the precached "/".
      const hit = await caches.match(e.request);
      if (hit) return hit;
      return caches.match('/');
    }
  })());
});
