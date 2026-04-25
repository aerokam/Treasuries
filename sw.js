// Service worker: network-first for page navigation and app JS/CSS.
// Ensures users always receive fresh code after a deploy without a hard refresh.
// Data requests (R2 CSV files) are left to normal browser cache behavior.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isAppAsset = isSameOrigin && (
    e.request.mode === 'navigate' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  );
  if (isAppAsset) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }));
  }
});
