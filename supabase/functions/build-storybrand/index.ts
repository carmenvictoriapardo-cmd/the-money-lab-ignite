const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

Deno.serve(async (req) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  if (req.method === 'OPTIONS') return new Response(null, { headers: { ...headers, 'Access-Control-Allow-Headers': 'authorization, content-type' } })

  try {
    const data = await req.json()

    const prompt = `Eres un experto en el framework StoryBrand de Donald Miller y copywriting para negocios en español latinoamericano.

Con base en el BrandScript de este emprendedor, genera su identidad de marca completa:

═══ BRANDSCRIPT COMPLETO ═══

PASO 1 — EL PERSONAJE (HÉROE):
• Cliente ideal: ${data.hero_who}
• Lo que más desea: ${data.hero_wants}

PASO 2 — EL PROBLEMA:
• El Villano: ${data.villain}
• Problema externo (visible): ${data.problem_external}
• Problema interno (emocional): ${data.problem_internal}
• Problema filosófico (injusticia): ${data.problem_philosophical}

PASO 3 — EL GUÍA:
• Empatía: ${data.empathy}
• Autoridad: ${data.authority}

PASO 4 — EL PLAN:
• Paso 1: ${data.plan_step1}
• Paso 2: ${data.plan_step2}
• Paso 3: ${data.plan_step3}

PASO 5 — LLAMADO A LA ACCIÓN:
• CTA directo: ${data.direct_cta}
• CTA de transición: ${data.transitional_cta}

PASO 6 — EL FRACASO (stakes):
• ${data.failure_stakes}

PASO 7 — EL ÉXITO:
• Éxito externo: ${data.success_external}
• Éxito interno: ${data.success_internal}
• Nueva identidad: ${data.success_identity}

═══ LO QUE DEBES GENERAR ═══

Genera exactamente este JSON (sin markdown, solo el objeto):

{
  "taglines": [
    {
      "nombre": "La Transformación",
      "texto": "[tagline opción 1 — basado en la transformación de identidad 'de X a Y']",
      "por_que": "Explicación breve de por qué este tagline funciona"
    },
    {
      "nombre": "El Resultado",
      "texto": "[tagline opción 2 — enfocado en el resultado externo más deseado]",
      "por_que": "Explicación breve"
    },
    {
      "nombre": "El Villano Derrotado",
      "texto": "[tagline opción 3 — posiciona al villano y la solución]",
      "por_que": "Explicación breve"
    }
  ],
  "one_liner": "Ayudo a [cliente ideal] a [resultado deseado] para que puedan [transformación de identidad].",
  "brand_statement": "Párrafo narrativo de 3-4 oraciones que cuenta la historia completa de la marca usando los 7 elementos. Poderoso, emocional, memorable.",
  "instagram_bio": "Bio de Instagram de máximo 150 caracteres. Directa, clara, con el one-liner condensado y el CTA.",
  "web_headline": "Titular para la parte superior de la web (above the fold). Máximo 8 palabras. Apela al deseo o al problema.",
  "web_subheadline": "Subtítulo de web de 1-2 oraciones que amplía el titular y refuerza la promesa.",
  "pitch_30_seg": "Pitch verbal de 30 segundos (4-5 oraciones). Natural, conversacional, usa los 7 elementos en orden: quién es el cliente, su problema, por qué tú eres el guía, el plan simple, y la transformación."
}

Reglas:
- Todo en español latinoamericano natural
- Los taglines deben ser memorables, entre 4-10 palabras
- El one_liner debe seguir EXACTAMENTE la fórmula de StoryBrand
- Sin clichés, sin promesas vacías
- Específico al negocio descrito, no genérico
- El brand_statement debe sentirse como una historia, no un CV`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1200,
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
