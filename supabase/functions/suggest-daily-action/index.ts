import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ActionContext {
  participant_name: string
  week_number: number
  day_of_program: number
  crear_scores?: {
    claridad: number
    revenue: number
    ejecucion: number
    autoridad: number
    relaciones: number
  }
  revenue_total: number
  active_blockers: Array<{ type: string; description: string }>
  last_actions?: string[]  // last 3 completed actions for variety
  offer_description?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const data: ActionContext = await req.json()

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY no configurada')

    // Find weakest CREAR dimension
    let weakestDimension = 'revenue'
    if (data.crear_scores) {
      const dims = [
        { key: 'revenue', val: data.crear_scores.revenue },
        { key: 'claridad', val: data.crear_scores.claridad },
        { key: 'ejecucion', val: data.crear_scores.ejecucion },
        { key: 'autoridad', val: data.crear_scores.autoridad },
        { key: 'relaciones', val: data.crear_scores.relaciones },
      ]
      weakestDimension = dims.sort((a, b) => a.val - b.val)[0].key
    }

    const crearCtx = data.crear_scores
      ? `C.R.E.A.R. más reciente:
  • Claridad: ${data.crear_scores.claridad}/10
  • Revenue (acciones): ${data.crear_scores.revenue}/10
  • Ejecución: ${data.crear_scores.ejecucion}/10
  • Autoridad: ${data.crear_scores.autoridad}/10
  • Relaciones: ${data.crear_scores.relaciones}/10
  → Dimensión más débil: ${weakestDimension.toUpperCase()}`
      : 'Sin scorecard C.R.E.A.R. todavía.'

    const blockersCtx = data.active_blockers.length > 0
      ? `Bloqueos activos:\n${data.active_blockers.map(b => `  • [${b.type.toUpperCase()}] "${b.description}"`).join('\n')}`
      : 'Sin bloqueos activos.'

    const lastActionsCtx = data.last_actions?.length
      ? `Últimas acciones completadas (para no repetir):\n${data.last_actions.map(a => `  • "${a}"`).join('\n')}`
      : ''

    const systemPrompt = `Eres el Motor de Acción Diaria de THE MONEY LAB™ IGNITE.

Tu único trabajo: generar UNA sola acción de revenue concreta, ejecutable hoy en menos de 2 horas, específica a los datos de este emprendedor.

CRITERIOS DE UNA BUENA ACCIÓN:
- Concreta y verificable (no "trabaja en tu oferta" — sino "escribe 3 bullets de resultado de tu oferta y postéalo en Instagram")
- Orientada a revenue directo o a pipeline (conversaciones, visibilidad, propuestas)
- Ejecutable HOY, no "esta semana"
- Específica: incluye número, plataforma, o detalle accionable cuando aplique
- Nivel de dificultad apropiado al día del programa (día 5 ≠ día 70)

RESPONDE SOLO CON ESTE FORMATO (nada más):

ACCIÓN: [La acción en 1-2 oraciones. Directa, sin adornos.]

POR QUÉ HOY: [1 oración explicando por qué esta acción específicamente, basada en sus datos.]

TIEMPO: [X minutos / X horas]`

    const userMessage = `PARTICIPANTE: ${data.participant_name}
Día ${data.day_of_program} de 90 | Semana ${data.week_number} de 13
Revenue acumulado: ${data.revenue_total > 0 ? `$${data.revenue_total.toLocaleString()}` : '$0 — primer ingreso pendiente'}

${crearCtx}

${blockersCtx}

${lastActionsCtx}

Genera la acción de revenue para hoy.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Anthropic API error ${response.status}: ${err}`)
    }

    const aiData = await response.json()
    const suggestion = aiData.content?.[0]?.text
    if (!suggestion) throw new Error('Respuesta vacía de la IA')

    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error en suggest-daily-action:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
