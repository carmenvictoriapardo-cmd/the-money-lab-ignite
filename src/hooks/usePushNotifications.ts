import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const VAPID_PUBLIC = 'BF-Tsh469WIlQB-koVR9w6tGPZty1a_2eqSvubN7WpE15ybIogNYxtDn1Hq0X9HoqspAsYDF9K7wAWAEsf7Ak5I'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export type NotifPermission = 'default' | 'granted' | 'denied' | 'unsupported'

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotifPermission>('default')
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (!('Notification' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as NotifPermission)
  }, [])

  async function subscribe(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

    setSubscribing(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm as NotifPermission)
      if (perm !== 'granted') return false

      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      })

      const subJson = sub.toJSON()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return false

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/push-subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          }),
        }
      )

      return res.ok
    } catch (err) {
      console.error('Push subscribe error:', err)
      return false
    } finally {
      setSubscribing(false)
    }
  }

  async function unsubscribe() {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.getSubscription()
    if (sub) {
      await sub.unsubscribe()
      setPermission('default')
    }
  }

  return { permission, subscribing, subscribe, unsubscribe }
}
