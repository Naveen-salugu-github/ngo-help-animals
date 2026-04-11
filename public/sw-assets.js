const CACHE_NAME = "soul-space-3d-assets-v2"
const ASSETS = [
  "/models/dog.glb",
  "/models/cat.glb",
  "/models/bird.glb",
  "/models/tree.glb",
  "/models/house.glb",
  "/models/plant.glb",
  "/models/cloud.glb",
  "/hdri/brown_photostudio_02_1k.hdr",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return
  if (!ASSETS.includes(url.pathname)) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
