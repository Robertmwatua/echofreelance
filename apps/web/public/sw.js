/* Only the offline screen and public install assets are stored.
 * Account pages, API responses, lessons and credentials are never put in Cache Storage. */
const SHELL = 'ef-public-shell-v2';
const ASSETS = ['/offline.html', '/manifest.webmanifest', '/icons/app-192.png', '/icons/app-512.png', '/icons/app-maskable-512.png'];
self.addEventListener('install', event => { event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(ASSETS))); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('ef-public-shell-') && key !== SHELL).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline.html').then(response => response || new Response('You are offline. Reconnect and try again.', {status:503,headers:{'Content-Type':'text/plain'}}))));
  } else if (url.pathname.startsWith('/_next/static/')) {
    // Immutable public JS/CSS only; never cache API responses or authenticated HTML.
    event.respondWith(caches.open(SHELL).then(async cache=>{const hit=await cache.match(request);if(hit)return hit;const response=await fetch(request);if(response.ok){const keys=await cache.keys();if(keys.length>150)await cache.delete(keys[0]);await cache.put(request,response.clone());}return response;}));
  } else if (ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
  }
});
