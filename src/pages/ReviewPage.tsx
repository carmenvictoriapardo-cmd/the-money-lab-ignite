import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { StrategicReview } from '../types'
import { Target, Plus, X, Trophy, AlertTriangle, HelpCircle } from 'lucide-react'

const GOLD = '#C9A84C'
const SURFACE = '#111111'
const BORDER = '#1E1E1E'

const REVIEW_TYPES = [
  { key: 'win',       label: 'Win',       emoji: '🏆', icon: Trophy,       color: '#4ADE80',
    desc: 'Comparte un logro, avance, o resultado que quieres que Carmen reconozca y amplíe.' },
  { key: 'challenge', label: 'Desafío',   emoji: '⚡', icon: AlertTriangle, color: '#FB923C',
    desc: 'Describe un obstáculo, situación difícil, o área donde no estás avanzando como quisieras.' },
  { key: 'ask',       label: 'Pregunta',  emoji: '🎯', icon: HelpCircle,   color: GOLD,
    desc: 'Haz una pregunta estratégica directa a Carmen. Sé específica sobre qué necesitas.' },
]

export default function ReviewPage() {
  const { profile, getCurrentWeek } = useAuth()
  const week = getCurrentWeek()
  const [reviews, setReviews] = useState<StrategicReview[]>([])
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState<'win' | 'challenge' | 'ask'>('win')
  const [context, setContext] = useState('')
  const [evidence, setEvidence] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [profile?.id])

  async function fetchData() {
    if (!profile?.id) return
    const { data } = await supabase
      .from('strategic_reviews')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    if (data) setReviews(data)
  }

  async function handleSubmit() {
    if (!profile?.id || !context.trim()) return
    setSubmitting(true)
    await supabase.from('strategic_reviews').insert({
      user_id: profile.id,
      week_number: week,
      type,
      context: context.trim(),
      evidence: evidence.trim(),
    })
    setShowForm(false)
    setContext('')
    setEvidence('')
    fetchData()
    setSubmitting(false)
  }

  const typeMeta = (t: string) => REVIEW_TYPES.find(r => r.key === t) ?? REVIEW_TYPES[0]

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Target size={18} style={{ color: GOLD }} />
            <p className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>Strategic Review</p>
          </div>
          <h1 className="text-2xl font-bold text-white">Reviews con Carmen</h1>
          <p className="text-gray-400 text-sm mt-1">Comparte wins, desafíos y preguntas directamente con Carmen. Responde en 48h.</p>
        </motion.div>

        {/* CTA */}
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl font-semibold text-sm mb-6 flex items-center justify-center gap-2 hover:opacity-90 transition-all"
          style={{ background: GOLD, color: '#0A0A0A' }}
        >
          <Plus size={18} />
          Enviar nuevo review
        </button>

        {/* Form modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-end md:items-center justify-center p-4 z-50"
              style={{ background: 'rgba(0,0,0,0.85)' }}
              onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                className="w-full max-w-lg rounded-2xl p-6"
                style={{ background: '#1A1A1A', border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-center justify-between mb-5">
                  <p className="text-white font-semibold">Nuevo Strategic Review</p>
                  <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
                </div>

                {/* Type selector */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {REVIEW_TYPES.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setType(t.key as any)}
                      className="rounded-xl p-3 text-center transition-all"
                      style={{
                        background: type === t.key ? `${t.color}22` : '#0A0A0A',
                        border: `1px solid ${type === t.key ? t.color + '66' : '#2A2A2A'}`,
                        color: type === t.key ? t.color : '#aaa',
                      }}
                    >
                      <p className="text-xl mb-1">{t.emoji}</p>
                      <p className="text-xs font-medium">{t.label}</p>
                    </button>
                  ))}
                </div>

                <div
                  className="rounded-lg p-3 mb-4 text-xs"
                  style={{ background: `${typeMeta(type).color}11`, color: typeMeta(type).color, border: `1px solid ${typeMeta(type).color}33` }}
                >
                  {typeMeta(type).desc}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider">
                      Contexto — cuéntame qué está pasando
                    </label>
                    <textarea
                      rows={3} value={context} onChange={e => setContext(e.target.value)}
                      placeholder="Sé específica. Incluye números, fechas, y detalles relevantes..."
                      className="w-full px-3 py-2 rounded-lg text-sm text-white resize-none outline-none"
                      style={{ background: '#0A0A0A', border: `1px solid #2A2A2A` }}
                      onFocus={e => (e.target.style.borderColor = GOLD)} onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider">
                      Evidencia / Lo que ya hiciste (opcional)
                    </label>
                    <textarea
                      rows={2} value={evidence} onChange={e => setEvidence(e.target.value)}
                      placeholder="¿Qué acciones ya tomaste? ¿Qué datos tienes?"
                      className="w-full px-3 py-2 rounded-lg text-sm text-white resize-none outline-none"
                      style={{ background: '#0A0A0A', border: `1px solid #2A2A2A` }}
                      onFocus={e => (e.target.style.borderColor = GOLD)} onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!context.trim() || submitting}
                  className="w-full py-3 rounded-xl font-semibold text-sm mt-4 disabled:opacity-40 transition-all"
                  style={{ background: GOLD, color: '#0A0A0A' }}
                >
                  {submitting ? 'Enviando...' : 'Enviar a Carmen'}
                </button>
                <p className="text-gray-500 text-xs text-center mt-2">Carmen responderá en las próximas 48 horas.</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reviews list */}
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-white font-medium mb-1">Sin reviews todavía</p>
            <p className="text-gray-500 text-sm">Comparte tu primer win, desafío o pregunta con Carmen.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r, i) => {
              const meta = typeMeta(r.type)
              const hasResponse = !!r.carmen_response
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="rounded-xl overflow-hidden"
                  style={{ background: SURFACE, border: `1px solid ${hasResponse ? meta.color + '33' : BORDER}` }}
                >
                  <button
                    className="w-full px-4 py-4 flex items-start justify-between text-left"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: meta.color + '22', color: meta.color }}>
                          {meta.emoji} {meta.label}
                        </span>
                        <span className="text-xs text-gray-500">Sem. {r.week_number}</span>
                        {hasResponse && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#4ADE8022', color: '#4ADE80' }}>
                            ✓ Respondido
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm line-clamp-2">{r.context}</p>
                    </div>
                    <span className="text-gray-500 text-xs flex-shrink-0 mt-1">
                      {expandedId === r.id ? '▲' : '▼'}
                    </span>
                  </button>

                  <AnimatePresence>
                    {expandedId === r.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        style={{ borderTop: `1px solid ${BORDER}` }}
                      >
                        <div className="px-4 py-4 space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Tu contexto:</p>
                            <p className="text-gray-300 text-sm">{r.context}</p>
                          </div>
                          {r.evidence && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Tu evidencia:</p>
                              <p className="text-gray-300 text-sm">{r.evidence}</p>
                            </div>
                          )}
                          {hasResponse ? (
                            <div className="rounded-xl p-4" style={{ background: `${meta.color}11`, border: `1px solid ${meta.color}33` }}>
                              <p className="text-xs font-semibold mb-2" style={{ color: meta.color }}>Respuesta de Carmen:</p>
                              {r.video_url && (
                                <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-black">
                                  <iframe src={r.video_url} className="w-full h-full" allowFullScreen />
                                </div>
                              )}
                              {r.carmen_response && (
                                <p className="text-gray-200 text-sm leading-relaxed">{r.carmen_response}</p>
                              )}
                            </div>
                          ) : (
                            <div className="rounded-lg p-3 text-center" style={{ background: '#0A0A0A', border: `1px solid #2A2A2A` }}>
                              <p className="text-gray-500 text-xs">⏳ Pendiente de respuesta — Carmen responde en 48h</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
