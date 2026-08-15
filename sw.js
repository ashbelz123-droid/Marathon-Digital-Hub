const CACHE_NAME = "mdh-shell-v4";
const APP_SHELL = [
  "/",
  "/index.html",
  "/login.html",
  "/register.html",
  "/dashboard.html",
  "/machines.html",
  "/deposit.html",
  "/withdraw.html",
  "/income.html",
  "/profile.html",
  "/settings.html",
  "/referral.html",
  "/notifications.html",
  "/manifest.webmanifest",
  "/assets/js/mdh-navigation.js",
  "/assets/css/mdh-navigation.css"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
function networkFirst(request) {
  return fetch(request, {cache:"no-store"}).then(response => {
    if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
    return response;
  }).catch(() => caches.match(request));
}
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(caches.match(request).then(cached => cached || networkFirst(request)));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || networkFirst(request)));
});
self.addEventListener("message", event => { if (event.data === "SKIP_WAITING") self.skipWaiting(); });