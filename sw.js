const CACHE_NAME = "mdh-shell-v2";
const APP_SHELL = ["/","/index.html","/login.html","/register.html","/dashboard.html","/machines.html","/deposit.html","/withdraw.html","/income.html","/profile.html","/settings.html","/manifest.webmanifest"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;const u=new URL(event.request.url);if(u.origin!==self.location.origin)return;event.respondWith(fetch(event.request,{cache:"no-store"}).catch(()=>caches.match(event.request)))})