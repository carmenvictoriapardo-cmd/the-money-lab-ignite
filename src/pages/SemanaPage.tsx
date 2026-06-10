import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { CURRICULUM, CREAR_PHASES, SESSION_TYPES, getCurriculumWeek } from '../data/curriculum'
import { ArrowRight, Check, ChevronRight, Trophy } from 'lucide-react'

const GOLD    = '#C9A84C'
const BG      = '#0A0A0A'
const SURFACE = '#111111'
const BORDER  = '#1E1E1E'

interface WeekStatus {
  identityDone:     boolean
  activeBlockers:   number
  standupDone:      boolean
  reviewDone:       boolean
  todayActionDone:  boolean
}

export default function SemanaPage() {
  const { profile, getCurrentWeek, getCurrentDay } = useAuth()
  const navigate  = useNavigate()
  const week      = Math.min(Math.max(getCurrentWeek(), 1), 12)
  const day       = getCurrentDay()

  const [loading, setLoading]   = useState(true)
  const [status, setStatus]     = useState<WeekStatus>({
    identityDone: false, activeBlockers: 0,
    standupDone: false, reviewDone: false, todayActionDone: false,
  })

  const currWeek    = getCurriculumWeek(week)
  const phase       = CREAR_PHASES[currWeek.phase]
  const sessionType = SESSION_TYPES[currWeek.secondary.type]

  useEffect(() => { if (profile?.id) fetchStatus() }, [profile?.id, week])

  async function fetchStatus() {
    if (!profile?.id) return
    const uid   = profile.id
    const today = new Date().toISOString().split('T')[0]

    const [identityRes, standupRes, reviewRes, blockerRes, dailyRes] = await Promise.all([
      supabase.from('identity_tracker')
        .select('id').eq('user_id', uid)
        .order('created_at', { ascending: false }).limit(1),
      supabase.from('weekly_standups')
        .select('id').eq('user_id', uid).eq('week_number', week).limit(1),
      supabase.from('reviews')
        .select('id').eq('user_id', uid).eq('week_number', week).limit(1),
      supabase.from('blocker_logs')
        .select('id').eq('user_id', uid).eq('resolved', false),
      supabase.from('daily_revenue_actions')
        .select('completed').eq('user_id', uid).eq('action_date', today).limit(1),
    ])

    // Check identity done this week
    const latestIdentity = identityRes.data?.[0]
    let identityThisWeek = false
    if (latestIdentity && profile.program_start) {
      // Simple check: any identity entry in the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
      const { data: recentIdentity } = await supabase
        .from('identity_tracker').select('id').eq('user_id', uid)
        .gte('created_at', sevenDaysAgo).limit(1)
      identityThisWeek = (recentIdentity?.length ?? 0) > 0
    }

    setStatus({
      identityDone:    identityThisWeek,
      activeBlockers:  blockerRes.data?.length ?? 0,
      standupDone:     (standupRes.data?.length ?? 0) > 0,
      reviewDone:      (reviewRes.data?.length ?? 0) > 0,
      todayActionDone: !!(dailyRes.data?.[0]?.completed),
    })
    setLoading(false)
  }

  const activities = [
    {
      key: 'identity', emoji: '⭐',
      label: 'Identidad de la semana',
      sub: 'Tu nivel de confianza e identidad como fundadora',
      done: status.identityDone, href: '/identidad', color: '#A78BFA',
    },
    {
      key: 'bloqueos', emoji: status.activeBlockers > 0 ? '⚠️' : '🛡️',
      label: 'Bloqueos',
      sub: status.activeBlockers > 0
        ? `${status.activeBlockers} bloqueo${status.activeBlockers > 1 ? 's' : ''} activo${status.activeBlockers > 1 ? 's' : ''} — requiere atención`
        : 'Sin bloqueos activos esta semana',
      done: status.activeBlockers === 0, href: '/bloqueos',
      color: status.activeBlockers > 0 ? '#EF4444' : '#4ADE80',
    },
    {
      key: 'standup', emoji: '⚡',
      label: 'Mis Avances — Standup',
      sub: 'Reporta qué hiciste, qué sigue y qué necesitas',
      done: status.standupDone, href: '/standup', color: GOLD,
    },
    {
      key: 'review', emoji: '🔍',
      label: 'Submit Review',
      sub: 'La IA hace el primer análisis — luego Carmen revisa',
      done: status.reviewDone, href: '/reviews', color: '#60A5FA',
    },
  ]

  const activitiesDone = activities.filter(a => a.done).length

  // Phase progress: how many C.R.E.A.R. phases completed
  const phaseOrder = ['C', 'R', 'E', 'A', 'R2']
  const currentPhaseIdx = phaseOrder.indexOf(currWeek.phase)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="w-6 h-6 rounded-full animate-spin" style={{ border: `2px solid ${GOLD}`, borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: BG }}>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* ── HEADER ────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: `${phase.color}22`, color: phase.color, border: `1px solid ${phase.color}44` }}>
              {phase.letter} — {phase.name}
            </span>
            <span className="text-gray-600 text-xs">·</span>
            <span className="text-gray-500 text-xs">Semana {week} de 12</span>
            <span className="text-gray-600 text-xs">·</span>
            <span className="text-gray-500 text-xs">Día {day}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Esta Semana</h1>
          <p className="text-sm mt-0.5" style={{ color: activitiesDone === 4 ? '#4ADE80' : '#6B7280' }}>
            {activitiesDone}/4 actividades completadas
            {activitiesDone === 4 && ' 🎉 ¡Semana completa!'}
          </p>
        </motion.div>

        {/* ── C.R.E.A.R. PHASE TRACKER ──────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.04 }}
          className="rounded-xl p-3 flex items-center gap-1"
          style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
          {phaseOrder.map((ph, i) => {
            const p = CREAR_PHASES[ph]
            const isActive = i === currentPhaseIdx
            const isDone   = i < currentPhaseIdx
            return (
              <div key={ph} className="flex items-center flex-1">
                <div className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg transition-all ${isActive ? 'ring-1' : ''}`}
                  style={{ background: isActive ? `${p.color}18` : 'transparent', ringColor: p.color }}>
                  <span className="text-sm font-black"
                    style={{ color: isActive ? p.color : isDone ? '#4ADE80' : '#3A3A3A' }}>
                    {isDone ? '✓' : p.letter}
                  </span>
                  <span className="text-xs font-medium hidden sm:block"
                    style={{ color: isActive ? p.color : isDone ? '#4ADE8088' : '#3A3A3A' }}>
                    {p.name}
                  </span>
                </div>
                {i < phaseOrder.length - 1 && (
                  <div className="w-3 flex-shrink-0 flex items-center justify-center">
                    <div className="h-px w-full" style={{ background: i < currentPhaseIdx ? '#4ADE8066' : '#2A2A2A' }} />
                  </div>
                )}
              </div>
            )
          })}
        </motion.div>

        {/* ── SESSIONS GRID ─────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Main Session */}
          <button
            onClick={() => navigate(currWeek.main.href)}
            className="text-left rounded-2xl p-5 transition-all hover:scale-[1.01] group"
            style={{ background: `${phase.color}12`, border: `2px solid ${phase.color}55` }}
          >
            <div className="mb-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${phase.color}22`, color: phase.color }}>
                DÍA 1 · SESIÓN PRINCIPAL
              </span>
            </div>
            <div className="text-3xl mb-2">{currWeek.main.emoji}</div>
            <h3 className="text-white font-bold text-base mb-1 leading-tight">{currWeek.main.title}</h3>
            <p className="text-gray-400 text-xs leading-relaxed mb-3">{currWeek.main.desc}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold" style={{ color: phase.color }}>Ir al tema</span>
              <ArrowRight size={12} style={{ color: phase.color }}
                className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Secondary Session */}
          <div className="rounded-2xl p-5"
            style={{ background: SURFACE, border: `1px solid ${sessionType.color}33` }}>
            <div className="mb-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${sessionType.color}22`, color: sessionType.color }}>
                {sessionType.emoji} {sessionType.label}
              </span>
            </div>
            <div className="text-3xl mb-2">
              {currWeek.secondary.type === 'advisory' ? '🎙️' :
               currWeek.secondary.type === 'hotseat'  ? '🔥' : '⚔️'}
            </div>
            <h3 className="text-white font-bold text-base mb-1 leading-tight">
              {currWeek.secondary.title}
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed">{currWeek.secondary.desc}</p>
          </div>
        </motion.div>

        {/* ── WEEKLY ACTIVITIES ─────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="rounded-2xl p-5"
          style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Actividades de la semana</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: activitiesDone === 4 ? '#4ADE8022' : `${GOLD}22`,
                color: activitiesDone === 4 ? '#4ADE80' : GOLD,
              }}>
              {activitiesDone}/4
            </span>
          </div>

          <div className="space-y-1.5">
            {activities.map(act => (
              <button key={act.key} onClick={() => navigate(act.href)}
                className="w-full flex items-center gap-3 text-left transition-all rounded-xl px-3 py-3 hover:bg-white/5 group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg transition-all"
                  style={{
                    background: act.done ? '#4ADE8015' : '#1E1E1E',
                    border: `1.5px solid ${act.done ? '#4ADE8066' : '#2A2A2A'}`,
                  }}>
                  {act.done ? <Check size={15} color="#4ADE80" /> : act.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium"
                    style={{ color: act.done ? '#4B5563' : '#E5E7EB', textDecoration: act.done ? 'line-through' : 'none' }}>
                    {act.label}
                  </p>
                  <p className="text-xs"
                    style={{ color: !act.done && act.key === 'bloqueos' && status.activeBlockers > 0 ? '#EF4444' : '#4B5563' }}>
                    {act.sub}
                  </p>
                </div>
                {!act.done && (
                  <ChevronRight size={14} className="text-gray-700 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── ACCIÓN DIARIA (siempre activa) ────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
          <button onClick={() => navigate('/accion')}
            className="w-full text-left rounded-2xl p-4 flex items-center gap-3 transition-all hover:scale-[1.01] group"
            style={{
              background: status.todayActionDone ? '#4ADE8011' : '#1A0A0A',
              border: `1.5px solid ${status.todayActionDone ? '#4ADE8055' : '#EF444433'}`,
            }}>
            <div className="text-2xl flex-shrink-0">
              {status.todayActionDone ? '✅' : '🔥'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold"
                style={{ color: status.todayActionDone ? '#4ADE80' : '#EF4444' }}>
                {status.todayActionDone ? 'Acción de hoy — Completada ✓' : 'Acción de hoy — Pendiente'}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Tu compromiso diario · Semanas 1 → 12 · Todos los días
              </p>
            </div>
            {!status.todayActionDone && (
              <ArrowRight size={16} style={{ color: '#EF4444' }}
                className="group-hover:translate-x-1 transition-transform flex-shrink-0" />
            )}
          </button>
        </motion.div>

        {/* ── PRÓXIMAS SEMANAS (mini preview) ───────────────── */}
        {week < 12 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}>
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Próximas semanas</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CURRICULUM.filter(c => c.week > week && c.week <= week + 3).map(c => {
                const p = CREAR_PHASES[c.phase]
                return (
                  <div key={c.week} className="flex-shrink-0 rounded-xl px-3 py-2.5 min-w-[140px]"
                    style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                    <span className="text-xs font-semibold" style={{ color: p.color }}>
                      Sem {c.week} — {p.letter}
                    </span>
                    <p className="text-gray-400 text-xs mt-1 leading-tight line-clamp-2">{c.main.title}</p>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
