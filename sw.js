const CACHE_NAAM = 'keto-tracker-v30'
const BESTANDEN = ['/']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAAM).then(cache => cache.addAll(BESTANDEN))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAAM).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  // Alleen GET requests cachen
  if (e.request.method !== 'GET') return

  // API calls nooit cachen
  if (e.request.url.includes('anthropic.com') || 
      e.request.url.includes('openfoodfacts.org') ||
      e.request.url.includes('cdnjs.cloudflare.com')) return

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200) return response
        let copy = response.clone()
        caches.open(CACHE_NAAM).then(cache => cache.put(e.request, copy))
        return response
      }).catch(() => caches.match('/'))
    })
  )
})
