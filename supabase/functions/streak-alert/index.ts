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
  const today = new Date().toISOString().split('T')[0]

  // Usuarios que tienen racha activa (completaron ayer) pero NO hoy todavía
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const { data: doneYesterday } = await supabase
    .from('daily_revenue_actions')
    .select('user_id')
    .eq('action_date', yesterdayStr)
    .eq('completed', true)

  if (!doneYesterday?.length) return new Response(JSON.stringify({ sent: 0 }), { headers })

  const { data: doneToday } = await supabase
    .from('daily_revenue_actions')
    .select('user_id')
    .eq('action_date', today)
    .eq('completed', true)

  const doneTodayIds = new Set((doneToday || []).map(d => d.user_id))
  const atRiskIds = doneYesterday.filter(d => !doneTodayIds.has(d.user_id)).map(d => d.user_id)

  if (!atRiskIds.length) return new Response(JSON.stringify({ sent: 0 }), { headers })

  // Verificar que tienen notif_streak habilitado
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .in('id', atRiskIds)
    .eq('notif_streak', true)

  const eligibleIds = (profiles || []).map(p => p.id)
  if (!eligibleIds.length) return new Response(JSON.stringify({ sent: 0 }), { headers })

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', eligibleIds)

  if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { headers })

  const notification = JSON.stringify({
    title: '⚡ ¡No pierdas tu racha!',
    body: 'Solo faltan minutos para completar tu acción de hoy. ¡No la dejes ir!',
    icon: '/pwa-192.svg',
    badge: '/pwa-192.svg',
    url: '/accion',
    tag: 'streak-alert',
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
