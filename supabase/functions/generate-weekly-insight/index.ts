import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeekData {
  week_number: number
  day_of_program: number
  standup?: {
    win: string
    revenue_action: string
    needs_from_mentor: string
  }
  crear_current?: {
    claridad: number; revenue: number; ejecucion: number; autoridad: number; relaciones: number
    total: number
  }
  crear_previous?: {
    claridad: number; revenue: number; ejecucion: number; autoridad: number; relaciones: number
    total: number
  }
  revenue_this_week: number
  revenue_total: number
  active_blockers: Array<{ type: string; description: string }>
  resolved_blockers_this_week: number
  identity_confidence?: number
  participant_name: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const data: WeekData = await req.json()

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY no configurada')

    // ── Build context strings ────────────────────────────────────────────
    const standupCtx = data.standup
      ? `STANDUP SEMANAL:
  • Win de la semana: "${data.standup.win}"
  • Acción de revenue ejecutada: "${data.standup.revenue_action}"
  • Qué necesita del mentor: "${data.standup.needs_from_mentor}"`
      : 'STANDUP: No completado esta semana.'

    const crearDelta = (key: keyof typeof data.crear_current) => {
      if (!data.crear_current || !data.crear_previous) return ''
      const curr = data.crear_current[key] as number
      const prev = data.crear_previous[key] as number
      const diff = curr - prev
      if (diff === 0) return ' (sin cambio)'
      return diff > 0 ? ` (↑${diff} vs semana anterior)` : ` (↓${Math.abs(diff)} vs semana anterior)`
    }

    const crearCtx = data.crear_current
      ? `C.R.E.A.R. SCORECARD (semana ${data.week_number}):
  • Claridad: ${data.crear_current.claridad}/10${crearDelta('claridad')}
  • Revenue (acciones): ${data.crear_current.revenue}/10${crearDelta('revenue')}
  • Ejecución: ${data.crear_current.ejecucion}/10${crearDelta('ejecucion')}
  • Autoridad: ${data.crear_current.autoridad}/10${crearDelta('autoridad')}
  • Relaciones: ${data.crear_current.relaciones}/10${crearDelta('relaciones')}
  • Total: ${data.crear_current.total}%`
      : 'C.R.E.A.R.: No completado esta semana.'

    const revenueCtx = `REVENUE:
  • Esta semana: ${data.revenue_this_week > 0 ? `$${data.revenue_this_week.toLocaleString()}` : '$0'}
  • Acumulado en el programa: ${data.revenue_total > 0 ? `$${data.revenue_total.toLocaleString()}` : '$0'}`

    const blockersCtx = data.active_blockers.length > 0
      ? `BLOQUEOS ACTIVOS (${data.active_blockers.length}):
${data.active_blockers.map(b => `  • [${b.type.toUpperCase()}] "${b.description}"`).join('\n')}
Bloqueos resueltos esta semana: ${data.resolved_blockers_this_week}`
      : `BLOQUEOS: Sin bloqueos activos. ${data.resolved_blockers_this_week > 0 ? `${data.resolved_blockers_this_week} resuelto(s) esta semana.` : ''}`

    const identityCtx = data.identity_confidence
      ? `IDENTIDAD: Confianza esta semana: ${data.identity_confidence}/10`
      : 'IDENTIDAD: Sin registro esta semana.'

    // ── Prompt ──────────────────────────────────────────────────────────
    const systemPrompt = `Eres el Sistema de Análisis Estratégico de THE MONEY LAB™ IGNITE — el programa de 90 días para emprendedores.

Tu rol: Cada semana, analizas todos los datos de un participante y generas un Informe de Diagnóstico Semanal que conecta puntos que ellos no pueden ver solos. Este informe vale más que una hora de coaching estándar.

PRINCIPIOS DE ANÁLISIS:
- Los datos cuantitativos (C.R.E.A.R., revenue, bloqueos) revelan patrones que las palabras ocultan
- Lo que NO hicieron (standup sin llenar, C.R.E.A.R. en 0) dice tanto como lo que sí hicieron
- Busca contradicciones: ¿dicen que ejecutaron pero revenue = $0? ¿Claridad alta pero sin acciones?
- El día del programa importa: semana 1 es diferente a semana 8
- Conecta el win con las áreas débiles del C.R.E.A.R.

FORMATO EXACTO (en español, sin variaciones):

**🎯 TU SEMANA ${data.week_number} EN UNA LÍNEA**
[Una oración poderosa, específica a sus datos. No genérica.]

**✅ LO QUE ESTÁ FUNCIONANDO**
• [Observación 1 — basada en datos concretos]
• [Observación 2 — conecta al menos 2 fuentes de datos]

**🔍 EL PATRÓN QUE VEO**
[El patrón real que emerge de los datos — puede ser positivo o una alerta. 2-3 líneas.]

**⚠️ PUNTO CIEGO**
[Algo que los datos muestran claramente pero que probablemente no están viendo. Sé directo, no suavices.]

**⚡ TUS 3 ACCIONES PARA LA SEMANA ${data.week_number + 1}**
1. [Acción específica — con contexto de POR QUÉ basado en sus datos]
2. [Acción específica — orientada al área más débil del C.R.E.A.R.]
3. [Acción específica — para capitalizar lo que está funcionando]

**❓ LA PREGUNTA DE LA SEMANA**
[Una sola pregunta que cambie su perspectiva sobre su negocio. No retórica — que invite a reflexión real.]

REGLAS:
- Máximo 380 palabras
- Nunca copies textualmente lo que escribieron en el standup — analiza, no transcribas
- Si no completaron el standup o C.R.E.A.R., menciónalo en el patrón (es un dato importante)
- Usa su nombre solo en la primera línea si corresponde
- Cero frases motivacionales vacías`

    const userMessage = `PARTICIPANTE: ${data.participant_name}
DÍA DEL PROGRAMA: ${data.day_of_program} de 90 (Semana ${data.week_number} de 13)

${standupCtx}

${crearCtx}

${revenueCtx}

${blockersCtx}

${identityCtx}

Genera el Informe de Diagnóstico de la Semana ${data.week_number}.`

    // ── Call Claude ──────────────────────────────────────────────────────
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 900,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Anthropic API error ${response.status}: ${err}`)
    }

    const aiData = await response.json()
    const insight = aiData.content?.[0]?.text
    if (!insight) throw new Error('Respuesta vacía de la IA')

    return new Response(
      JSON.stringify({ insight }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error en generate-weekly-insight:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
