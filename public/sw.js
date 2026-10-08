// L'ancienne version du site installait un service worker de cache hors ligne.
// Celui-ci le remplace : il vide les caches, se désinstalle et recharge les pages ouvertes,
// pour que tout le monde reçoive la nouvelle version du jeu.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
      await self.registration.unregister()
      const clients = await self.clients.matchAll({ type: 'window' })
      clients.forEach((c) => c.navigate(c.url))
    })(),
  )
})
