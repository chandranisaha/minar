/* Money Mohalla offline cache (added with Pillar 4). Stale-while-revalidate for same-origin GET requests. */
const CACHE = 'mm-offline-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/index.html'])).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req)
      const net = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone())
          return res
        })
        .catch(() => undefined)
      if (hit) return hit
      const res = await net
      if (res) return res
      // offline navigation: serve the app shell
      if (req.mode === 'navigate') return (await cache.match('/index.html')) || (await cache.match('/'))
      return Response.error()
    }),
  )
})
