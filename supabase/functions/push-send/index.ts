// @ts-ignore — web-push from npm
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

webpush.setVapidDetails('mailto:carmenvictoria.pardo@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE)

export interface PushPayload {
  user_ids?: string[]   // si vacío → envía a todos
  title: string
  body: string
  url?: string
  tag?: string
}

// Función exportable para llamar desde otras edge functions
export async function sendPush(payload: PushPayload) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  let query = supabase.from('push_subscriptions').select('*')
  if (payload.user_ids?.length) query = query.in('user_id', payload.user_ids)

  const { data: subs } = await query
  if (!subs?.length) return { sent: 0 }

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: '/pwa-192.svg',
    badge: '/pwa-192.svg',
    url: payload.url || '/dashboard',
    tag: payload.tag || 'ignite',
  })

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        notification
      )
    )
  )

  // Limpiar suscripciones expiradas (410 Gone)
  const failedEndpoints = results
    .map((r, i) => r.status === 'rejected' ? subs[i]?.endpoint : null)
    .filter(Boolean)
  if (failedEndpoints.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', failedEndpoints as string[])
  }

  return { sent: results.filter(r => r.status === 'fulfilled').length }
}

// También expuesto como endpoint HTTP para llamadas admin
Deno.serve(async (req) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  if (req.method === 'OPTIONS') return new Response(null, { headers })

  try {
    const payload: PushPayload = await req.json()
    const result = await sendPush(payload)
    return new Response(JSON.stringify(result), { headers })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers })
  }
})
