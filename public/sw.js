const VERSION = 'caption-fix-v7';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const PRECACHE = ['/', '/index.html', '/offline.html', '/privacy/', '/terms/', '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/art/caption-herbarium.webp'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await cache.addAll(PRECACHE);
    const dependencies = new Set();
    for (const page of ['/', '/privacy/', '/terms/']) {
      const response = await cache.match(page);
      if (!response) continue;
      const html = await response.text();
      for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)["?]/g)) dependencies.add(match[1]);
    }
    if (dependencies.size) await cache.addAll([...dependencies]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => ![SHELL, RUNTIME].includes(key)).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => { const clone = response.clone(); caches.open(RUNTIME).then((cache) => cache.put(request, clone)); return response; }).catch(async () => (await caches.match(request)) || (await caches.match('/')) || caches.match('/offline.html')));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { if (response.ok) { const clone = response.clone(); caches.open(RUNTIME).then((cache) => cache.put(request, clone)); } return response; })));
});
