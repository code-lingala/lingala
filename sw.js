// Lingala service worker — TEMPORARILY DISABLED during active development.
//
// The cached service worker was serving stale files and hiding every change.
// This version is a kill-switch: on activate it deletes ALL caches, unregisters
// itself, and reloads open tabs — so after one load there is no service worker
// left to intercept anything and the browser always fetches fresh from the
// server. Registration is also commented out in js/app.js.
//
// ⚠️ Re-enable real offline support before launch (network-first + precache).
// The previous implementation is in git history / todo.md.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => c.navigate(c.url));
  })());
});
