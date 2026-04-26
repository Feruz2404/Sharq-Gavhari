/* Sharq Gavhari internal SW — caches /tablet and /admin assets only. */
const CACHE = 'sg-internal-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const internal = url.pathname.startsWith('/tablet') || url.pathname.startsWith('/admin')
    || url.pathname.startsWith('/assets') || url.pathname.startsWith('/icons')
    || url.pathname === '/sw-internal.js' || url.pathname.endsWith('manifest-tablet.json')
    || url.pathname.endsWith('manifest-admin.json');
  if (!internal) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const res = await fetch(request);
      if (res.ok && (request.destination === 'script' || request.destination === 'style' ||
                     request.destination === 'image' || request.destination === 'font')) {
        const c = await caches.open(CACHE);
        c.put(request, res.clone());
      }
      return res;
    } catch (e) {
      return cached || Response.error();
    }
  })());
});
