// @ts-ignore
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET   = Deno.env.get('CRON_SECRET') || 'ignite-cron-2026'

webpush.setVapidDetails('mailto:carmenvictoria.pardo@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE)

Deno.serve(async (req) => {
  const headers = { 'Content-Type': 'application/json' }
  const auth = req.headers.get('Authorization') || ''
  if (!auth.includes(CRON_SECRET)) return new Response('Unauthorized', { status: 401 })

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // Usuarios onboarded con notif_weekly habilitado
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('onboarded', true)
    .eq('notif_weekly', true)

  if (!profiles?.length) return new Response(JSON.stringify({ sent: 0 }), { headers })

  const userIds = profiles.map(p => p.id)
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', userIds)

  if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { headers })

  const notification = JSON.stringify({
    title: '📊 ¿Enviaste tu revisión semanal?',
    body: 'Carmen revisa los reportes del fin de semana. Envíala ahora y recibe su feedback.',
    icon: '/pwa-192.svg',
    badge: '/pwa-192.svg',
    url: '/reviews',
    tag: 'weekly-reminder',
  })

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        notification
      )
    )
  )

  const failed = results.map((r, i) => r.status === 'rejected' ? subs[i]?.endpoint : null).filter(Boolean)
  if (failed.length) await supabase.from('push_subscriptions').delete().in('endpoint', failed as string[])

  return new Response(JSON.stringify({ sent: results.filter(r => r.status === 'fulfilled').length }), { headers })
})
