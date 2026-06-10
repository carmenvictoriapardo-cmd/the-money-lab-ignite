import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { ArrowRight, ArrowLeft, Check, Loader2, Star, Target, Zap, Brain, Eye } from 'lucide-react'

const GOLD    = '#C9A84C'
const BG      = '#0A0A0A'
const SURFACE = '#111111'
const BORDER  = '#1E1E1E'

// ── TYPES ───────────────────────────────────────────────────────
interface SectionField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'slider'
  placeholder?: string
  options?: string[]
}

interface Responses {
  // Section 1 — Negocio
  business_name:    string
  ideal_client:     string
  problem_solved:   string
  differentiator:   string
  // Section 2 — Situación
  time_in_business: string
  monthly_revenue:  string
  weekly_hours:     string
  biggest_obstacle: string
  // Section 3 — Identidad
  confidence_score: string
  biggest_fear:     string
  biggest_win:      string
  self_perception:  string
  // Section 4 — Oferta
  offer_description:  string
  client_acquisition: string
  active_clients:     string
  offer_clarity:      string
  // Section 5 — Visión
  goal_90_days:        string
  income_goal:         string
  success_definition:  string
  what_is_missing:     string
}

interface FounderProfile {
  headline:         string
  stage:            string
  stage_description: string
  strengths:        string[]
  opportunities:    string[]
  clarity_gaps:     string[]
  ignite_message:   string
  first_focus:      string
  score_breakdown:  Record<string, number>
  total_score:      number
}

const EMPTY_RESPONSES: Responses = {
  business_name: '', ideal_client: '', problem_solved: '', differentiator: '',
  time_in_business: '', monthly_revenue: '', weekly_hours: '', biggest_obstacle: '',
  confidence_score: '', biggest_fear: '', biggest_win: '', self_perception: '',
  offer_description: '', client_acquisition: '', active_clients: '', offer_clarity: '',
  goal_90_days: '', income_goal: '', success_definition: '', what_is_missing: '',
}

const STAGE_COLORS: Record<string, string> = {
  'Exploradora': '#8B5CF6',
  'Arrancando':  '#3B82F6',
  'En Movimiento': GOLD,
  'Escalando':   '#10B981',
}

const SECTIONS: { id: number; key: string; icon: React.ComponentType<{size?: number; style?: React.CSSProperties}>; color: string; title: string; subtitle: string; fields: SectionField[] }[] = [
  {
    id: 1,
    key: 'negocio',
    icon: Target,
    color: '#3B82F6',
    title: 'Tu Negocio',
    subtitle: 'Cuéntame sobre lo que haces',
    fields: [
      { key: 'business_name',  label: '¿Cuál es el nombre de tu negocio o proyecto?', placeholder: 'ej. Studio XYZ, Coaching con Ana, etc.', type: 'text' },
      { key: 'ideal_client',   label: '¿A quién exactamente sirves?', placeholder: 'Describe a tu cliente ideal — quién es, qué hace, qué necesita...', type: 'textarea' },
      { key: 'problem_solved', label: '¿Qué problema principal resuelves?', placeholder: 'El problema específico que tu negocio soluciona...', type: 'textarea' },
      { key: 'differentiator', label: '¿Qué te hace única? ¿Cuál es tu diferenciador?', placeholder: 'Por qué alguien debería elegirte a ti y no a otro...', type: 'textarea' },
    ],
  },
  {
    id: 2,
    key: 'situacion',
    icon: Zap,
    color: '#10B981',
    title: 'Tu Situación Actual',
    subtitle: 'Dónde estás hoy en tu negocio',
    fields: [
      { key: 'time_in_business', label: '¿Cuánto tiempo llevas en este negocio?', type: 'select',
        options: ['Menos de 6 meses', '6 meses – 1 año', '1 – 2 años', '2 – 5 años', 'Más de 5 años'] },
      { key: 'monthly_revenue', label: '¿Cuál es tu ingreso mensual actual de este negocio?', type: 'select',
        options: ['$0 – aún no genero', '$1 – $500', '$500 – $2,000', '$2,000 – $5,000', '$5,000 – $10,000', 'Más de $10,000'] },
      { key: 'weekly_hours',    label: '¿Cuántas horas a la semana dedicas a tu negocio?', type: 'select',
        options: ['Menos de 5 horas', '5 – 15 horas', '15 – 30 horas', '30 – 40 horas', 'Más de 40 horas'] },
      { key: 'biggest_obstacle', label: '¿Cuál es tu mayor obstáculo en este momento?', placeholder: 'El bloqueo principal que te frena ahora mismo...', type: 'textarea' },
    ],
  },
  {
    id: 3,
    key: 'identidad',
    icon: Brain,
    color: '#8B5CF6',
    title: 'Tu Identidad como Emprendedora',
    subtitle: 'Cómo te ves a ti misma',
    fields: [
      { key: 'confidence_score', label: 'En una escala del 1 al 10, ¿cómo calificarías tu confianza como emprendedora hoy?', type: 'slider' },
      { key: 'biggest_fear',     label: '¿Cuál es tu mayor miedo en los negocios?', placeholder: 'Lo que más te paraliza o te genera dudas...', type: 'textarea' },
      { key: 'biggest_win',      label: '¿Cuál ha sido tu mayor logro en tu negocio hasta ahora?', placeholder: 'Tu win más grande — aunque te parezca pequeño...', type: 'textarea' },
      { key: 'self_perception',  label: '¿Te ves como una "fundadora" o simplemente "dueña de negocio"? ¿Por qué?', placeholder: 'Cómo describes tu rol e identidad...', type: 'textarea' },
    ],
  },
  {
    id: 4,
    key: 'oferta',
    icon: Star,
    color: GOLD,
    title: 'Tu Claridad de Oferta',
    subtitle: 'Qué vendes y cómo lo vendes',
    fields: [
      { key: 'offer_description',  label: '¿Qué es exactamente lo que vendes? (producto, servicio, precio)', placeholder: 'Describe tu oferta principal: qué incluye, cuánto cuesta...', type: 'textarea' },
      { key: 'client_acquisition', label: '¿Cómo consigues clientes actualmente?', type: 'select',
        options: ['Referidos / boca a boca', 'Redes sociales orgánico', 'Publicidad pagada (ads)', 'Email marketing', 'Llamadas en frío / DMs', 'Networking / eventos', 'Aún no tengo sistema claro'] },
      { key: 'active_clients',     label: '¿Cuántos clientes activos tienes ahora?', type: 'select',
        options: ['0 — aún no tengo clientes', '1 – 3', '4 – 10', '11 – 25', 'Más de 25'] },
      { key: 'offer_clarity',      label: '¿Puedes describir tu oferta en una sola oración clara?', placeholder: 'Escribe aquí esa oración — o di por qué no puedes aún...', type: 'textarea' },
    ],
  },
  {
    id: 5,
    key: 'vision',
    icon: Eye,
    color: '#EF4444',
    title: 'Tu Visión y Metas',
    subtitle: 'A dónde quieres llegar',
    fields: [
      { key: 'goal_90_days',       label: '¿Cuál es tu meta principal para los próximos 90 días del programa?', placeholder: 'Sé específica — qué quieres lograr al terminar las 12 semanas...', type: 'textarea' },
      { key: 'income_goal',        label: '¿Qué ingreso mensual quieres alcanzar al finalizar el programa?', type: 'select',
        options: ['$1,000 – $3,000', '$3,000 – $5,000', '$5,000 – $10,000', '$10,000 – $20,000', 'Más de $20,000'] },
      { key: 'success_definition', label: '¿Qué significa para ti "tener éxito" en este programa?', placeholder: 'Más allá del dinero — cómo sabrás que fue un éxito...', type: 'textarea' },
      { key: 'what_is_missing',    label: '¿Qué necesitas para empezar a moverte — qué sientes que te falta?', placeholder: 'Qué recurso, conocimiento, claridad o apoyo necesitas...', type: 'textarea' },
    ],
  },
]

// ── COMPONENT ───────────────────────────────────────────────────
export default function ClaritySprintPage() {
  const { profile } = useAuth()
  const [step, setStep]               = useState(0)       // 0=intro, 1-5=sections, 6=generating, 7=profile
  const [responses, setResponses]     = useState<Responses>(EMPTY_RESPONSES)
  const [profile_, setProfile_]       = useState<FounderProfile | null>(null)
  const [existingScore, setExistingScore] = useState<number | null>(null)
  const [loadingExisting, setLoadingExisting] = useState(true)

  useEffect(() => {
    if (profile?.id) checkExisting()
  }, [profile?.id])

  async function checkExisting() {
    const { data } = await supabase
      .from('clarity_responses')
      .select('clarity_score, score_breakdown, strategic_profile, responses, status')
      .eq('user_id', profile!.id)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setExistingScore(data.clarity_score)
      try {
        const p = JSON.parse(data.strategic_profile ?? '{}')
        setProfile_(p)
        setResponses(data.responses as Responses)
        setStep(7) // show results directly
      } catch { /* ignore */ }
    }
    setLoadingExisting(false)
  }

  function setField(key: keyof Responses, value: string) {
    setResponses(prev => ({ ...prev, [key]: value }))
  }

  function isSectionComplete(sectionIdx: number): boolean {
    const section = SECTIONS[sectionIdx]
    return section.fields.every(f => {
      const val = responses[f.key as keyof Responses]
      return val && val.trim().length > 0
    })
  }

  async function generateProfile() {
    setStep(6)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-clarity-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            user_id: profile!.id,
            full_name: profile!.full_name,
            responses,
          }),
        }
      )
      const data = await res.json()
      if (data.profile) {
        setProfile_(data.profile)
        setExistingScore(data.total_score)
        setStep(7)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const currentSection = step >= 1 && step <= 5 ? SECTIONS[step - 1] : null
  const completedSections = SECTIONS.filter((_, i) => isSectionComplete(i)).length
  const progressPct = step >= 1 && step <= 5 ? ((step - 1) / 5) * 100 : 0

  // ── LOADING ────────────────────────────────────────────────
  if (loadingExisting) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="w-6 h-6 rounded-full animate-spin" style={{ border: `2px solid ${GOLD}`, borderTopColor: 'transparent' }} />
    </div>
  )

  // ── GENERATING SCREEN ──────────────────────────────────────
  if (step === 6) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: BG }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: `${GOLD}22`, border: `2px solid ${GOLD}44` }}>
          <Loader2 size={28} className="animate-spin" style={{ color: GOLD }} />
        </div>
        <p className="text-xs tracking-[0.2em] uppercase mb-2" style={{ color: GOLD }}>
          CLARITY SPRINT™
        </p>
        <h2 className="text-white text-xl font-bold mb-3">Generando tu perfil...</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          La IA está analizando tus respuestas y creando tu Strategic Founder Profile™ personalizado.
        </p>
        <div className="mt-6 flex items-center justify-center gap-1">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-2 h-2 rounded-full"
              style={{ background: GOLD }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )

  // ── PROFILE RESULTS ────────────────────────────────────────
  if (step === 7 && profile_) {
    const stageColor = STAGE_COLORS[profile_.stage] || GOLD
    const breakdown = profile_.score_breakdown || {}
    const breakdownItems = [
      { key: 'negocio',    label: 'Negocio',   color: '#3B82F6' },
      { key: 'situacion',  label: 'Situación',  color: '#10B981' },
      { key: 'identidad',  label: 'Identidad',  color: '#8B5CF6' },
      { key: 'oferta',     label: 'Oferta',     color: GOLD      },
      { key: 'vision',     label: 'Visión',     color: '#EF4444' },
    ]

    return (
      <div className="min-h-screen p-4 md:p-8" style={{ background: BG }}>
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: GOLD }}>
              CLARITY SPRINT™ COMPLETADO
            </p>
            <h1 className="text-2xl font-bold text-white">Strategic Founder Profile™</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {profile!.full_name} · Perfil generado para THE MONEY LAB™ IGNITE
            </p>
          </motion.div>

          {/* Score + Stage */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-2xl p-5"
            style={{ background: `${stageColor}10`, border: `2px solid ${stageColor}44` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tu Clarity Score</p>
                <p className="text-5xl font-black" style={{ color: stageColor }}>
                  {existingScore ?? profile_.total_score}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">de 100 puntos</p>
              </div>
              <div className="text-right">
                <div className="inline-block px-3 py-1.5 rounded-full text-sm font-bold mb-2"
                  style={{ background: `${stageColor}22`, color: stageColor, border: `1px solid ${stageColor}44` }}>
                  {profile_.stage}
                </div>
                <p className="text-gray-400 text-xs max-w-[150px] text-right leading-relaxed">
                  {profile_.stage_description}
                </p>
              </div>
            </div>

            {/* Score bars */}
            <div className="space-y-2">
              {breakdownItems.map(item => {
                const val = breakdown[item.key] ?? 0
                return (
                  <div key={item.key} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-16 flex-shrink-0">{item.label}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#2A2A2A' }}>
                      <motion.div className="h-full rounded-full"
                        style={{ background: item.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(val / 20) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                    </div>
                    <span className="text-xs font-bold w-10 text-right" style={{ color: item.color }}>
                      {val}/20
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl p-5"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <p className="text-xs tracking-wider uppercase text-gray-600 mb-2">Tu Perfil en una Línea</p>
            <p className="text-white text-lg font-semibold leading-relaxed">"{profile_.headline}"</p>
          </motion.div>

          {/* 3 columns: strengths, opportunities, gaps */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: '💪 Fortalezas', items: profile_.strengths || [], color: '#4ADE80' },
              { label: '🎯 Oportunidades', items: profile_.opportunities || [], color: GOLD },
              { label: '🔑 El programa cubre', items: profile_.clarity_gaps || [], color: '#8B5CF6' },
            ].map(({ label, items, color }) => (
              <div key={label} className="rounded-xl p-4"
                style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                <p className="text-xs font-semibold mb-3" style={{ color }}>{label}</p>
                <ul className="space-y-1.5">
                  {items.map((item: string, i: number) => (
                    <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                      <span style={{ color, marginTop: '2px' }}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>

          {/* Ignite message + first focus */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="space-y-3">
            <div className="rounded-2xl p-5"
              style={{ background: `${GOLD}10`, border: `1.5px solid ${GOLD}33` }}>
              <p className="text-xs tracking-wider uppercase mb-2" style={{ color: GOLD }}>
                Mensaje de Carmen
              </p>
              <p className="text-gray-200 text-sm leading-relaxed">{profile_.ignite_message}</p>
            </div>

            <div className="rounded-2xl p-4"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <p className="text-xs tracking-wider uppercase text-gray-600 mb-1.5">Tu primer enfoque</p>
              <p className="text-white text-sm leading-relaxed">🎯 {profile_.first_focus}</p>
            </div>
          </motion.div>

          {/* Status notice */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="rounded-xl p-4 text-center"
            style={{ background: '#0F1F0F', border: '1px solid #1A3A1A' }}>
            <p className="text-green-400 text-sm font-semibold mb-1">✅ Perfil enviado a Carmen</p>
            <p className="text-gray-600 text-xs">
              Carmen revisará tu CLARITY SPRINT™ y agendará tu sesión de Strategic Founder Mapping™ (90 min).
              Recibirás tu Clarity Score oficial después de esa sesión.
            </p>
          </motion.div>

          {/* Redo button */}
          <div className="flex justify-center pb-4">
            <button onClick={() => { setStep(0); setProfile_(null); setExistingScore(null) }}
              className="text-xs text-gray-700 hover:text-gray-500 transition-colors underline">
              Volver a hacer el CLARITY SPRINT™
            </button>
          </div>

        </div>
      </div>
    )
  }

  // ── INTRO ──────────────────────────────────────────────────
  if (step === 0) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: BG }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full text-center">

        <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: `${GOLD}15`, border: `2px solid ${GOLD}33` }}>
          <span className="text-3xl">⚡</span>
        </div>

        <p className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: GOLD }}>
          PRE-PROGRAMA
        </p>
        <h1 className="text-3xl font-black text-white mb-3">CLARITY SPRINT™</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Antes de empezar las 12 semanas, necesito conocerte profundamente. Este formulario de claridad
          me ayuda a entender exactamente dónde estás y qué necesitas para que el programa sea
          transformador para ti.
        </p>

        <div className="rounded-2xl p-5 mb-6 text-left space-y-3"
          style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
          {[
            { n: '5', label: 'secciones, 20 preguntas', sub: '~15 minutos de tu tiempo' },
            { n: '🤖', label: 'IA genera tu perfil', sub: 'Strategic Founder Profile™ personalizado' },
            { n: '📊', label: 'Tu Clarity Score', sub: 'De 0–100, con breakdown por área' },
            { n: '📞', label: 'Sesión 1:1 con Carmen', sub: 'Strategic Founder Mapping™ (90 min)' },
          ].map(({ n, label, sub }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: `${GOLD}15`, color: GOLD }}>
                {n}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-gray-500 text-xs">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setStep(1)}
          className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: GOLD, color: '#0A0A0A' }}>
          Empezar CLARITY SPRINT™
          <ArrowRight size={16} />
        </button>

        <p className="text-gray-700 text-xs mt-3">
          Puedes guardar y continuar después. Tus respuestas se guardan automáticamente.
        </p>
      </motion.div>
    </div>
  )

  // ── SECTIONS 1–5 ──────────────────────────────────────────
  if (!currentSection) return null
  const { icon: SectionIcon, color: sectionColor } = currentSection
  const sectionComplete = isSectionComplete(step - 1)

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: BG }}>
      <div className="max-w-2xl mx-auto">

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600">Sección {step} de 5</p>
            <p className="text-xs" style={{ color: sectionColor }}>{completedSections}/5 completas</p>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1E1E1E' }}>
            <motion.div className="h-full rounded-full transition-all"
              style={{ background: sectionColor, width: `${progressPct + 20}%` }}
            />
          </div>
          {/* Section dots */}
          <div className="flex items-center justify-between mt-2">
            {SECTIONS.map((s, i) => (
              <button key={s.id} onClick={() => setStep(i + 1)}
                className="flex items-center gap-1 transition-all">
                <div className="w-2 h-2 rounded-full transition-all"
                  style={{
                    background: i + 1 === step ? sectionColor :
                      isSectionComplete(i) ? '#4ADE80' : '#2A2A2A',
                    transform: i + 1 === step ? 'scale(1.4)' : 'scale(1)',
                  }} />
              </button>
            ))}
          </div>
        </div>

        {/* Section header */}
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-5">

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${sectionColor}15`, border: `1px solid ${sectionColor}30` }}>
                <SectionIcon size={18} style={{ color: sectionColor }} />
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wider">{currentSection.subtitle}</p>
                <h2 className="text-white font-bold text-lg">{currentSection.title}</h2>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              {currentSection.fields.map((field) => {
                const value = responses[field.key as keyof Responses]
                return (
                  <div key={field.key} className="rounded-2xl p-4"
                    style={{ background: SURFACE, border: `1px solid ${value ? sectionColor + '44' : BORDER}` }}>
                    <label className="block text-white text-sm font-medium mb-3 leading-relaxed">
                      {field.label}
                    </label>

                    {field.type === 'text' && (
                      <input
                        value={value}
                        onChange={e => setField(field.key as keyof Responses, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-700 border-b border-gray-800 pb-2 focus:border-gray-600 transition-colors"
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        value={value}
                        onChange={e => setField(field.key as keyof Responses, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-700 resize-none border-b border-gray-800 pb-2 focus:border-gray-600 transition-colors"
                      />
                    )}

                    {field.type === 'select' && (
                      <div className="grid grid-cols-1 gap-1.5">
                        {(field.options || []).map(opt => (
                          <button key={opt} onClick={() => setField(field.key as keyof Responses, opt)}
                            className="text-left px-3 py-2.5 rounded-xl text-sm transition-all"
                            style={{
                              background: value === opt ? `${sectionColor}20` : '#1A1A1A',
                              border: `1px solid ${value === opt ? sectionColor + '66' : '#2A2A2A'}`,
                              color: value === opt ? 'white' : '#6B7280',
                            }}>
                            <span className="mr-2">{value === opt ? '●' : '○'}</span>
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {field.type === 'slider' && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-gray-500 text-xs">Poca confianza</span>
                          <span className="text-2xl font-black" style={{ color: sectionColor }}>
                            {value || '5'}
                          </span>
                          <span className="text-gray-500 text-xs">Muy confiada</span>
                        </div>
                        <input
                          type="range" min="1" max="10"
                          value={value || '5'}
                          onChange={e => setField(field.key as keyof Responses, e.target.value)}
                          className="w-full accent-purple-500"
                          style={{ accentColor: sectionColor }}
                        />
                        <div className="flex justify-between text-xs text-gray-700 mt-1">
                          {[1,2,3,4,5,6,7,8,9,10].map(n => <span key={n}>{n}</span>)}
                        </div>
                      </div>
                    )}

                    {value && (
                      <div className="flex items-center gap-1 mt-2">
                        <Check size={10} style={{ color: sectionColor }} />
                        <span className="text-xs" style={{ color: sectionColor }}>Guardado</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3 pt-2 pb-8">
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all"
                  style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: '#6B7280' }}>
                  <ArrowLeft size={14} />
                  Anterior
                </button>
              )}

              <button
                onClick={() => step < 5 ? setStep(s => s + 1) : generateProfile()}
                disabled={!sectionComplete && step === 5}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                style={{ background: sectionComplete ? sectionColor : '#1E1E1E',
                  color: sectionComplete ? '#0A0A0A' : '#4B5563',
                  border: !sectionComplete ? `1px solid ${BORDER}` : 'none' }}>
                {step < 5 ? (
                  <>
                    {sectionComplete ? 'Siguiente sección' : 'Completa las preguntas'}
                    {sectionComplete && <ArrowRight size={14} />}
                  </>
                ) : (
                  <>
                    {sectionComplete ? (
                      <>🚀 Generar mi Strategic Founder Profile™</>
                    ) : 'Completa todas las preguntas'}
                  </>
                )}
              </button>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
