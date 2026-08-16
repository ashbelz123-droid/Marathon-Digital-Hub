/* MDH service worker - asset cache only.
   IMPORTANT: HTML/navigation is intentionally NOT intercepted.
   This prevents stale PWA caches from breaking pages such as profile.html. */
const CACHE_NAME = "mdh-assets-v10";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll([
        "/assets/js/mdh-navigation.js",
        "/assets/css/mdh-navigation.css",
        "/assets/css/mdh-ui.css",
        "/assets/icons/mdh.svg"
      ]).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // NEVER intercept document/navigation requests.
  // Let Vercel/browser fetch the current HTML directly.
  if (request.mode === "navigate" || request.destination === "document") return;

  // Static assets: network first, cache fallback.
  if (["style", "script", "image", "font"].includes(request.destination)) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || Response.error()))
    );
  }
});

self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
