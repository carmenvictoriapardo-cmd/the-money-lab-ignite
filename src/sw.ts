import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

declare let self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()

// Precache todos los assets del build
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Runtime caching para Supabase (NetworkFirst)
registerRoute(
  ({ url }) => url.hostname.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-cache',
    networkTimeoutSeconds: 3,
  })
)

// ─── PUSH NOTIFICATIONS ────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()

  event.waitUntil(
    self.registration.showNotification(data.title || '🔥 IGNITE', {
      body: data.body || '',
      icon: '/pwa-192.svg',
      badge: '/pwa-192.svg',
      vibrate: [100, 50, 100],
      tag: data.tag || 'ignite-notif',
      renotify: true,
      data: { url: data.url || '/dashboard' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    (self.clients as any)
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList: any[]) => {
        for (const client of clientList) {
          if ('navigate' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        return (self.clients as any).openWindow(url)
      })
  )
})
