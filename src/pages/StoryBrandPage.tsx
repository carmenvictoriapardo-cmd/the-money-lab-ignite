import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Sparkles, Copy, Check, ChevronRight, ChevronLeft, RefreshCw, BookOpen } from 'lucide-react'

const GOLD = '#C9A84C'
const BG   = '#0A0A0A'

// ─── StoryBrand Steps ──────────────────────────────────────────────────────

const STEPS = [
  {
    key: 'hero',
    step: 1,
    emoji: '🦸',
    title: 'El Personaje — Tu Cliente Ideal',
    subtitle: 'En StoryBrand el héroe de la historia es TU CLIENTE, no tú. Cuanto más específico lo definas, más poderoso será tu mensaje.',
    color: GOLD,
    fields: [
      {
        key: 'hero_who',
        label: '¿Quién es exactamente tu cliente ideal?',
        placeholder: 'Ej: Mujeres emprendedoras de 30-45 años con un negocio de servicios que ya genera ingresos pero de forma inconsistente...',
        hint: 'Sé específico — edad, situación, momento de vida. Entre más preciso, más conecta el mensaje.',
        rows: 3,
      },
      {
        key: 'hero_wants',
        label: '¿Qué desea lograr más que nada?',
        placeholder: 'Ej: Tener ingresos consistentes de $5,000+ al mes sin depender de referidos ni trabajar 12 horas diarias',
        hint: 'Esto es lo que mantiene a tu cliente soñando por las noches. Un deseo concreto, no un valor abstracto.',
        rows: 2,
      },
    ],
  },
  {
    key: 'problem',
    step: 2,
    emoji: '⚡',
    title: 'El Problema — El Villano y sus 3 Dimensiones',
    subtitle: 'Todo héroe enfrenta un villano. El problema tiene 3 niveles: externo (lo que se ve), interno (cómo se siente) y filosófico (por qué es injusto).',
    color: '#EF4444',
    fields: [
      {
        key: 'villain',
        label: '¿Cuál es el "villano" que impide el éxito de tu cliente?',
        placeholder: 'Ej: La falta de un sistema de ventas claro, el mercado saturado de coaches genéricos, las estrategias de marketing que no funcionan para servicios...',
        hint: 'El villano es el obstáculo: una situación, sistema o creencia. Nunca una persona.',
        rows: 2,
      },
      {
        key: 'problem_external',
        label: 'Problema EXTERNO — El problema práctico, visible',
        placeholder: 'Ej: No consigue clientes de forma consistente mes a mes',
        hint: '¿Qué problema concreto y tangible tiene tu cliente? Lo que diría si le preguntas qué le pasa.',
        rows: 2,
      },
      {
        key: 'problem_internal',
        label: 'Problema INTERNO — Cómo se siente por dentro',
        placeholder: 'Ej: Se siente frustrada, insegura de su valor, con miedo de no poder pagar sus facturas el próximo mes',
        hint: 'Este es el más poderoso. Las personas compran soluciones a cómo se SIENTEN, no a lo que les pasa.',
        rows: 2,
      },
      {
        key: 'problem_philosophical',
        label: 'Problema FILOSÓFICO — Por qué es injusto',
        placeholder: 'Ej: Una emprendedora con tanto talento no debería tener que mendigar clientes ni dudar de su valor',
        hint: '¿Por qué es moralmente injusto que tu cliente viva con este problema? Esta es la causa que defiendes.',
        rows: 2,
      },
    ],
  },
  {
    key: 'guide',
    step: 3,
    emoji: '🧭',
    title: 'El Guía — Tú',
    subtitle: 'No eres el héroe de la historia, eres el Yoda. El guía perfecto demuestra EMPATÍA (entiendo tu dolor) y AUTORIDAD (tengo la solución).',
    color: '#8B5CF6',
    fields: [
      {
        key: 'empathy',
        label: 'Tu declaración de EMPATÍA',
        placeholder: 'Ej: Yo también pasé años trabajando más de lo que ganaba, sintiéndome atrapada en un negocio que no crecía sin importar cuánto me esforzara...',
        hint: '¿Cómo demuestras que entiendes su dolor desde adentro? Comparte algo real de tu historia.',
        rows: 3,
      },
      {
        key: 'authority',
        label: 'Tu declaración de AUTORIDAD',
        placeholder: 'Ej: He acompañado a más de 50 emprendedoras a generar sus primeros $10K al mes con un sistema que no depende del azar...',
        hint: 'Resultados, números, testimonios, método probado. Hechos concretos que generan confianza sin arrogancia.',
        rows: 3,
      },
    ],
  },
  {
    key: 'plan',
    step: 4,
    emoji: '🗺️',
    title: 'El Plan — 3 Pasos Simples',
    subtitle: 'Los clientes no actúan sin un camino claro. Dales 3 pasos simples. El plan elimina la fricción y hace que actuar se sienta seguro.',
    color: '#10B981',
    fields: [
      {
        key: 'plan_step1',
        label: 'Paso 1 — Debe ser casi sin fricción',
        placeholder: 'Ej: Agenda tu sesión de diagnóstico gratuita de 30 minutos',
        hint: 'El primer paso debe ser fácil y sin riesgo. Baja la barrera de entrada.',
        rows: 2,
      },
      {
        key: 'plan_step2',
        label: 'Paso 2 — El proceso de transformación',
        placeholder: 'Ej: Diseñamos juntas tu sistema de ventas personalizado en 90 días',
        hint: 'El trabajo que hacen contigo. La experiencia del programa o servicio.',
        rows: 2,
      },
      {
        key: 'plan_step3',
        label: 'Paso 3 — El resultado prometido',
        placeholder: 'Ej: Empiezas a atraer clientes de forma consistente y escalas tu revenue',
        hint: 'La promesa cumplida. Lo que tienen al final. Conecta con lo que quiere el héroe.',
        rows: 2,
      },
    ],
  },
  {
    key: 'cta',
    step: 5,
    emoji: '🎯',
    title: 'El Llamado a la Acción',
    subtitle: 'Necesitas dos CTA: uno directo para quien ya está listo, y uno de transición para quien todavía duda. Sin CTA claro, el cliente no actúa.',
    color: '#F59E0B',
    fields: [
      {
        key: 'direct_cta',
        label: 'CTA DIRECTO — Tu botón de acción principal',
        placeholder: 'Ej: "Aplica al programa", "Agenda tu sesión estratégica", "Únete a IGNITE"',
        hint: 'Claro, específico, sin rodeos. ¿Qué acción concreta quieres que tomen?',
        rows: 2,
      },
      {
        key: 'transitional_cta',
        label: 'CTA DE TRANSICIÓN — Para quienes aún no están listos',
        placeholder: 'Ej: "Descarga mi guía gratuita de 5 pasos para escalar", "Ve el masterclass gratuito"',
        hint: 'Algo de valor gratuito que los acerca a ti sin compromiso. Construye confianza primero.',
        rows: 2,
      },
    ],
  },
  {
    key: 'failure',
    step: 6,
    emoji: '⚠️',
    title: 'Lo que Está en Juego — El Fracaso',
    subtitle: 'Las personas se mueven más por evitar el dolor que por buscar el placer. Sin stakes, no hay urgencia. Define lo que pierden si no actúan.',
    color: '#EF4444',
    fields: [
      {
        key: 'failure_stakes',
        label: '¿Qué pierde, sacrifica o sufre tu cliente si NO trabaja contigo?',
        placeholder: 'Ej: Seguirá atrapada en el ciclo de trabajar más por menos dinero, viendo pasar sus mejores años sin el negocio que soñó, sintiéndose una impostora, comparándose con otros que sí lograron escalar...',
        hint: 'No exageres, pero sé honesta y específica. Esto crea urgencia real y hace que el cliente se vea en el espejo.',
        rows: 4,
      },
    ],
  },
  {
    key: 'success',
    step: 7,
    emoji: '🏆',
    title: 'La Transformación — El Éxito',
    subtitle: 'Pinta la visión completa de cómo es la vida de tu cliente después. Esta es tu promesa más poderosa. De aquí nacen los taglines más memorables.',
    color: '#4ADE80',
    fields: [
      {
        key: 'success_external',
        label: 'Éxito EXTERNO — ¿Qué tiene o logra en concreto?',
        placeholder: 'Ej: Genera $8K+ al mes, trabaja 4 días a la semana, tiene una lista de espera de clientes que pagan lo que vale',
        hint: 'Resultados tangibles y medibles. Números reales cuando sea posible.',
        rows: 2,
      },
      {
        key: 'success_internal',
        label: 'Éxito INTERNO — ¿Cómo se siente?',
        placeholder: 'Ej: Se siente segura, en control de su negocio, orgullosa de lo que construyó y de quién se convirtió',
        hint: 'La transformación emocional. Esta es la más importante — la razón real por la que compran.',
        rows: 2,
      },
      {
        key: 'success_identity',
        label: 'Nueva IDENTIDAD — ¿En quién se convierte?',
        placeholder: 'Ej: De emprendedora agotada que sobrevive mes a mes → a CEO que dirige un negocio que trabaja para ella',
        hint: 'El tagline más poderoso vive aquí. La transformación "de X → a Y". Esta frase define tu marca.',
        rows: 2,
      },
    ],
  },
]

// ─── Types ─────────────────────────────────────────────────────────────────

type Answers = Record<string, string>

interface AIOutput {
  taglines: { nombre: string; texto: string; por_que: string }[]
  one_liner: string
  brand_statement: string
  instagram_bio: string
  web_headline: string
  web_subheadline: string
  pitch_30_seg: string
}

// ─── Copy button ───────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all flex-shrink-0"
      style={{ background: copied ? '#4ADE8022' : '#2A2A2A', color: copied ? '#4ADE80' : '#9CA3AF' }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function StoryBrandPage() {
  const { profile } = useAuth()
  const [step, setStep]           = useState(0)           // 0–6 = wizard, 7 = result
  const [answers, setAnswers]     = useState<Answers>({})
  const [loading, setLoading]     = useState(true)
  const [building, setBuilding]   = useState(false)
  const [aiOutput, setAiOutput]   = useState<AIOutput | null>(null)
  const [saved, setSaved]         = useState(false)
  const [selectedTag, setSelectedTag] = useState(0)

  useEffect(() => { if (profile?.id) fetchExisting() }, [profile?.id])

  async function fetchExisting() {
    const { data } = await supabase
      .from('storybrand_scripts')
      .select('*')
      .eq('user_id', profile!.id)
      .single()

    if (data) {
      const { id, user_id, ai_output, created_at, updated_at, ...fields } = data
      setAnswers(fields as Answers)
      if (ai_output) { setAiOutput(ai_output as AIOutput); setStep(7) }
    }
    setLoading(false)
  }

  function set(key: string, val: string) {
    setAnswers(prev => ({ ...prev, [key]: val }))
  }

  function currentComplete() {
    return STEPS[step]?.fields.every(f => (answers[f.key] || '').trim().length > 0)
  }

  async function buildBrandScript() {
    setBuilding(true)
    try {
      // Save answers first
      await supabase.from('storybrand_scripts').upsert({
        user_id: profile!.id,
        ...answers,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/build-storybrand`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(answers),
        }
      )
      const output: AIOutput = await res.json()
      setAiOutput(output)

      // Save AI output
      await supabase.from('storybrand_scripts').update({
        ai_output: output,
        updated_at: new Date().toISOString(),
      }).eq('user_id', profile!.id)

      setStep(7)
    } catch (err) {
      console.error(err)
    }
    setBuilding(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-6 h-6 rounded-full animate-spin" style={{ border: `2px solid ${GOLD}`, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  // ── RESULT VIEW ───────────────────────────────────────────────────────────
  if (step === 7 && aiOutput) {
    return (
      <div className="min-h-screen p-4 md:p-8" style={{ background: BG }}>
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={16} style={{ color: GOLD }} />
              <p className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>StoryBrand™ Builder</p>
            </div>
            <h1 className="text-2xl font-bold text-white">Tu BrandScript está listo</h1>
            <p className="text-gray-400 text-sm mt-1">La historia de tu marca, construida sobre el framework de Donald Miller.</p>
          </motion.div>

          {/* TAGLINES */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">🏷️ Tus 3 opciones de Tagline — elige el que más te representa</p>
            <div className="space-y-3">
              {aiOutput.taglines.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTag(i)}
                  className="w-full text-left rounded-2xl p-5 transition-all"
                  style={{
                    background: selectedTag === i ? 'linear-gradient(135deg, #1a120a 0%, #120e04 100%)' : '#111111',
                    border: `2px solid ${selectedTag === i ? GOLD : '#1E1E1E'}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${GOLD}22`, color: GOLD }}>
                          {t.nombre}
                        </span>
                        {selectedTag === i && <span className="text-xs text-green-400">✓ Seleccionado</span>}
                      </div>
                      <p className="text-white text-lg font-bold mb-2">"{t.texto}"</p>
                      <p className="text-gray-400 text-xs">{t.por_que}</p>
                    </div>
                    <CopyBtn text={t.texto} />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* ONE-LINER */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl p-5 mb-4"
            style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #080814 100%)', border: '1px solid #3B82F644' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#60A5FA' }}>💬 One-Liner — Tu presentación de 1 oración</p>
              <CopyBtn text={aiOutput.one_liner} />
            </div>
            <p className="text-white text-base leading-relaxed font-medium">"{aiOutput.one_liner}"</p>
            <p className="text-gray-500 text-xs mt-2">Fórmula StoryBrand: Ayudo a [quién] a [resultado] para que [transformación]</p>
          </motion.div>

          {/* BRAND STATEMENT */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-2xl p-5 mb-4"
            style={{ background: '#111111', border: '1px solid #1E1E1E' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: GOLD }}>📖 Brand Statement — La historia completa</p>
              <CopyBtn text={aiOutput.brand_statement} />
            </div>
            <p className="text-gray-200 text-sm leading-relaxed">{aiOutput.brand_statement}</p>
          </motion.div>

          {/* WEB COPY */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl p-5 mb-4"
            style={{ background: '#111111', border: '1px solid #1E1E1E' }}>
            <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: '#10B981' }}>🌐 Copy para tu Web</p>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">Titular principal (above the fold)</p>
                  <CopyBtn text={aiOutput.web_headline} />
                </div>
                <p className="text-white text-xl font-bold">{aiOutput.web_headline}</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">Subtítulo</p>
                  <CopyBtn text={aiOutput.web_subheadline} />
                </div>
                <p className="text-gray-300 text-sm">{aiOutput.web_subheadline}</p>
              </div>
            </div>
          </motion.div>

          {/* INSTAGRAM BIO */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="rounded-2xl p-5 mb-4"
            style={{ background: '#111111', border: '1px solid #1E1E1E' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#E1306C' }}>📱 Bio de Instagram</p>
              <CopyBtn text={aiOutput.instagram_bio} />
            </div>
            <p className="text-gray-200 text-sm leading-relaxed font-medium">{aiOutput.instagram_bio}</p>
            <p className="text-gray-600 text-xs mt-1">{aiOutput.instagram_bio.length} / 150 caracteres</p>
          </motion.div>

          {/* PITCH 30s */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl p-5 mb-8"
            style={{ background: 'linear-gradient(135deg, #0a1a0a 0%, #081408 100%)', border: '1px solid #4ADE8044' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#4ADE80' }}>🎙️ Pitch de 30 segundos</p>
              <CopyBtn text={aiOutput.pitch_30_seg} />
            </div>
            <p className="text-gray-200 text-sm leading-relaxed">{aiOutput.pitch_30_seg}</p>
          </motion.div>

          {/* Refine button */}
          <div className="flex gap-3 pb-8">
            <button
              onClick={() => { setStep(0); setAiOutput(null) }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: '#1A1A1A', color: '#9CA3AF', border: '1px solid #2A2A2A' }}
            >
              <RefreshCw size={14} />
              Refinar mi BrandScript
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── WIZARD VIEW ───────────────────────────────────────────────────────────
  const currentStep = STEPS[step]
  const isLastStep  = step === STEPS.length - 1
  const pct = Math.round(((step + 1) / STEPS.length) * 100)

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: BG }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={16} style={{ color: GOLD }} />
            <p className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>StoryBrand™ Builder</p>
          </div>
          <h1 className="text-xl font-bold text-white">Define la historia de tu marca</h1>
          <p className="text-gray-400 text-xs mt-1">Framework de Donald Miller — 7 elementos que garantizan una comunicación que conecta y vende.</p>
        </motion.div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-500">Paso {step + 1} de {STEPS.length}</span>
            <span style={{ color: GOLD }}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: '#1E1E1E' }}>
            <motion.div
              className="h-1.5 rounded-full"
              style={{ background: GOLD }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          {/* Step dots */}
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => i < step && setStep(i)}
                className="text-base transition-all"
                style={{ opacity: i <= step ? 1 : 0.3, cursor: i < step ? 'pointer' : 'default' }}
                title={s.title}
              >
                {s.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Step card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl p-6 mb-4"
            style={{ background: '#111111', border: `1px solid ${currentStep.color}33` }}
          >
            {/* Step header */}
            <div className="flex items-start gap-3 mb-5">
              <div className="text-3xl mt-0.5">{currentStep.emoji}</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${currentStep.color}22`, color: currentStep.color }}>
                    Elemento {currentStep.step}/7
                  </span>
                </div>
                <h2 className="text-white font-bold text-base">{currentStep.title}</h2>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">{currentStep.subtitle}</p>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-5">
              {currentStep.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm text-gray-200 font-medium mb-1">{field.label}</label>
                  <p className="text-xs text-gray-500 mb-2 leading-relaxed">{field.hint}</p>
                  <textarea
                    rows={field.rows}
                    value={answers[field.key] || ''}
                    onChange={e => set(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white resize-none outline-none transition-colors"
                    style={{ background: '#0A0A0A', border: '1px solid #2A2A2A' }}
                    onFocus={e => (e.target.style.borderColor = currentStep.color)}
                    onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm disabled:opacity-30 transition-all"
            style={{ background: '#1A1A1A', color: '#9CA3AF', border: '1px solid #2A2A2A' }}
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          {isLastStep ? (
            <button
              onClick={buildBrandScript}
              disabled={building || !currentComplete()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold disabled:opacity-40 transition-all"
              style={{ background: GOLD, color: '#0A0A0A' }}
            >
              {building ? (
                <>
                  <div className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid #0A0A0A', borderTopColor: 'transparent' }} />
                  Construyendo tu BrandScript...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generar mi BrandScript con IA
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!currentComplete()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
              style={{ background: currentComplete() ? GOLD : '#2A2A2A', color: currentComplete() ? '#0A0A0A' : '#6B7280' }}
            >
              Siguiente
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Building overlay */}
        {building && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.85)' }}
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📖</div>
              <div className="flex items-center gap-2 mb-3 justify-center">
                {[0,1,2,3,4,5,6].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: GOLD }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
                  />
                ))}
              </div>
              <p className="text-white font-semibold text-lg">Construyendo tu BrandScript</p>
              <p className="text-gray-400 text-sm mt-1">La IA está analizando tus 7 elementos...</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
