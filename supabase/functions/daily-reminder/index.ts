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

  // Verificar que es llamada autorizada (desde cron)
  const auth = req.headers.get('Authorization') || ''
  if (!auth.includes(CRON_SECRET)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const today = new Date().toISOString().split('T')[0]

  // Obtener usuarios con suscripción push que tienen notif_daily = true
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('onboarded', true)
    .eq('notif_daily', true)

  if (!profiles?.length) return new Response(JSON.stringify({ sent: 0 }), { headers })

  // Filtrar los que YA completaron su acción hoy (no molestarlos)
  const { data: doneToday } = await supabase
    .from('daily_revenue_actions')
    .select('user_id')
    .eq('action_date', today)
    .eq('completed', true)

  const doneTodayIds = new Set((doneToday || []).map(d => d.user_id))
  const pendingIds = profiles.filter(p => !doneTodayIds.has(p.id)).map(p => p.id)

  if (!pendingIds.length) return new Response(JSON.stringify({ sent: 0, reason: 'all done' }), { headers })

  // Obtener suscripciones
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', pendingIds)

  if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { headers })

  const notification = JSON.stringify({
    title: '🔥 IGNITE — Tu ritual de hoy',
    body: '¿Ya tienes tu acción del día? 90 segundos en la app.',
    icon: '/pwa-192.svg',
    badge: '/pwa-192.svg',
    url: '/accion',
    tag: 'daily-reminder',
  })

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        notification
      )
    )
  )

  // Limpiar expiradas
  const failed = results.map((r, i) => r.status === 'rejected' ? subs[i]?.endpoint : null).filter(Boolean)
  if (failed.length) await supabase.from('push_subscriptions').delete().in('endpoint', failed as string[])

  return new Response(JSON.stringify({ sent: results.filter(r => r.status === 'fulfilled').length }), { headers })
})
