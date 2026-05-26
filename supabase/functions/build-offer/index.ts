import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OfferInput {
  participant_name: string
  ideal_client: string
  result_promised: string
  timeframe: string
  differentiator: string
  price_range: string
  day_of_program?: number
  clarity_score?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const data: OfferInput = await req.json()

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY no configurada')

    const systemPrompt = `Eres el Arquitecto de Ofertas de THE MONEY LAB™ IGNITE.

Tu trabajo: tomar las respuestas crudas de un emprendedor sobre su oferta y sintetizarlas en una oferta irresistible, clara y lista para usar.

PRINCIPIOS:
- Una oferta irresistible nombra al cliente, el resultado, el tiempo y la credibilidad en pocas palabras
- La especificidad vende. "Más clientes" es débil. "3 clientes nuevos en 60 días" es irresistible
- El precio correcto se justifica con el ROI del resultado, no con el tiempo invertido
- La primera línea de una conversación de ventas abre curiosidad, no explica todo

RESPONDE SOLO EN ESTE FORMATO JSON (sin markdown, sin explicación extra):

{
  "one_liner": "string — La oferta en 1 frase poderosa y específica. Estructura: 'Ayudo a [QUIÉN] a [RESULTADO CONCRETO] en [TIEMPO] [DIFERENCIADOR CORTO]'",
  "elevator_pitch": "string — 2-3 oraciones naturales para responder '¿A qué te dedicas?' en una conversación. Sin jerga de marketing.",
  "pain_point": "string — El dolor central que resuelves, formulado desde la perspectiva del cliente. 1-2 oraciones. Empieza por el dolor, no por la solución.",
  "price_validation": "string — Evaluación directa del precio: ¿está bien calibrado al valor prometido? ¿Cómo justificarlo en 1-2 oraciones ante un cliente?",
  "opening_line": "string — La primera línea exacta para empezar una conversación de ventas (DM, llamada, o presencial). Abre curiosidad, no explica. Máximo 2 oraciones."
}`

    const userMessage = `EMPRENDEDOR/A: ${data.participant_name}
${data.day_of_program ? `Día ${data.day_of_program} del programa` : ''}

RESPUESTAS DEL WIZARD:

1. CLIENTE IDEAL:
"${data.ideal_client}"

2. RESULTADO PROMETIDO:
"${data.result_promised}"

3. TIEMPO / PLAZO:
"${data.timeframe}"

4. DIFERENCIADOR / POR QUÉ YO:
"${data.differentiator}"

5. PRECIO Y JUSTIFICACIÓN:
"${data.price_range}"

Construye la oferta irresistible de este emprendedor.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Anthropic API error ${response.status}: ${err}`)
    }

    const aiData = await response.json()
    const raw = aiData.content?.[0]?.text
    if (!raw) throw new Error('Respuesta vacía de la IA')

    // Parse JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No se pudo parsear la respuesta JSON')
    const offer = JSON.parse(jsonMatch[0])

    return new Response(
      JSON.stringify(offer),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error en build-offer:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
