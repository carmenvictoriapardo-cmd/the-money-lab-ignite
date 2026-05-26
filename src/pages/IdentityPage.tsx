import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { IdentityEntry } from '../types'
import { Star } from 'lucide-react'

const GOLD = '#C9A84C'
const SURFACE = '#111111'
const BORDER = '#1E1E1E'

export default function IdentityPage() {
  const { profile, getCurrentWeek } = useAuth()
  const week = getCurrentWeek()
  const [history, setHistory] = useState<IdentityEntry[]>([])
  const [affirmation, setAffirmation] = useState('')
  const [evidence, setEvidence] = useState('')
  const [confidence, setConfidence] = useState(7)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)

  useEffect(() => { fetchData() }, [profile?.id])

  async function fetchData() {
    if (!profile?.id) return
    const { data } = await supabase
      .from('identity_tracker')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    if (data) {
      setHistory(data)
      if (data.some((d: IdentityEntry) => d.week_number === week)) setAlreadyDone(true)
    }
  }

  async function handleSubmit() {
    if (!profile?.id || !affirmation.trim() || !evidence.trim()) return
    setSubmitting(true)
    const { error } = await supabase.from('identity_tracker').insert({
      user_id: profile.id,
      week_number: week,
      affirmation: affirmation.trim(),
      evidence: evidence.trim(),
      confidence_level: confidence,
    })
    if (!error) { setSubmitted(true); fetchData() }
    setSubmitting(false)
  }

  function confColor(v: number) {
    if (v >= 8) return '#4ADE80'
    if (v >= 5) return GOLD
    return '#F87171'
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Star size={18} style={{ color: GOLD }} />
            <p className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>Identity Tracker™</p>
          </div>
          <h1 className="text-2xl font-bold text-white">¿Quién estás siendo?</h1>
          <p className="text-gray-400 text-sm mt-1">La identidad precede a los resultados. Regístrala cada semana.</p>
        </motion.div>

        {/* This week */}
        {(submitted || alreadyDone) ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-6 mb-8"
            style={{ background: SURFACE, border: `1px solid #A78BFA44` }}
          >
            <p className="text-white font-semibold mb-1">✅ Semana {week} registrada</p>
            <p className="text-gray-400 text-sm mb-4">{submitted ? '¡Tu identidad fue guardada!' : 'Ya registraste esta semana.'}</p>
            {history[0] && (
              <div className="space-y-2">
                <p className="text-gray-300 text-sm"><span style={{ color: '#A78BFA' }}>Soy:</span> {history[0].affirmation}</p>
                <p className="text-gray-300 text-sm"><span style={{ color: GOLD }}>Evidencia:</span> {history[0].evidence}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-500 text-xs">Confianza:</span>
                  <span className="font-bold text-sm" style={{ color: confColor(history[0].confidence_level) }}>
                    {history[0].confidence_level}/10
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 mb-8"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <p className="text-white font-semibold mb-1">Semana {week}</p>
            <p className="text-gray-400 text-sm mb-6">Define tu identidad esta semana con evidencia concreta.</p>

            <div className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-wider block mb-2" style={{ color: '#A78BFA' }}>
                  ★ Soy / Me identifico como...
                </label>
                <textarea
                  rows={3} value={affirmation} onChange={e => setAffirmation(e.target.value)}
                  placeholder='Ej: "Soy una CEO que cierra clientes de alto valor con confianza..."'
                  className="w-full px-4 py-3 rounded-xl text-sm text-white resize-none outline-none"
                  style={{ background: '#0A0A0A', border: `1px solid #2A2A2A` }}
                  onFocus={e => (e.target.style.borderColor = '#A78BFA')}
                  onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider block mb-2" style={{ color: GOLD }}>
                  📎 La evidencia de esta semana es...
                </label>
                <textarea
                  rows={3} value={evidence} onChange={e => setEvidence(e.target.value)}
                  placeholder='Ej: "Esta semana hice 3 calls de ventas, enviaron un testimonio espontáneo, subí mi precio..."'
                  className="w-full px-4 py-3 rounded-xl text-sm text-white resize-none outline-none"
                  style={{ background: '#0A0A0A', border: `1px solid #2A2A2A` }}
                  onFocus={e => (e.target.style.borderColor = GOLD)}
                  onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider" style={{ color: confColor(confidence) }}>
                    Nivel de confianza en esta identidad
                  </label>
                  <span className="font-bold text-lg" style={{ color: confColor(confidence) }}>{confidence}/10</span>
                </div>
                <input
                  type="range" min={1} max={10} step={1} value={confidence}
                  onChange={e => setConfidence(Number(e.target.value))}
                  className="w-full h-2 rounded-full"
                  style={{ accentColor: confColor(confidence) }}
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>1 — Todavía lo proceso</span><span>10 — Lo vivo completamente</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !affirmation.trim() || !evidence.trim()}
              className="w-full py-3 rounded-xl font-semibold text-sm mt-5 disabled:opacity-40 transition-all"
              style={{ background: GOLD, color: '#0A0A0A' }}
            >
              {submitting ? 'Guardando...' : 'Registrar mi identidad esta semana'}
            </button>
          </motion.div>
        )}

        {/* History */}
        {history.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Tu historial de identidad</p>
            <div className="space-y-3">
              {history.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-xl p-4"
                  style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Semana {entry.week_number}</span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: confColor(entry.confidence_level) + '22', color: confColor(entry.confidence_level) }}
                    >
                      {entry.confidence_level}/10
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium mb-1">"{entry.affirmation}"</p>
                  <p className="text-gray-400 text-xs">{entry.evidence}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {history.length === 0 && (submitted || alreadyDone) && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Tu primera entrada de identidad aparecerá aquí.</p>
          </div>
        )}

      </div>
    </div>
  )
}
