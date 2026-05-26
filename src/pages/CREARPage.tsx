import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { WeeklyScore } from '../types'
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'

const GOLD = '#C9A84C'
const SURFACE = '#111111'
const BORDER = '#1E1E1E'

const CREAR_META = [
  { key: 'claridad',   label: 'Claridad',   emoji: '🎯', desc: '¿Qué tan clara tienes tu oferta e identidad esta semana?' },
  { key: 'revenue',    label: 'Revenue',    emoji: '💰', desc: '¿Qué tan activa estuviste en acciones de venta y revenue?' },
  { key: 'ejecucion',  label: 'Ejecución',  emoji: '⚙️', desc: '¿Cuántos entregables y compromisos completaste?' },
  { key: 'autoridad',  label: 'Autoridad',  emoji: '📣', desc: '¿Qué tanto trabajaste tu visibilidad y posicionamiento?' },
  { key: 'relaciones', label: 'Relaciones', emoji: '🤝', desc: '¿Qué tan activa fuiste en networking y construcción de relaciones?' },
]

function scoreColor(v: number) {
  if (v >= 8) return '#4ADE80'
  if (v >= 5) return GOLD
  return '#F87171'
}

export default function CREARPage() {
  const { profile, getCurrentWeek } = useAuth()
  const week = getCurrentWeek()
  const [history, setHistory] = useState<WeeklyScore[]>([])
  const [scores, setScores] = useState<Record<string, number>>({ claridad: 5, revenue: 5, ejecucion: 5, autoridad: 5, relaciones: 5 })
  const [wins, setWins] = useState('')
  const [challenges, setChallenges] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null)

  useEffect(() => { fetchData() }, [profile?.id])

  async function fetchData() {
    if (!profile?.id) return
    const { data } = await supabase
      .from('weekly_scores')
      .select('*')
      .eq('user_id', profile.id)
      .order('week_number', { ascending: false })
    if (data) {
      setHistory(data)
      if (data.some((d: WeeklyScore) => d.week_number === week)) setAlreadyDone(true)
    }
  }

  async function handleSubmit() {
    if (!profile?.id) return
    setSubmitting(true)
    const total = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 5 * 10)
    const { error } = await supabase.from('weekly_scores').upsert({
      user_id: profile.id,
      week_number: week,
      crear_scores: scores,
      total_score: total,
      wins: wins.trim() || null,
      challenges: challenges.trim() || null,
    }, { onConflict: 'user_id,week_number' })
    if (!error) { setSubmitted(true); fetchData() }
    setSubmitting(false)
  }

  const total = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 5 * 10)

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={18} style={{ color: GOLD }} />
            <p className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>Scorecard semanal</p>
          </div>
          <h1 className="text-2xl font-bold text-white">C.R.E.A.R.</h1>
          <p className="text-gray-400 text-sm mt-1">Tu evaluación de las 5 áreas clave — Semana {week}</p>
        </motion.div>

        {/* Form this week */}
        {(submitted || alreadyDone) ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-6 mb-8 text-center"
            style={{ background: SURFACE, border: `1px solid #4ADE8044` }}
          >
            <p className="text-4xl mb-2">✅</p>
            <p className="text-white font-semibold">Semana {week} completada</p>
            <p className="text-gray-400 text-sm mt-1">
              {submitted ? 'Tu scorecard fue guardado.' : 'Ya registraste esta semana.'} ¡Sigue así!
            </p>
            {history[0] && (
              <div className="mt-4 flex justify-center gap-4">
                {CREAR_META.map(m => (
                  <div key={m.key} className="text-center">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-1"
                      style={{ background: scoreColor((history[0].crear_scores as any)[m.key]) + '22', color: scoreColor((history[0].crear_scores as any)[m.key]), border: `2px solid ${scoreColor((history[0].crear_scores as any)[m.key])}44` }}
                    >
                      {(history[0].crear_scores as any)[m.key]}
                    </div>
                    <p className="text-gray-500 text-xs">{m.label}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 mb-8"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-white font-semibold">Semana {week} — Evalúa cada área (1–10)</p>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: scoreColor(total / 10) }}>{total}%</p>
                <p className="text-gray-500 text-xs">Score total</p>
              </div>
            </div>

            <div className="space-y-6">
              {CREAR_META.map(m => (
                <div key={m.key}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">{m.emoji} {m.label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{m.desc}</p>
                    </div>
                    <span
                      className="text-xl font-bold ml-4 flex-shrink-0"
                      style={{ color: scoreColor((scores as any)[m.key]) }}
                    >
                      {(scores as any)[m.key]}
                    </span>
                  </div>
                  <input
                    type="range" min={1} max={10} step={1}
                    value={(scores as any)[m.key]}
                    onChange={e => setScores(s => ({ ...s, [m.key]: Number(e.target.value) }))}
                    className="w-full accent-yellow-400 h-2 rounded-full"
                    style={{ accentColor: scoreColor((scores as any)[m.key]) }}
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>1 — Muy bajo</span><span>10 — Excelente</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider">🏆 Win de la semana</label>
                <textarea rows={2} value={wins} onChange={e => setWins(e.target.value)}
                  placeholder="¿Cuál fue tu logro más importante esta semana?"
                  className="w-full px-3 py-2 rounded-lg text-sm text-white resize-none outline-none"
                  style={{ background: '#0A0A0A', border: `1px solid #2A2A2A` }}
                  onFocus={e => (e.target.style.borderColor = GOLD)} onBlur={e => (e.target.style.borderColor = '#2A2A2A')} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider">⚡ Desafío principal</label>
                <textarea rows={2} value={challenges} onChange={e => setChallenges(e.target.value)}
                  placeholder="¿Qué fue lo más difícil o lo que más te costó?"
                  className="w-full px-3 py-2 rounded-lg text-sm text-white resize-none outline-none"
                  style={{ background: '#0A0A0A', border: `1px solid #2A2A2A` }}
                  onFocus={e => (e.target.style.borderColor = GOLD)} onBlur={e => (e.target.style.borderColor = '#2A2A2A')} />
              </div>
            </div>

            <button
              onClick={handleSubmit} disabled={submitting}
              className="w-full py-3 rounded-xl font-semibold text-sm mt-5 transition-all disabled:opacity-50"
              style={{ background: GOLD, color: '#0A0A0A' }}
            >
              {submitting ? 'Guardando...' : 'Guardar Scorecard de la Semana'}
            </button>
          </motion.div>
        )}

        {/* History */}
        {history.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Historial</p>
            <div className="space-y-2">
              {history.map(entry => (
                <div
                  key={entry.id}
                  className="rounded-xl overflow-hidden"
                  style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
                >
                  <button
                    className="w-full px-4 py-3 flex items-center justify-between"
                    onClick={() => setExpandedWeek(expandedWeek === entry.week_number ? null : entry.week_number)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: scoreColor(entry.total_score / 10) + '22', color: scoreColor(entry.total_score / 10) }}
                      >
                        {entry.total_score}%
                      </span>
                      <span className="text-white text-sm">Semana {entry.week_number}</span>
                    </div>
                    {expandedWeek === entry.week_number ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                  </button>

                  {expandedWeek === entry.week_number && (
                    <div className="px-4 pb-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                      <div className="grid grid-cols-5 gap-2 mt-3">
                        {CREAR_META.map(m => (
                          <div key={m.key} className="text-center">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-1"
                              style={{ color: scoreColor((entry.crear_scores as any)[m.key]), border: `2px solid ${scoreColor((entry.crear_scores as any)[m.key])}44`, background: scoreColor((entry.crear_scores as any)[m.key]) + '15' }}
                            >
                              {(entry.crear_scores as any)[m.key]}
                            </div>
                            <p className="text-gray-500 text-xs">{m.label}</p>
                          </div>
                        ))}
                      </div>
                      {entry.wins && <p className="text-gray-300 text-xs mt-3"><span style={{ color: GOLD }}>Win:</span> {entry.wins}</p>}
                      {entry.challenges && <p className="text-gray-300 text-xs mt-1"><span className="text-red-400">Desafío:</span> {entry.challenges}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  )
}
