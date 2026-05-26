import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Lightbulb, ChevronRight, ChevronLeft, Sparkles, Loader2, Copy, Check, RotateCcw } from 'lucide-react'

const GOLD = '#C9A84C'
const SURFACE = '#111111'
const BORDER = '#1E1E1E'

interface OfferRow {
  id: string
  user_id: string
  ideal_client: string
  result_promised: string
  timeframe: string
  differentiator: string
  price_range: string
  one_liner: string | null
  elevator_pitch: string | null
  pain_point: string | null
  price_validation: string | null
  opening_line: string | null
  generated_at: string | null
  created_at: string
}

const STEPS = [
  {
    id: 'ideal_client' as const,
    number: 1,
    question: '¿Para quién exactamente?',
    description: 'Define tu cliente ideal con precisión. No "emprendedores" — sino quién, dónde están, y qué problema tienen ahora mismo.',
    placeholder: 'Ej: Coaches de vida en LATAM que llevan 1-2 años trabajando, ya tienen algunos clientes pero siguen cobrando poco y no saben cómo escalar sin trabajar más horas...',
    hint: '💡 Cuanto más específico/a seas, más irresistible es la oferta. El miedo al nicho es lo que paraliza a la mayoría.',
  },
  {
    id: 'result_promised' as const,
    question: '¿Qué resultado concreto obtienen?',
    description: 'El antes y el después. Medible, específico, verificable. No "mejorar" o "aprender" — un cambio real que puedan imaginar.',
    placeholder: 'Ej: Consiguen su primer cliente de $1,500+ al mes en 60 días usando solo Instagram, sin publicidad pagada y sin sentirse vendedores...',
    hint: '💡 El resultado debe ser tan concreto que el cliente pueda decir "sí, eso es exactamente lo que quiero".',
  },
  {
    id: 'timeframe' as const,
    question: '¿En cuánto tiempo?',
    description: 'El plazo que puedes comprometer con confianza. Un timeframe concreto multiplica el valor percibido.',
    placeholder: 'Ej: En 90 días / En 8 semanas / En 30 días de trabajo activo...',
    hint: '💡 "Sin fecha límite" no convence a nadie. Un plazo te hace responsable y a ellos les da certeza.',
  },
  {
    id: 'differentiator' as const,
    question: '¿Por qué tú y no otro?',
    description: 'Tu método, historia, experiencia o enfoque único. No tienes que ser "el mejor" — tienes que ser diferente.',
    placeholder: 'Ej: Creé el método REVENUE FIRST después de ayudar a 50+ emprendedores a pasar de $0 a su primera venta en menos de 60 días. Mi enfoque va directo a la acción, sin teoría...',
    hint: '💡 Tu historia personal es tu diferenciador más poderoso. Nadie más vivió lo que tú viviste.',
  },
  {
    id: 'price_range' as const,
    question: '¿A qué precio y por qué vale eso?',
    description: 'Precio actual o deseado. Y la justificación basada en el valor que entregas, no en tu tiempo.',
    placeholder: 'Ej: $2,500 por 3 meses de acompañamiento. Si consiguen 2 clientes de $1,500, ya recuperaron la inversión con un solo cliente extra...',
    hint: '💡 El precio correcto se ancla al resultado. ¿Cuánto vale el cambio que prometes? Parte de ahí.',
  },
]

type StepId = typeof STEPS[number]['id']
type Answers = Record<StepId, string>

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all"
      style={{ background: copied ? '#4ADE8022' : '#ffffff0a', color: copied ? '#4ADE80' : '#888' }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}

function OfferCard({ label, emoji, content, color }: { label: string; emoji: string; content: string; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: `${color}0A`, border: `1px solid ${color}33` }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold tracking-wider uppercase" style={{ color }}>
          {emoji} {label}
        </p>
        <CopyButton text={content} />
      </div>
      <p className="text-gray-200 text-sm leading-relaxed">{content}</p>
    </div>
  )
}

export default function OfferBuilderPage() {
  const { profile, getCurrentDay } = useAuth()
  const day = getCurrentDay()

  const [loading, setLoading] = useState(true)
  const [offer, setOffer] = useState<OfferRow | null>(null)
  const [editing, setEditing] = useState(false)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({
    ideal_client: '',
    result_promised: '',
    timeframe: '',
    differentiator: '',
    price_range: '',
  })
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (profile?.id) fetchOffer() }, [profile?.id])

  async function fetchOffer() {
    if (!profile?.id) return
    const { data } = await supabase
      .from('offer_builder')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle()
    if (data) {
      setOffer(data as OfferRow)
      setAnswers({
        ideal_client: data.ideal_client,
        result_promised: data.result_promised,
        timeframe: data.timeframe,
        differentiator: data.differentiator,
        price_range: data.price_range,
      })
    }
    setLoading(false)
  }

  function startEditing() {
    if (offer) {
      setAnswers({
        ideal_client: offer.ideal_client,
        result_promised: offer.result_promised,
        timeframe: offer.timeframe,
        differentiator: offer.differentiator,
        price_range: offer.price_range,
      })
    }
    setStep(0)
    setEditing(true)
    setError(null)
  }

  async function handleGenerate() {
    if (!profile?.id) return
    setGenerating(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/build-offer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({
            participant_name: profile.full_name || profile.email,
            day_of_program: day,
            ...answers,
          }),
        }
      )

      if (!res.ok) throw new Error('Error al llamar la función')
      const result = await res.json()
      if (result.error) throw new Error(result.error)

      // Upsert to DB
      const payload = {
        user_id: profile.id,
        ...answers,
        one_liner: result.one_liner ?? null,
        elevator_pitch: result.elevator_pitch ?? null,
        pain_point: result.pain_point ?? null,
        price_validation: result.price_validation ?? null,
        opening_line: result.opening_line ?? null,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: saved } = await supabase
        .from('offer_builder')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single()

      if (saved) setOffer(saved as OfferRow)
      setEditing(false)
    } catch (e: any) {
      setError(e.message ?? 'Error inesperado')
    } finally {
      setGenerating(false)
    }
  }

  const currentStepData = STEPS[step]
  const allAnswered = STEPS.every(s => answers[s.id].trim().length > 0)
  const isLastStep = step === STEPS.length - 1

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <div className="w-6 h-6 rounded-full animate-spin" style={{ border: `2px solid ${GOLD}`, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  // ── Show existing offer ─────────────────────────────────────────────
  if (offer?.one_liner && !editing) {
    return (
      <div className="min-h-screen p-4 md:p-8" style={{ background: '#0A0A0A' }}>
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb size={18} style={{ color: GOLD }} />
              <p className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>Offer Builder™</p>
            </div>
            <h1 className="text-2xl font-bold text-white">Tu oferta irresistible</h1>
            <p className="text-gray-400 text-sm mt-1">Construida con IA a partir de tus respuestas.</p>
          </motion.div>

          {/* One liner — hero */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-6 mb-5 text-center"
            style={{ background: `linear-gradient(135deg, #1a1000 0%, #1f1400 100%)`, border: `1px solid ${GOLD}55` }}
          >
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: GOLD }}>Tu oferta en una línea</p>
            <p className="text-white font-bold text-xl leading-snug mb-4">{offer.one_liner}</p>
            <CopyButton text={offer.one_liner} />
          </motion.div>

          {/* Output cards */}
          <div className="space-y-3 mb-6">
            {offer.elevator_pitch && (
              <OfferCard label="Elevator Pitch" emoji="💬" content={offer.elevator_pitch} color="#60A5FA" />
            )}
            {offer.pain_point && (
              <OfferCard label="El dolor que resuelves" emoji="🎯" content={offer.pain_point} color="#F87171" />
            )}
            {offer.opening_line && (
              <OfferCard label="Primera línea de ventas" emoji="⚡" content={offer.opening_line} color="#A78BFA" />
            )}
            {offer.price_validation && (
              <OfferCard label="Tu precio — validación" emoji="💰" content={offer.price_validation} color="#4ADE80" />
            )}
          </div>

          {/* Raw answers summary */}
          <details className="mb-6">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 transition-colors mb-2">
              Ver tus respuestas originales
            </summary>
            <div className="space-y-2 mt-3">
              {STEPS.map(s => (
                <div key={s.id} className="rounded-lg p-3" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                  <p className="text-xs text-gray-500 mb-1">{s.question}</p>
                  <p className="text-gray-300 text-sm">{answers[s.id]}</p>
                </div>
              ))}
            </div>
          </details>

          {/* Refine button */}
          <button
            onClick={startEditing}
            className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-80"
            style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: '#aaa' }}
          >
            <RotateCcw size={14} />
            Refinar mi oferta
          </button>

        </div>
      </div>
    )
  }

  // ── Wizard ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb size={18} style={{ color: GOLD }} />
            <p className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>Offer Builder™</p>
          </div>
          <h1 className="text-2xl font-bold text-white">Construye tu oferta irresistible</h1>
          <p className="text-gray-400 text-sm mt-1">
            5 preguntas. La IA sintetiza el resultado. 10 minutos que valen más que un mes de confusión.
          </p>
        </motion.div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-500">Paso {step + 1} de {STEPS.length}</span>
            <span style={{ color: GOLD }}>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: '#2A2A2A' }}>
            <motion.div
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4 }}
              className="h-1.5 rounded-full"
              style={{ background: GOLD }}
            />
          </div>
          {/* Step dots */}
          <div className="flex justify-between mt-3">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className="flex flex-col items-center gap-1 cursor-pointer"
                onClick={() => { if (i <= step || answers[STEPS[Math.max(0, i - 1)].id]) setStep(i) }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: i < step ? '#4ADE8033' : i === step ? `${GOLD}33` : '#1A1A1A',
                    border: `1px solid ${i < step ? '#4ADE8066' : i === step ? GOLD + '88' : '#2A2A2A'}`,
                    color: i < step ? '#4ADE80' : i === step ? GOLD : '#555',
                  }}
                >
                  {i < step ? '✓' : i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-5">
              <h2 className="text-white font-bold text-xl mb-1">{currentStepData.question}</h2>
              <p className="text-gray-400 text-sm leading-relaxed">{currentStepData.description}</p>
            </div>

            <textarea
              rows={5}
              value={answers[currentStepData.id]}
              onChange={e => setAnswers(prev => ({ ...prev, [currentStepData.id]: e.target.value }))}
              placeholder={currentStepData.placeholder}
              className="w-full px-4 py-3 rounded-xl text-sm text-white resize-none outline-none mb-3"
              style={{ background: SURFACE, border: `1px solid #2A2A2A`, lineHeight: '1.6' }}
              onFocus={e => (e.target.style.borderColor = GOLD + '88')}
              onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
              autoFocus
            />

            {/* Hint */}
            <div
              className="rounded-lg px-4 py-3 mb-6 text-xs leading-relaxed"
              style={{ background: `${GOLD}08`, color: '#888', border: `1px solid ${GOLD}22` }}
            >
              {currentStepData.hint}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: '#aaa' }}
                >
                  <ChevronLeft size={16} />
                  Atrás
                </button>
              )}

              {!isLastStep ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!answers[currentStepData.id].trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                  style={{ background: GOLD, color: '#0A0A0A' }}
                >
                  Siguiente
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={!allAnswered || generating}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm disabled:opacity-40 transition-all"
                  style={{ background: generating ? '#7C3AED' : GOLD, color: '#0A0A0A' }}
                >
                  {generating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" style={{ color: '#fff' }} />
                      <span style={{ color: '#fff' }}>Construyendo tu oferta...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Construir mi oferta con IA
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Generating state */}
            <AnimatePresence>
              {generating && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-xl p-4 mt-4"
                  style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 100%)', border: '1px solid #7C3AED44' }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles size={14} className="text-purple-400 animate-pulse" />
                    <p className="text-sm font-medium" style={{ color: '#A78BFA' }}>
                      La IA está analizando tus respuestas...
                    </p>
                  </div>
                  <div className="space-y-2">
                    {['Identificando tu cliente ideal', 'Afilando el resultado prometido', 'Construyendo tu elevator pitch', 'Validando tu precio', 'Generando tu línea de apertura'].map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#7C3AED', animationDelay: `${i * 0.2}s` }} />
                        <p className="text-xs text-gray-500">{t}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="rounded-lg p-3 mt-3 text-xs text-red-400" style={{ background: '#EF444411', border: '1px solid #EF444433' }}>
                Error: {error}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  )
}
