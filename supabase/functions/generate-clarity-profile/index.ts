import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user_id, responses, full_name } = await req.json()

    if (!user_id || !responses) {
      return new Response(JSON.stringify({ error: 'Missing user_id or responses' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── BUILD PROMPT ─────────────────────────────────────────
    const r = responses

    const promptText = `Eres la analista estratégica del programa THE MONEY LAB™ IGNITE, creado por Carmen Victoria Pardo. Tu rol es generar el STRATEGIC FOUNDER PROFILE™ de una fundadora que está a punto de comenzar el programa de 90 días.

Basándote en las respuestas del formulario CLARITY SPRINT™, crea un perfil estratégico profesional y poderoso que:
1. Identifique con claridad su nivel actual
2. Reconozca sus fortalezas reales
3. Señale sus mayores oportunidades de crecimiento
4. La motive a arrancar el programa con claridad

RESPUESTAS DEL FORMULARIO:

--- SECCIÓN 1: SU NEGOCIO ---
Nombre del negocio: ${r.business_name || 'N/A'}
Cliente ideal: ${r.ideal_client || 'N/A'}
Problema que resuelve: ${r.problem_solved || 'N/A'}
Diferenciador único: ${r.differentiator || 'N/A'}

--- SECCIÓN 2: SITUACIÓN ACTUAL ---
Tiempo en el negocio: ${r.time_in_business || 'N/A'}
Ingreso mensual actual: ${r.monthly_revenue || 'N/A'}
Horas semanales: ${r.weekly_hours || 'N/A'}
Mayor obstáculo: ${r.biggest_obstacle || 'N/A'}

--- SECCIÓN 3: IDENTIDAD ---
Confianza (1-10): ${r.confidence_score || 'N/A'}
Mayor miedo: ${r.biggest_fear || 'N/A'}
Mayor logro: ${r.biggest_win || 'N/A'}
Cómo se ve a sí misma: ${r.self_perception || 'N/A'}

--- SECCIÓN 4: CLARIDAD DE OFERTA ---
Qué vende exactamente: ${r.offer_description || 'N/A'}
Cómo consigue clientes: ${r.client_acquisition || 'N/A'}
Clientes activos: ${r.active_clients || 'N/A'}
Tiene oferta clara: ${r.offer_clarity || 'N/A'}

--- SECCIÓN 5: VISIÓN Y METAS ---
Meta 90 días: ${r.goal_90_days || 'N/A'}
Ingreso meta al finalizar: ${r.income_goal || 'N/A'}
Qué significa el éxito: ${r.success_definition || 'N/A'}
Qué le falta para arrancar: ${r.what_is_missing || 'N/A'}

---

GENERA el perfil en formato JSON con EXACTAMENTE esta estructura:
{
  "headline": "Una oración poderosa que captura quién es esta fundadora (máx 20 palabras)",
  "stage": "Uno de: Exploradora | Arrancando | En Movimiento | Escalando",
  "stage_description": "Por qué está en ese stage (2-3 oraciones)",
  "strengths": ["Fortaleza 1", "Fortaleza 2", "Fortaleza 3"],
  "opportunities": ["Oportunidad 1", "Oportunidad 2", "Oportunidad 3"],
  "clarity_gaps": ["Brecha 1 que el programa resolverá", "Brecha 2", "Brecha 3"],
  "ignite_message": "Mensaje motivador personalizado de Carmen para ella (3-4 oraciones potentes)",
  "first_focus": "En qué debe enfocarse PRIMERO en el programa (1-2 oraciones)",
  "score_breakdown": {
    "negocio": <0-20 basado en claridad del concepto de negocio>,
    "situacion": <0-20 basado en solidez de la situación actual>,
    "identidad": <0-20 basado en mentalidad e identidad como fundadora>,
    "oferta": <0-20 basado en claridad de la oferta>,
    "vision": <0-20 basado en claridad de metas y visión>
  },
  "total_score": <suma de los 5 valores anterior, 0-100>
}

IMPORTANTE: Responde SOLO con el JSON válido, sin texto adicional, sin markdown.`

    // ── CALL CLAUDE ──────────────────────────────────────────
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1200,
        messages: [{ role: 'user', content: promptText }],
      }),
    })

    const aiData = await anthropicRes.json()
    const raw = aiData.content?.[0]?.text?.trim() ?? ''

    let profileData: Record<string, unknown>
    try {
      profileData = JSON.parse(raw)
    } catch {
      // Fallback if JSON parsing fails
      profileData = {
        headline: `Fundadora con potencial real y visión clara`,
        stage: 'Arrancando',
        stage_description: 'Estás en el momento perfecto para estructurar y escalar tu negocio con método.',
        strengths: ['Determinación para buscar apoyo', 'Claridad inicial del negocio', 'Disposición al cambio'],
        opportunities: ['Estructurar oferta irresistible', 'Construir sistema de ventas', 'Definir cliente ideal con precisión'],
        clarity_gaps: ['Claridad de oferta', 'Sistema de adquisición de clientes', 'Mentalidad de crecimiento'],
        ignite_message: 'Tu decisión de estar aquí ya dice mucho de ti. El programa va a darte las herramientas que necesitas para convertir tu visión en resultados concretos.',
        first_focus: 'Trabajar en la claridad de tu oferta y definir con precisión a quién sirves.',
        score_breakdown: { negocio: 12, situacion: 10, identidad: 12, oferta: 8, vision: 12 },
        total_score: 54,
      }
    }

    const totalScore = (profileData.total_score as number) ||
      Object.values(profileData.score_breakdown as Record<string, number>).reduce((a, b) => a + b, 0)

    // ── SAVE TO DB ───────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Upsert: if user already has a draft, update it
    const { data: existing } = await supabase
      .from('clarity_responses')
      .select('id')
      .eq('user_id', user_id)
      .eq('status', 'draft')
      .limit(1)
      .single()

    const payload = {
      user_id,
      responses,
      clarity_score: totalScore,
      score_breakdown: profileData.score_breakdown,
      strategic_profile: JSON.stringify(profileData),
      profile_generated_at: new Date().toISOString(),
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    }

    let dbError
    if (existing?.id) {
      const { error } = await supabase.from('clarity_responses').update(payload).eq('id', existing.id)
      dbError = error
    } else {
      const { error } = await supabase.from('clarity_responses').insert(payload)
      dbError = error
    }

    if (dbError) {
      console.error('DB error:', dbError)
      return new Response(JSON.stringify({ error: dbError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ profile: profileData, total_score: totalScore }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
