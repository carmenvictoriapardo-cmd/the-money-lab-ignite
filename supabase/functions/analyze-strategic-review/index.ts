import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReviewData {
  type: 'win' | 'challenge' | 'ask'
  context: string
  evidence?: string
  participant_name: string
  week_number: number
  day_of_program: number
  // Context to enrich the analysis
  clarity_score?: number
  crear_total?: number
  revenue_total?: number
  active_blockers?: number
  standup_win?: string
  standup_revenue_action?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const data: ReviewData = await req.json()

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY no configurada')

    const typeLabel =
      data.type === 'win' ? '🏆 WIN' :
      data.type === 'challenge' ? '⚡ DESAFÍO' : '🎯 PREGUNTA'

    const contextLine = `[${typeLabel}] "${data.context}"`
    const evidenceLine = data.evidence ? `Evidencia del participante: "${data.evidence}"` : 'Sin evidencia adicional.'

    const programCtx = `Semana ${data.week_number} de 13 | Día ${data.day_of_program} de 90 del programa`

    const metricsCtx = [
      data.clarity_score !== undefined ? `• Clarity Score: ${data.clarity_score}/100` : null,
      data.crear_total !== undefined ? `• C.R.E.A.R. total: ${data.crear_total}%` : null,
      data.revenue_total !== undefined ? `• Revenue acumulado: $${data.revenue_total.toLocaleString()}` : null,
      data.active_blockers !== undefined ? `• Bloqueos activos: ${data.active_blockers}` : null,
    ].filter(Boolean).join('\n')

    const standupCtx = (data.standup_win || data.standup_revenue_action)
      ? `STANDUP ESTA SEMANA:\n${data.standup_win ? `• Win declarado: "${data.standup_win}"` : ''}\n${data.standup_revenue_action ? `• Acción de revenue: "${data.standup_revenue_action}"` : ''}`.trim()
      : ''

    // ── System Prompt ──────────────────────────────────────────────────────
    const systemPrompt = `Eres el Sistema de Pre-Análisis de THE MONEY LAB™ IGNITE.

Tu función: antes de que Carmen (la mentora/coach del programa) responda un Strategic Review de una participante, tú analizas el contexto y le das a Carmen un diagnóstico rápido + las mejores opciones de respuesta.

Carmen es directa, estratégica y no da validación vacía. Sus respuestas siempre empujan hacia acción concreta y más revenue.

FORMATO EXACTO (en español, sin variaciones):

**🔍 DIAGNÓSTICO RÁPIDO**
[1-2 líneas. ¿Qué está pasando realmente debajo de lo que escribe? Conecta con sus métricas si hay datos disponibles. Sé específica y directa — no suavices.]

**📊 LO QUE LOS DATOS DICEN**
[1-2 líneas. Contrasta lo que dice en el review con sus métricas (revenue, C.R.E.A.R., bloqueos). ¿Hay contradicciones? ¿Patrones? Si no hay datos suficientes, omite esta sección.]

**💬 3 ÁNGULOS DE RESPUESTA PARA CARMEN**
1. **[Nombre del ángulo]**: [1 oración — cómo Carmen podría enfocar su respuesta desde esta perspectiva]
2. **[Nombre del ángulo]**: [1 oración — otro enfoque posible]
3. **[Nombre del ángulo]**: [1 oración — un tercer ángulo, más retador si aplica]

**❓ PREGUNTA CLAVE A HACERLE**
[La pregunta más poderosa que Carmen podría hacerle a esta participante en su respuesta. Una sola. Que abra posibilidades o exponga el punto ciego.]

REGLAS:
- Máximo 250 palabras total
- Habla de la participante en tercera persona (ella)
- No hagas la respuesta por Carmen — dale herramientas para que ella construya la suya
- Si el review es un WIN: valida brevemente pero enfoca en cómo escalar ese logro
- Si es DESAFÍO: identifica si es mindset, estrategia o ejecución
- Si es PREGUNTA: evalúa qué hay detrás de la pregunta antes de responderla`

    const userMessage = `PARTICIPANTE: ${data.participant_name}
${programCtx}

REVIEW RECIBIDO:
${contextLine}
${evidenceLine}

MÉTRICAS DEL PARTICIPANTE:
${metricsCtx || 'Sin datos disponibles.'}
${standupCtx ? '\n' + standupCtx : ''}

Genera el pre-análisis para Carmen.`

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
        max_tokens: 700,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Anthropic API error ${response.status}: ${err}`)
    }

    const aiData = await response.json()
    const analysis = aiData.content?.[0]?.text
    if (!analysis) throw new Error('Respuesta vacía de la IA')

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error en analyze-strategic-review:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
