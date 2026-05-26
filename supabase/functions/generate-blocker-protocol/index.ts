import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BlockerRequest {
  blocker_type: string
  description: string
  day_of_program: number
  crear_scores?: {
    claridad: number
    revenue: number
    ejecucion: number
    autoridad: number
    relaciones: number
  }
  revenue_total: number
  blockers_count: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: BlockerRequest = await req.json()
    const {
      blocker_type,
      description,
      day_of_program,
      crear_scores,
      revenue_total,
      blockers_count,
    } = body

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY no configurada en secrets de Supabase')
    }

    const BLOCKER_CONTEXT: Record<string, string> = {
      mindset:    'creencias limitantes, miedos, bloqueos mentales, síndrome del impostor',
      estrategia: 'posicionamiento, oferta, mensaje, canal de adquisición, modelo de negocio',
      ejecucion:  'tareas incompletas, procrastinación, falta de sistema, parálisis por análisis',
      recursos:   'dinero, tiempo, conocimiento, equipo, herramientas, red de contactos',
      tiempo:     'agenda sobrecargada, priorización, gestión del tiempo, urgencias vs importante',
      precio:     'inseguridad en precio, objeciones de costo, valor percibido, certeza de cobrar',
      ventas:     'conversaciones de venta, cierres, seguimiento, prospectos, objeciones',
    }

    const systemPrompt = `Eres el AI Coach de THE MONEY LAB™ IGNITE — el programa de 90 días que transforma emprendedores en ejecutores de alto rendimiento.

Tu rol: Analizar bloqueos específicos y generar Protocolos de Acción Personalizados con diagnóstico profundo y pasos concretos.

FILOSOFÍA DE COACHING:
- El problema que describen no siempre es el problema real → busca el patrón debajo
- La acción vence a la planificación → siempre termina con algo que pueden hacer HOY
- Los números no mienten → usa datos del programa cuando estén disponibles
- La velocidad de implementación es el único KPI que importa en los primeros 90 días

FORMATO DE RESPUESTA (en español, siempre igual):

🔍 **DIAGNÓSTICO REAL**
[2-3 líneas. No repitas lo que dijeron. Identifica el patrón subyacente, lo que está pasando debajo de la superficie. Sé directo.]

⚡ **PROTOCOLO DE ACCIÓN**
1. [Acción específica y concreta — nada genérico]
2. [Segunda acción — con detalle de cómo hacerla]
3. [Tercera acción — orientada a resultado medible]

🔥 **TU SIGUIENTE ACCIÓN (Próximas 24h)**
[Una sola acción. Específica. Con tiempo estimado. Sin excusas.]

❓ **PREGUNTA QUE CAMBIA EL JUEGO**
[Una pregunta que los hará ver el bloqueo desde un ángulo completamente diferente.]

REGLAS:
- Máximo 280 palabras total
- Sin introducciones ni saludos
- Sin frases motivacionales vacías ("¡Tú puedes!", "¡Ánimo!")
- Usa los datos del programa para personalizar (día, C.R.E.A.R., revenue)
- Si el bloqueo es de mindset, ve directo a la creencia limitante — no al síntoma`

    const crearContext = crear_scores
      ? `C.R.E.A.R. más reciente:
  • Claridad: ${crear_scores.claridad}/10 ${crear_scores.claridad < 5 ? '⚠️ bajo' : ''}
  • Revenue (acciones): ${crear_scores.revenue}/10 ${crear_scores.revenue < 5 ? '⚠️ bajo' : ''}
  • Ejecución: ${crear_scores.ejecucion}/10 ${crear_scores.ejecucion < 5 ? '⚠️ bajo' : ''}
  • Autoridad: ${crear_scores.autoridad}/10
  • Relaciones: ${crear_scores.relaciones}/10`
      : 'Sin datos de C.R.E.A.R. aún (primeros días del programa)'

    const userMessage = `DATOS DEL PARTICIPANTE:
• Día del programa: ${day_of_program} de 90
• Tipo de bloqueo: ${blocker_type.toUpperCase()} (${BLOCKER_CONTEXT[blocker_type] || ''})
• Número de bloqueos reportados: ${blockers_count} (incluyendo este)
• Revenue generado en el programa: ${revenue_total > 0 ? `$${revenue_total.toLocaleString()}` : '$0 — primer revenue aún pendiente'}

${crearContext}

DESCRIPCIÓN DEL BLOQUEO (en sus propias palabras):
"${description}"

Genera el Protocolo de Acción Personalizado.`

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
      const errText = await response.text()
      throw new Error(`Anthropic API error ${response.status}: ${errText}`)
    }

    const aiData = await response.json()
    const protocol = aiData.content?.[0]?.text

    if (!protocol) throw new Error('Respuesta vacía de la IA')

    return new Response(
      JSON.stringify({ protocol }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error en generate-blocker-protocol:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
