const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

Deno.serve(async (req) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  if (req.method === 'OPTIONS') return new Response(null, { headers: { ...headers, 'Access-Control-Allow-Headers': 'authorization, content-type' } })

  try {
    const { field_key, field_label, field_question, current_answer, step_name, business_context } = await req.json()

    const contextLines = business_context
      ? Object.entries(business_context as Record<string, string>)
          .filter(([_, v]) => v && String(v).trim().length > 0)
          .map(([k, v]) => `• ${k}: ${v}`)
          .join('\n')
      : ''

    const prompt = `Eres un experto en el framework StoryBrand de Donald Miller y coach de negocios para emprendedores hispanohablantes que están comenzando o relanzando su negocio.

Un emprendedor está completando su BrandScript y necesita ayuda específica con este campo:

═══ CAMPO A COMPLETAR ═══
Elemento StoryBrand: ${step_name}
Campo: ${field_label}
Pregunta: ${field_question}
${current_answer ? `\nLo que escribió (incompleto o necesita mejorar):\n"${current_answer}"` : '\n(Aún no ha escrito nada — está paralizado)'}

${contextLines ? `═══ CONTEXTO DE SU NEGOCIO (campos previos completados) ═══\n${contextLines}` : ''}

═══ LO QUE DEBES GENERAR ═══

Genera exactamente este JSON (sin markdown, solo el objeto):

{
  "examples": [
    "Ejemplo 1 concreto y específico para su tipo de negocio",
    "Ejemplo 2 con enfoque diferente",
    "Ejemplo 3 más directo o emocional"
  ],
  "why_it_matters": "1-2 oraciones: por qué este elemento específico es crítico. Directo, sin rodeos.",
  "improved": ${current_answer ? '"Versión mejorada y más poderosa de lo que escribió, conservando su esencia"' : 'null'},
  "tip": "El error más común que cometen los emprendedores en este campo y cómo evitarlo."
}

Reglas críticas:
- Todo en español latinoamericano natural y conversacional
- Los ejemplos: máximo 20 palabras cada uno, CONCRETOS, no genéricos
- Si tiene contexto previo, personaliza los ejemplos a SU negocio específico
- Si no tiene contexto, usa ejemplos de negocios de servicios/coaching comunes en Latinoamérica
- Sin clichés empresariales ni frases vacías
- El "why_it_matters" debe sonar como un coach, no un manual
- Solo el JSON puro, sin texto adicional`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 700,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const result = await response.json()
    const text = result.content?.[0]?.text || ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in response')

    const output = JSON.parse(match[0])
    return new Response(JSON.stringify(output), { headers })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers })
  }
})
