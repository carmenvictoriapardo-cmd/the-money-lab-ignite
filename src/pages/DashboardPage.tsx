import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import ClarityForm from '../components/clarity/ClarityForm'
import {
  ArrowRight, Flame, TrendingUp, DollarSign, Zap, Shield,
  Star, Target, Sparkles, Loader2, RefreshCw, BookOpen, ChevronRight,
} from 'lucide-react'
import type { WeeklyScore, WeeklyStandup, WeeklyInsight } from '../types'

const GOLD    = '#C9A84C'
const SURFACE = '#111111'
const BORDER  = '#1E1E1E'

// ─── Phases ────────────────────────────────────────────────────────────────
const PHASES = [
  { name: 'Fundación',    weeks: '1–4',  emoji: '🏗️', color: GOLD,      desc: 'Identidad, oferta y marca' },
  { name: 'Acción',       weeks: '5–9',  emoji: '⚡',  color: '#8B5CF6', desc: 'Hábitos, ventas y ejecución' },
  { name: 'Revenue',      weeks: '10–13',emoji: '💰',  color: '#10B981', desc: 'Cierra, mide y escala' },
]

function getPhase(week: number) {
  if (week <= 4) return 0
  if (week <= 9) return 1
  return 2
}

// ─── Next Step Logic ────────────────────────────────────────────────────────
interface NextStep {
  emoji: string
  label: string
  sub: string
  href: string
  color: string
  cta: string
}

function getNextStep(flags: {
  storyBrandDone: boolean
  offerDone: boolean
  identityDone: boolean
  todayActionDone: boolean
  standupThisWeek: boolean
  crearThisWeek: boolean
}): NextStep {
  if (!flags.storyBrandDone) return {
    emoji: '📖', color: GOLD,
    label: 'Define la historia de tu marca',
    sub: 'El StoryBrand es el fundamento de toda tu comunicación. Sin él, cada mensaje es un disparo al azar.',
    href: '/storybrand', cta: 'Ir al StoryBrand Builder',
  }
  if (!flags.offerDone) return {
    emoji: '💡', color: '#8B5CF6',
    label: 'Construye tu Oferta Irresistible',
    sub: 'Sin una oferta clara y poderosa, no hay ventas. La IA la construye contigo en 20 minutos.',
    href: '/oferta', cta: 'Construir mi Oferta',
  }
  if (!flags.identityDone) return {
    emoji: '⭐', color: '#A78BFA',
    label: 'Registra tu nivel de identidad',
    sub: 'Tu mentalidad define tu techo de ingresos. 2 minutos que cambian la semana.',
    href: '/identidad', cta: 'Ir a Identidad',
  }
  if (!flags.todayActionDone) return {
    emoji: '🔥', color: '#EF4444',
    label: 'Compromete tu acción de hoy',
    sub: 'El hábito más importante del programa. Un compromiso específico, cada día. 2 minutos.',
    href: '/accion', cta: 'Registrar mi acción',
  }
  if (!flags.standupThisWeek) return {
    emoji: '⚡', color: GOLD,
    label: 'Haz tu Standup de esta semana',
    sub: 'Claridad total en 3 minutos. Carmen lo lee antes de tu próxima sesión.',
    href: '/standup', cta: 'Ir al Standup',
  }
  if (!flags.crearThisWeek) return {
    emoji: '📊', color: '#60A5FA',
    label: 'Puntúa tu C.R.E.A.R. de la semana',
    sub: 'Sabes exactamente dónde estás débil — y eso es lo que cambias primero.',
    href: '/crear', cta: 'Ir al C.R.E.A.R.',
  }
  return {
    emoji: '🎭', color: '#10B981',
    label: 'Practica tu pitch de ventas',
    sub: 'Cada práctica elimina un poco más del miedo a cerrar. La IA es el prospecto más difícil.',
    href: '/roleplay', cta: 'Abrir Roleplay',
  }
}

// ─── Insight helpers ────────────────────────────────────────────────────────
function calcIgniteScore(crear: number, identity: number, revenueHit: boolean, standupPct: number) {
  return Math.round(crear * 0.4 + identity * 0.2 + (revenueHit ? 100 : 0) * 0.3 + standupPct * 0.1)
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { profile, getCurrentDay, getCurrentWeek } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading]               = useState(true)
  const [revenueTotal, setRevenueTotal]     = useState(0)
  const [activeBlockers, setActiveBlockers] = useState(0)
  const [crearTotal, setCrearTotal]         = useState(0)
  const [latestCREAR, setLatestCREAR]       = useState<WeeklyScore | null>(null)
  const [identityConf, setIdentityConf]     = useState(0)
  const [standupPct, setStandupPct]         = useState(0)
  const [dailyStreak, setDailyStreak]       = useState(0)
  const [flags, setFlags] = useState({
    storyBrandDone: false,
    offerDone: false,
    identityDone: false,
    todayActionDone: false,
    standupThisWeek: false,
    crearThisWeek: false,
  })
  const [insight, setInsight]                 = useState<WeeklyInsight | null>(null)
  const [generatingInsight, setGeneratingInsight] = useState(false)
  const [showInsight, setShowInsight]         = useState(false)

  const day  = getCurrentDay()
  const week = getCurrentWeek()
  const dayPct  = Math.round((day / 90) * 100)
  const phaseIdx = getPhase(week)

  useEffect(() => {
    if (profile?.id && profile?.onboarded) fetchAll()
  }, [profile?.id])

  async function fetchAll() {
    if (!profile?.id) return
    const uid  = profile.id
    const today = new Date().toISOString().split('T')[0]

    const [
      crearRes, standupRes, revenueRes, blockerRes,
      identityRes, insightRes, dailyRes,
      offerRes, storyRes,
    ] = await Promise.all([
      supabase.from('weekly_scores').select('*').eq('user_id', uid).order('week_number', { ascending: false }).limit(1),
      supabase.from('weekly_standups').select('week_number, created_at').eq('user_id', uid).order('week_number', { ascending: false }).limit(1),
      supabase.from('revenue_events').select('amount').eq('user_id', uid),
      supabase.from('blocker_logs').select('id').eq('user_id', uid).eq('resolved', false),
      supabase.from('identity_tracker').select('confidence_level').eq('user_id', uid).order('created_at', { ascending: false }).limit(1),
      supabase.from('weekly_insights').select('*').eq('user_id', uid).order('week_number', { ascending: false }).limit(1),
      supabase.from('daily_revenue_actions').select('action_date, completed').eq('user_id', uid).order('action_date', { ascending: false }).limit(14),
      supabase.from('offer_builder').select('one_liner').eq('user_id', uid).maybeSingle(),
      supabase.from('storybrand_scripts').select('ai_output').eq('user_id', uid).maybeSingle(),
    ])

    const latestC = crearRes.data?.[0] ?? null
    const rev     = (revenueRes.data ?? []).reduce((s: number, e: any) => s + Number(e.amount), 0)
    const blockers = blockerRes.data?.length ?? 0
    const conf     = identityRes.data?.[0]?.confidence_level ?? 0
    const latestSup = standupRes.data?.[0] ?? null

    setLatestCREAR(latestC)
    setCrearTotal(latestC?.total_score ?? 0)
    setRevenueTotal(rev)
    setActiveBlockers(blockers)
    setIdentityConf(conf)

    const supPct = week > 0 ? Math.min(100, Math.round(((latestSup ? 1 : 0) / week) * 100)) : 0
    setStandupPct(supPct)

    if (insightRes.data?.[0]) { setInsight(insightRes.data[0] as WeeklyInsight) }

    // Streak
    const daily = (dailyRes.data ?? []) as { action_date: string; completed: boolean }[]
    const todayEntry = daily.find(a => a.action_date === today)
    let streak = 0
    let checkDate = new Date(today)
    for (const a of daily.filter(x => x.completed).sort((a, b) => b.action_date.localeCompare(a.action_date))) {
      const diff = Math.round((checkDate.getTime() - new Date(a.action_date + 'T00:00:00').getTime()) / 86400000)
      if (diff === 0) { streak++; checkDate = new Date(checkDate.getTime() - 86400000) } else break
    }
    setDailyStreak(streak)

    setFlags({
      storyBrandDone: !!(storyRes.data as any)?.ai_output,
      offerDone:      !!(offerRes.data as any)?.one_liner,
      identityDone:   conf > 0,
      todayActionDone: !!(todayEntry?.completed),
      standupThisWeek: latestSup?.week_number === week,
      crearThisWeek:   latestC?.week_number === week,
    })

    setLoading(false)
  }

  async function generateInsight() {
    if (!profile?.id) return
    setGeneratingInsight(true)
    const uid = profile.id
    const payload = {
      week_number: week, day_of_program: day,
      participant_name: profile.full_name || 'Participante',
      crear_current: latestCREAR ? { ...latestCREAR.crear_scores, total: latestCREAR.total_score } : undefined,
      revenue_total: revenueTotal,
      identity_confidence: identityConf || undefined,
    }
    const { data: fnData, error: fnError } = await supabase.functions.invoke('generate-weekly-insight', { body: payload })
    if (!fnError && fnData?.insight) {
      const { data: saved } = await supabase.from('weekly_insights')
        .upsert({ user_id: uid, week_number: week, insight: fnData.insight }, { onConflict: 'user_id,week_number' })
        .select().single()
      if (saved) setInsight(saved as WeeklyInsight)
    }
    setGeneratingInsight(false)
    setShowInsight(true)
  }

  if (!profile?.onboarded) return <ClarityForm />
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <div className="w-6 h-6 rounded-full animate-spin" style={{ border: `2px solid ${GOLD}`, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  // ── PUNTO DE PARTIDA: StoryBrand no completado ───────────────────────────
  if (!flags.storyBrandDone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#0A0A0A' }}>
        <div className="max-w-lg w-full">

          {/* Animated icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="text-7xl mb-2">📖</div>
            <p className="text-xs tracking-[0.25em] uppercase font-medium" style={{ color: GOLD }}>
              Tu punto de partida
            </p>
          </motion.div>

          {/* Main message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-4">
              Antes de cualquier acción,<br />necesitas claridad.
            </h1>
            <p className="text-gray-400 leading-relaxed text-base">
              <strong style={{ color: GOLD }}>StoryBrand</strong> es el mapa de tu negocio.
              Define quién es tu cliente, qué problema resuelves y por qué
              tú eres el guía que necesitan.
            </p>
            <p className="text-gray-500 text-sm mt-3">
              Sin esta claridad, cada post, cada email y cada conversación de ventas es un disparo al azar.
            </p>
          </motion.div>

          {/* What you'll get */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl p-5 mb-6"
            style={{ background: '#111111', border: `1px solid ${GOLD}33` }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: GOLD }}>
              Al completarlo tendrás listo:
            </p>
            <div className="space-y-2">
              {[
                '🏷️ 3 taglines para tu marca (elige el mejor)',
                '💬 Tu one-liner — la presentación perfecta en 1 oración',
                '🌐 Copy listo para tu web y redes',
                '📱 Bio de Instagram optimizada',
                '🎙️ Tu pitch de 30 segundos',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-300">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-3">
              ✨ La IA te ayuda en cada campo si no sabes qué poner
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => navigate('/storybrand')}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-[1.02]"
              style={{ background: GOLD, color: '#0A0A0A' }}
            >
              <BookOpen size={20} />
              Comenzar mi StoryBrand
              <ArrowRight size={20} />
            </button>

            {/* Acción Diaria siempre disponible */}
            <div className="mt-4 text-center">
              <p className="text-gray-600 text-sm">
                La Acción Diaria también empieza desde hoy —
              </p>
              <button
                onClick={() => navigate('/accion')}
                className="mt-1 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: GOLD }}
              >
                Registra tu primera acción →
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    )
  }

  const igniteScore = calcIgniteScore(crearTotal, identityConf * 10, revenueTotal > 0, standupPct)
  const nextStep    = getNextStep(flags)
  const phase       = PHASES[phaseIdx]

  // Count completed foundation items for checklist
  const checklist = [
    { done: flags.storyBrandDone, label: 'StoryBrand definido',          href: '/storybrand' },
    { done: flags.offerDone,       label: 'Oferta Irresistible construida', href: '/oferta' },
    { done: flags.identityDone,    label: 'Identidad registrada',          href: '/identidad' },
    { done: flags.todayActionDone, label: 'Acción de hoy comprometida',    href: '/accion' },
    { done: flags.standupThisWeek, label: 'Standup de esta semana',        href: '/standup' },
    { done: flags.crearThisWeek,   label: 'C.R.E.A.R. de esta semana',    href: '/crear' },
  ]
  const checklistDone = checklist.filter(c => c.done).length

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: GOLD }}>THE MONEY LAB™ IGNITE</p>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              {profile.full_name?.split(' ')[0] || 'Igniter'} 👋
            </h1>
            <span className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: `${phase.color}22`, color: phase.color, border: `1px solid ${phase.color}44` }}>
              {phase.emoji} Fase {phaseIdx + 1}: {phase.name}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Día <strong className="text-gray-300">{day}</strong> de 90 · Semana <strong className="text-gray-300">{week}</strong> · {90 - day} días restantes</p>
        </motion.div>

        {/* ── FASE TRACKER ───────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          className="rounded-xl p-4 flex items-center gap-2"
          style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
          {PHASES.map((p, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`flex-1 flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-all ${i === phaseIdx ? 'ring-1' : ''}`}
                style={{ background: i === phaseIdx ? `${p.color}18` : 'transparent', ringColor: p.color }}>
                <span className="text-lg">{p.emoji}</span>
                <span className="text-xs font-semibold" style={{ color: i === phaseIdx ? p.color : i < phaseIdx ? '#4ADE80' : '#4B5563' }}>
                  {i < phaseIdx ? '✓ ' : ''}{p.name}
                </span>
                <span className="text-xs" style={{ color: i === phaseIdx ? p.color : '#4B5563' }}>Sem {p.weeks}</span>
              </div>
              {i < PHASES.length - 1 && (
                <ChevronRight size={14} className="flex-shrink-0 mx-1" style={{ color: i < phaseIdx ? '#4ADE80' : '#2A2A2A' }} />
              )}
            </div>
          ))}
        </motion.div>

        {/* ── PRÓXIMO PASO (hero card) ────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">📍 Tu próximo paso</p>
          <button
            onClick={() => navigate(nextStep.href)}
            className="w-full text-left rounded-2xl p-5 transition-all hover:scale-[1.01] group"
            style={{ background: `${nextStep.color}14`, border: `2px solid ${nextStep.color}55` }}
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl">{nextStep.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-lg leading-tight">{nextStep.label}</p>
                <p className="text-gray-400 text-sm mt-1 leading-relaxed">{nextStep.sub}</p>
                <div className="flex items-center gap-1.5 mt-3">
                  <span className="text-sm font-semibold" style={{ color: nextStep.color }}>{nextStep.cta}</span>
                  <ArrowRight size={14} style={{ color: nextStep.color }} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </button>
        </motion.div>

        {/* ── CHECKLIST DE HÁBITOS ───────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="rounded-2xl p-5"
          style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-semibold text-sm">Tu camino esta semana</p>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: checklistDone === checklist.length ? '#4ADE8022' : `${GOLD}22`, color: checklistDone === checklist.length ? '#4ADE80' : GOLD }}>
              {checklistDone}/{checklist.length} completados
            </span>
          </div>
          <div className="space-y-2">
            {checklist.map((item, i) => (
              <button key={i} onClick={() => !item.done && navigate(item.href)}
                className="w-full flex items-center gap-3 text-left transition-all rounded-lg px-2 py-2 hover:bg-white/5"
                style={{ cursor: item.done ? 'default' : 'pointer' }}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all`}
                  style={{
                    background: item.done ? '#4ADE8022' : '#2A2A2A',
                    border: `1.5px solid ${item.done ? '#4ADE80' : '#3A3A3A'}`,
                    color: item.done ? '#4ADE80' : '#6B7280',
                  }}>
                  {item.done ? '✓' : i + 1}
                </div>
                <span className="text-sm flex-1" style={{ color: item.done ? '#6B7280' : '#E5E7EB', textDecoration: item.done ? 'line-through' : 'none' }}>
                  {item.label}
                </span>
                {!item.done && <ChevronRight size={14} className="text-gray-600 flex-shrink-0" />}
              </button>
            ))}
          </div>

          {/* Daily streak */}
          {dailyStreak > 0 && (
            <div className="mt-4 pt-3 flex items-center gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <span className="text-base">{dailyStreak >= 14 ? '🔥🔥' : dailyStreak >= 7 ? '🔥' : '⚡'}</span>
              <p className="text-xs text-gray-400">
                <strong className="text-white">{dailyStreak} días</strong> de racha consecutiva
                {dailyStreak >= 7 && <span style={{ color: GOLD }}> — ¡Élite!</span>}
              </p>
            </div>
          )}
        </motion.div>

        {/* ── STATS COMPACTAS ────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'IGNITE Score', value: String(igniteScore), sub: '/ 100', color: igniteScore >= 70 ? '#4ADE80' : igniteScore >= 40 ? GOLD : '#FB923C', to: '/crear' },
            { label: 'Revenue', value: revenueTotal > 0 ? `$${revenueTotal.toLocaleString()}` : '$0', sub: 'total', color: revenueTotal > 0 ? '#4ADE80' : '#6B7280', to: '/revenue' },
            { label: 'C.R.E.A.R.', value: crearTotal > 0 ? `${crearTotal}%` : '—', sub: 'sem ' + week, color: '#60A5FA', to: '/crear' },
            { label: 'Bloqueos', value: String(activeBlockers), sub: activeBlockers > 0 ? 'activos' : 'sin bloqueos', color: activeBlockers > 0 ? '#F87171' : '#4ADE80', to: '/bloqueos' },
          ].map(({ label, value, sub, color, to }, i) => (
            <button key={label} onClick={() => navigate(to)}
              className="rounded-xl p-4 text-left hover:scale-105 transition-transform"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-gray-500 text-xs">{sub}</p>
              <p className="text-gray-600 text-xs mt-1">{label}</p>
            </button>
          ))}
        </motion.div>

        {/* ── ANÁLISIS SEMANAL IA ─────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0d0d1f 0%, #1a1030 100%)', border: '1px solid #7C3AED44' }}>
          <button
            className="w-full flex items-center justify-between px-5 py-4"
            onClick={() => setShowInsight(s => !s)}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: '#A78BFA' }} />
              <p className="text-sm font-semibold" style={{ color: '#A78BFA' }}>
                Análisis IA — Semana {week}
              </p>
              {insight && <span className="text-xs text-gray-600">· listo</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); generateInsight() }}
                disabled={generatingInsight}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                style={{ background: '#7C3AED22', color: '#A78BFA', border: '1px solid #7C3AED44' }}
              >
                {generatingInsight ? <Loader2 size={11} className="animate-spin" /> : insight ? <RefreshCw size={11} /> : <Sparkles size={11} />}
                {generatingInsight ? 'Analizando...' : insight ? 'Regenerar' : 'Generar'}
              </button>
              <ChevronRight size={14} className="text-gray-600 transition-transform" style={{ transform: showInsight ? 'rotate(90deg)' : 'none' }} />
            </div>
          </button>

          <AnimatePresence>
            {showInsight && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5">
                  {generatingInsight ? (
                    <div className="space-y-2">
                      {[90, 70, 85, 60].map((w, i) => (
                        <motion.div key={i} className="h-2 rounded-full"
                          style={{ background: '#7C3AED22', width: `${w}%` }}
                          animate={{ opacity: [0.3, 0.8, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }} />
                      ))}
                    </div>
                  ) : insight ? (
                    <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{insight.insight}</p>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">
                      Completa tu Standup o C.R.E.A.R. de la semana y luego genera tu análisis.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Padding bottom mobile */}
        <div className="h-4" />
      </div>
    </div>
  )
}
