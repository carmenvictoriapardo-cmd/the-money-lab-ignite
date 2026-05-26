import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Message { role: 'user' | 'assistant'; content: string }

interface RoleplayRequest {
  mode: 'chat' | 'debrief'
  scenario_id: string
  scenario_label: string
  messages: Message[]
  offer_context?: {
    ideal_client?: string
    result_promised?: string
    timeframe?: string
    one_liner?: string
  }
  participant_name: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const data: RoleplayRequest = await req.json()
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY no configurada')

    const offerCtx = data.offer_context
    const offerSummary = offerCtx?.one_liner
      ?? (offerCtx?.ideal_client
          ? `Ayuda a ${offerCtx.ideal_client} a ${offerCtx.result_promised ?? 'lograr resultados'} en ${offerCtx.timeframe ?? 'tiempo definido'}`
          : 'Un servicio de coaching/consultoría')

    // ── CHAT mode — AI plays the prospect ───────────────────────────
    if (data.mode === 'chat') {
      const systemPrompt = `Eres un prospecto real en una conversación de ventas.

ESCENARIO: ${data.scenario_label}
LO QUE EL VENDEDOR OFRECE: ${offerSummary}

TU PERFIL COMO PROSPECTO:
- Eres alguien que podría ser su cliente ideal pero eres escéptico/a y ocupado/a
- Tienes el problema que este vendedor resuelve, pero no estás convencido/a de que funcione
- No tolerás respuestas largas, vagas o de manual de ventas
- Reaccionás auténticamente: si la respuesta es específica y resuena → te interesás más; si es vaga → te alejás

OBJECIONES QUE USÁS (cuando aplique):
- "¿Cuánto cuesta?" / "Es mucho dinero para mí ahora"
- "¿Y si no funciona?" / "¿Tenés casos de éxito?"
- "Déjame pensarlo" / "Ahora no es el momento"
- "¿Cuánto tiempo toma?" / "Estoy muy ocupado/a"
- "Ya probé cosas así y no me funcionó"

REGLAS CRÍTICAS:
- Máximo 2-3 oraciones por mensaje — sos un humano real, no un chatbot
- Usá lenguaje casual y natural (LATAM)
- NO des discursos. Reaccioná, no expliques.
- Sé genuino/a: no sos imposible de convencer, pero tampoco fácil
- Si el vendedor hace una pregunta específica, respondela antes de contraatacar`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 200,
          system: systemPrompt,
          messages: data.messages,
        }),
      })

      if (!response.ok) throw new Error(`Anthropic error ${response.status}: ${await response.text()}`)
      const aiData = await response.json()
      const reply = aiData.content?.[0]?.text
      if (!reply) throw new Error('Respuesta vacía')

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── DEBRIEF mode — AI drops character and coaches ───────────────
    if (data.mode === 'debrief') {
      const conversation = data.messages
        .map(m => `${m.role === 'user' ? data.participant_name : 'PROSPECTO'}: ${m.content}`)
        .join('\n\n')

      const systemPrompt = `Eres un coach de ventas experto analizando una práctica de conversación de ventas.

Tu trabajo: dar feedback específico, directo y accionable sobre el desempeño del vendedor.

La oferta practicada: ${offerSummary}
Escenario: ${data.scenario_label}

FORMATO EXACTO (en español):

✅ **LO QUE FUNCIONÓ**
• [Observación específica con cita o momento de la conversación]
• [Segunda observación si aplica]

⚠️ **EL MOMENTO CRÍTICO**
[El momento exacto donde perdieron tracción o cometieron el error más importante. Cita la línea exacta.]

💡 **LO QUE PODRÍAS HABER DICHO**
[La respuesta alternativa exacta — escríbela como si fuera el vendedor hablando. Lista para usar.]

🎯 **SCORE: X/10**
[1 oración explicando el puntaje.]

⚡ **PRACTICA ESTO MAÑANA**
[Una sola cosa concreta a mejorar en la próxima sesión.]

REGLAS:
- Máximo 250 palabras
- Sé directo/a — no des validación vacía
- Si la conversación fue muy corta o el vendedor no respondió bien, dilo claramente
- El score debe ser honesto: una conversación mediocre es 4-5, no 7`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 600,
          system: systemPrompt,
          messages: [{ role: 'user', content: `CONVERSACIÓN COMPLETA:\n\n${conversation}\n\nGenera el debrief de coaching.` }],
        }),
      })

      if (!response.ok) throw new Error(`Anthropic error ${response.status}: ${await response.text()}`)
      const aiData = await response.json()
      const debrief = aiData.content?.[0]?.text
      if (!debrief) throw new Error('Respuesta vacía')

      // Extract score
      const scoreMatch = debrief.match(/SCORE[:\s]+(\d+)\/10/i)
      const score = scoreMatch ? parseInt(scoreMatch[1]) : null

      return new Response(JSON.stringify({ debrief, score }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Modo no válido')

  } catch (err) {
    console.error('Error en sales-roleplay:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
