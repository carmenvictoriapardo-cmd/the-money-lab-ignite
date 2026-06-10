import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  if (req.method === 'OPTIONS') return new Response(null, {
    headers: { ...headers, 'Access-Control-Allow-Headers': 'authorization, content-type' },
  })

  try {
    // Get all onboarded participants
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, program_start')
      .eq('onboarded', true)

    if (error || !profiles?.length) return new Response(JSON.stringify([]), { headers })

    const today = new Date().toISOString().split('T')[0]

    const scoreboard = await Promise.all(profiles.map(async (p) => {
      const [crearRes, revenueRes, standupRes, identityRes, streakRes] = await Promise.all([
        supabaseAdmin.from('weekly_scores')
          .select('total_score').eq('user_id', p.id)
          .order('week_number', { ascending: false }).limit(1),
        supabaseAdmin.from('revenue_events')
          .select('amount').eq('user_id', p.id),
        supabaseAdmin.from('weekly_standups')
          .select('id').eq('user_id', p.id),
        supabaseAdmin.from('identity_tracker')
          .select('confidence_level').eq('user_id', p.id)
          .order('created_at', { ascending: false }).limit(1),
        supabaseAdmin.from('daily_revenue_actions')
          .select('action_date').eq('user_id', p.id).eq('completed', true)
          .order('action_date', { ascending: false }).limit(60),
      ])

      const latestCrear      = crearRes.data?.[0]?.total_score ?? 0
      const totalRevenue     = (revenueRes.data ?? []).reduce((s, e) => s + Number(e.amount), 0)
      const standupsCount    = standupRes.data?.length ?? 0
      const latestIdentity   = identityRes.data?.[0]?.confidence_level ?? 0

      // Calculate current streak
      const dates = (streakRes.data ?? []).map(a => a.action_date).sort().reverse()
      let streak  = 0
      let checkDate = today
      for (const date of dates) {
        if (date === checkDate) {
          streak++
          const d = new Date(checkDate)
          d.setDate(d.getDate() - 1)
          checkDate = d.toISOString().split('T')[0]
        } else if (date < checkDate) break
      }

      // IGNITE Score (0–100)
      const igniteScore = Math.min(100, Math.round(
        latestCrear          * 0.35 +   // C.R.E.A.R. 35%
        Math.min(totalRevenue / 200, 20) +  // Revenue up to 20 pts
        Math.min(standupsCount * 4, 20) +   // Standups up to 20 pts
        latestIdentity * 10  * 0.15 +   // Identity 15%
        Math.min(streak * 1, 10)         // Streak up to 10 pts
      ))

      return {
        id:           p.id,
        name:         p.full_name || (p.email ?? '').split('@')[0] || 'Igniter',
        igniteScore,
        latestCrear,
        totalRevenue,
        standupsCount,
        latestIdentity,
        streak,
      }
    }))

    // Sort by IGNITE score descending
    scoreboard.sort((a, b) => b.igniteScore - a.igniteScore)
    return new Response(JSON.stringify(scoreboard), { headers })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers })
  }
})
