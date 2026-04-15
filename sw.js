// Service worker: network-first for page navigation.
// Ensures users always receive fresh HTML after a deploy without a hard refresh.
// All other requests (CSS, JS, data) are left to normal browser cache behavior.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request, { cache: 'no-store' }));
  }
});
