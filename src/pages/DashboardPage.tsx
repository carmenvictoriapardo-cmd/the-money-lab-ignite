import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import ClarityForm from '../components/clarity/ClarityForm'
import { ArrowRight, Flame, TrendingUp, DollarSign, Zap, Shield, Star, Target } from 'lucide-react'
import type { WeeklyScore, WeeklyStandup } from '../types'

const GOLD = '#C9A84C'
const SURFACE = '#111111'
const BORDER = '#1E1E1E'

function getMomentum(lastActivityDays: number): { label: string; icon: string; color: string } {
  if (lastActivityDays <= 2)  return { label: 'EN FUEGO',  icon: '🔥🔥🔥', color: '#EF4444' }
  if (lastActivityDays <= 4)  return { label: 'CALIENTE',  icon: '🔥🔥',   color: '#FB923C' }
  if (lastActivityDays <= 7)  return { label: 'TIBIA',     icon: '🔥',     color: GOLD }
  return                              { label: 'FRÍA',      icon: '❄️',     color: '#60A5FA' }
}

function calcIgniteScore(crear: number, identity: number, revenueHit: boolean, standupPct: number) {
  return Math.round(crear * 0.4 + identity * 0.2 + (revenueHit ? 100 : 0) * 0.3 + standupPct * 0.1)
}

interface DashData {
  latestCREAR: WeeklyScore | null
  latestStandup: WeeklyStandup | null
  revenueTotal: number
  activeBlockers: number
  lastActivityDays: number
  standupPct: number
  latestIdentityConf: number
}

export default function DashboardPage() {
  const { profile, getCurrentDay, getCurrentWeek } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  const day = getCurrentDay()
  const week = getCurrentWeek()
  const dayPct = Math.round((day / 90) * 100)

  useEffect(() => {
    if (profile?.onboarded) fetchDashData()
    else setLoading(false)
  }, [profile?.id])

  async function fetchDashData() {
    if (!profile?.id) return
    const uid = profile.id

    const [crearRes, standupRes, revenueRes, blockerRes, identityRes] = await Promise.all([
      supabase.from('weekly_scores').select('*').eq('user_id', uid).order('week_number', { ascending: false }).limit(1),
      supabase.from('weekly_standups').select('*').eq('user_id', uid).order('week_number', { ascending: false }).limit(1),
      supabase.from('revenue_events').select('amount').eq('user_id', uid),
      supabase.from('blocker_logs').select('id').eq('user_id', uid).eq('resolved', false),
      supabase.from('identity_tracker').select('confidence_level, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(1),
    ])

    const latestCREAR = crearRes.data?.[0] ?? null
    const latestStandup = standupRes.data?.[0] ?? null
    const revenueTotal = (revenueRes.data ?? []).reduce((s: number, e: any) => s + Number(e.amount), 0)
    const activeBlockers = blockerRes.data?.length ?? 0
    const latestIdentityConf = identityRes.data?.[0]?.confidence_level ?? 0

    // Days since last activity
    const dates: Date[] = []
    if (latestCREAR) dates.push(new Date(latestCREAR.created_at))
    if (latestStandup) dates.push(new Date(latestStandup.created_at))
    if (identityRes.data?.[0]) dates.push(new Date(identityRes.data[0].created_at))
    const lastDate = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : null
    const lastActivityDays = lastDate
      ? Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999

    const standupPct = week > 0 ? Math.min(100, Math.round(((latestStandup ? 1 : 0) / week) * 100)) : 0

    setData({ latestCREAR, latestStandup, revenueTotal, activeBlockers, lastActivityDays, standupPct, latestIdentityConf })
    setLoading(false)
  }

  // ── Not onboarded → show clarity form ──────────────────
  if (!profile?.onboarded) return <ClarityForm />

  // ── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <div className="w-6 h-6 rounded-full animate-spin" style={{ border: `2px solid ${GOLD}`, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const { latestCREAR, revenueTotal, activeBlockers, lastActivityDays, standupPct, latestIdentityConf } = data!
  const crearTotal = latestCREAR?.total_score ?? 0
  const igniteScore = calcIgniteScore(crearTotal, latestIdentityConf * 10, revenueTotal > 0, standupPct)
  const momentum = getMomentum(lastActivityDays)

  const quickActions = [
    { label: 'Standup semanal',    icon: Zap,        to: '/standup',  color: GOLD,      urgent: lastActivityDays > 5 },
    { label: 'C.R.E.A.R.',        icon: TrendingUp, to: '/crear',    color: '#60A5FA', urgent: crearTotal === 0 },
    { label: 'Identidad',         icon: Star,       to: '/identidad', color: '#A78BFA', urgent: latestIdentityConf === 0 },
    { label: 'Reportar bloqueo',  icon: Shield,     to: '/bloqueos', color: '#F87171', urgent: activeBlockers > 0 },
    { label: 'Strategic Review',  icon: Target,     to: '/reviews',  color: '#34D399', urgent: false },
    { label: 'Registrar revenue', icon: DollarSign, to: '/revenue',  color: '#FBBF24', urgent: revenueTotal === 0 },
  ]

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-4xl mx-auto">

        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: GOLD }}>
            THE MONEY LAB™ IGNITE
          </p>
          <h1 className="text-2xl font-bold text-white">
            Bienvenida, {profile.full_name?.split(' ')[0] || 'Igniter'} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Día <strong className="text-white">{day}</strong> de 90 · Semana <strong className="text-white">{week}</strong> de 13
          </p>
        </motion.div>

        {/* Top row: IGNITE Score + Momentum + Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

          {/* IGNITE Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
            className="rounded-2xl p-6 flex flex-col items-center justify-center text-center"
            style={{ background: SURFACE, border: `1px solid ${GOLD}44` }}
          >
            <p className="text-xs tracking-wider uppercase text-gray-400 mb-2">IGNITE Score</p>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-5xl font-bold mb-1"
              style={{ color: igniteScore >= 70 ? '#4ADE80' : igniteScore >= 40 ? GOLD : '#FB923C' }}
            >
              {igniteScore}
            </motion.p>
            <p className="text-gray-500 text-xs">/ 100</p>
          </motion.div>

          {/* Momentum */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="rounded-2xl p-6 flex flex-col items-center justify-center text-center"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs tracking-wider uppercase text-gray-400 mb-2">Momentum</p>
            <p className="text-4xl mb-1">{momentum.icon}</p>
            <p className="font-bold text-sm" style={{ color: momentum.color }}>{momentum.label}</p>
            <p className="text-gray-500 text-xs mt-1">
              {lastActivityDays <= 0 ? 'Activa hoy' : `Último registro: hace ${lastActivityDays}d`}
            </p>
          </motion.div>

          {/* Días del programa */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
            className="rounded-2xl p-6"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs tracking-wider uppercase text-gray-400 mb-3">Progreso del programa</p>
            <div className="flex items-end gap-2 mb-3">
              <p className="text-3xl font-bold text-white">{dayPct}%</p>
              <p className="text-gray-500 text-sm mb-1">completado</p>
            </div>
            <div className="h-2 rounded-full mb-2" style={{ background: '#2A2A2A' }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${dayPct}%` }} transition={{ delay: 0.4, duration: 1 }}
                className="h-2 rounded-full" style={{ background: GOLD }}
              />
            </div>
            <p className="text-gray-500 text-xs">Día {day} · {90 - day} días restantes</p>
          </motion.div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'C.R.E.A.R.', value: crearTotal > 0 ? `${crearTotal}%` : '—', icon: TrendingUp, color: '#60A5FA', to: '/crear' },
            { label: 'Revenue total', value: revenueTotal > 0 ? `$${revenueTotal.toLocaleString()}` : '$0', icon: DollarSign, color: '#FBBF24', to: '/revenue' },
            { label: 'Bloqueos activos', value: String(activeBlockers), icon: Shield, color: activeBlockers > 0 ? '#F87171' : '#4ADE80', to: '/bloqueos' },
            { label: 'Confianza identidad', value: latestIdentityConf > 0 ? `${latestIdentityConf}/10` : '—', icon: Star, color: '#A78BFA', to: '/identidad' },
          ].map(({ label, value, icon: Icon, color, to }, i) => (
            <motion.button
              key={label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
              onClick={() => navigate(to)}
              className="rounded-xl p-4 text-left hover:scale-105 transition-transform"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <Icon size={16} style={{ color }} className="mb-2" />
              <p className="font-bold text-white text-xl">{value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{label}</p>
            </motion.button>
          ))}
        </div>

        {/* El Pacto status */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="rounded-xl p-4 mb-6 flex items-center gap-3"
          style={{ background: `${GOLD}11`, border: `1px solid ${GOLD}33` }}
        >
          <Flame size={18} style={{ color: GOLD, flexShrink: 0 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: GOLD }}>El Pacto: ACTIVO</p>
            <p className="text-gray-400 text-xs">Firmado el {profile.el_pacto_signed_at ? new Date(profile.el_pacto_signed_at).toLocaleDateString('es-ES') : '—'} · Mientras ejecutes, Carmen no te suelta.</p>
          </div>
        </motion.div>

        {/* C.R.E.A.R. breakdown */}
        {latestCREAR && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="rounded-2xl p-5 mb-6"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-semibold">C.R.E.A.R. — Semana {latestCREAR.week_number}</p>
              <button onClick={() => navigate('/crear')} className="text-xs flex items-center gap-1" style={{ color: GOLD }}>
                Ver todo <ArrowRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(latestCREAR.crear_scores ?? {}).map(([k, v]) => {
                const labels: Record<string, string> = {
                  claridad: 'C', revenue: 'R', ejecucion: 'E', autoridad: 'A', relaciones: 'R2'
                }
                const fullLabels: Record<string, string> = {
                  claridad: 'Claridad', revenue: 'Revenue', ejecucion: 'Ejecución', autoridad: 'Autoridad', relaciones: 'Relaciones'
                }
                const score = v as number
                return (
                  <div key={k} className="text-center">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-1"
                      style={{
                        background: score >= 7 ? '#4ADE8022' : score >= 4 ? `${GOLD}22` : '#EF444422',
                        color: score >= 7 ? '#4ADE80' : score >= 4 ? GOLD : '#EF4444',
                        border: `2px solid ${score >= 7 ? '#4ADE8066' : score >= 4 ? `${GOLD}66` : '#EF444466'}`,
                      }}
                    >
                      {score}
                    </div>
                    <p className="text-gray-500 text-xs">{fullLabels[k] || labels[k]}</p>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Acciones rápidas</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {quickActions.map(({ label, icon: Icon, to, color, urgent }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="rounded-xl p-4 flex items-center gap-3 text-left hover:scale-105 transition-transform"
                style={{
                  background: urgent ? `${color}15` : SURFACE,
                  border: `1px solid ${urgent ? color + '44' : BORDER}`,
                }}
              >
                <Icon size={18} style={{ color, flexShrink: 0 }} />
                <span className="text-sm font-medium text-white">{label}</span>
                {urgent && <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />}
              </button>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
