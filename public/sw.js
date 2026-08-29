// Minimal service worker: exists only to satisfy browser PWA-installability
// checks (a registered SW with a fetch handler). Deliberately does no
// caching -- this is a live admin dashboard, stale offline data would be
// actively harmful, so every request just passes straight through.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
