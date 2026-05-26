import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { WeeklyStandup } from '../types'
import { Zap, Send, ChevronDown, ChevronUp } from 'lucide-react'

const GOLD = '#C9A84C'
const SURFACE = '#111111'
const BORDER = '#1E1E1E'

const QUESTIONS = [
  { key: 'win',              icon: '🏆', label: '¿Cuál fue tu WIN más grande esta semana?',                placeholder: 'Ej: Cerré mi primera cliente de $3k, publiqué mi oferta por primera vez...' },
  { key: 'revenue_action',   icon: '💰', label: '¿Qué acción concreta de revenue tomaste?',              placeholder: 'Ej: Mandé 5 DMs de venta, hice 2 calls de discovery, lancé mi oferta...' },
  { key: 'needs_from_carmen',icon: '🎯', label: '¿Qué necesitas de Carmen esta semana?',                 placeholder: 'Ej: Feedback sobre mi copy de ventas, ayuda con mi precio, apoyo en...' },
]

export default function StandupPage() {
  const { profile, getCurrentWeek } = useAuth()
  const week = getCurrentWeek()
  const [history, setHistory] = useState<WeeklyStandup[]>([])
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({ win: '', revenue_action: '', needs_from_carmen: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')

  useEffect(() => { fetchData() }, [profile?.id])

  async function fetchData() {
    if (!profile?.id) return
    const { data } = await supabase
      .from('weekly_standups')
      .select('*')
      .eq('user_id', profile.id)
      .order('week_number', { ascending: false })
    if (data) {
      setHistory(data)
      if (data.some((d: WeeklyStandup) => d.week_number === week)) setAlreadyDone(true)
    }
  }

  function handleNext() {
    const q = QUESTIONS[step]
    if (!inputValue.trim()) return
    const updated = { ...answers, [q.key]: inputValue.trim() }
    setAnswers(updated)
    setInputValue('')
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1)
    } else {
      handleSubmit(updated)
    }
  }

  async function handleSubmit(finalAnswers: Record<string, string>) {
    if (!profile?.id) return
    setSubmitting(true)
    const { error } = await supabase.from('weekly_standups').upsert({
      user_id: profile.id,
      week_number: week,
      win: finalAnswers.win,
      revenue_action: finalAnswers.revenue_action,
      needs_from_carmen: finalAnswers.needs_from_carmen,
    }, { onConflict: 'user_id,week_number' })
    if (!error) { setDone(true); fetchData() }
    setSubmitting(false)
  }

  if (done || alreadyDone) {
    const thisWeek = history.find(h => h.week_number === week)
    return (
      <div className="min-h-screen p-4 md:p-8" style={{ background: '#0A0A0A' }}>
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={18} style={{ color: GOLD }} />
              <p className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>Weekly Standup</p>
            </div>
            <h1 className="text-2xl font-bold text-white">Standup semanal</h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-6 mb-8"
            style={{ background: SURFACE, border: `1px solid ${GOLD}44` }}
          >
            <p className="text-2xl mb-2">⚡</p>
            <p className="text-white font-semibold mb-1">Semana {week} completada</p>
            <p className="text-gray-400 text-sm mb-4">{done ? '¡Excelente! Tu standup fue enviado.' : 'Ya hiciste tu standup esta semana.'}</p>
            {thisWeek && (
              <div className="space-y-3">
                {QUESTIONS.map(q => (
                  <div key={q.key} className="rounded-lg p-3" style={{ background: '#0A0A0A', border: `1px solid ${BORDER}` }}>
                    <p className="text-xs text-gray-500 mb-1">{q.icon} {q.label}</p>
                    <p className="text-gray-200 text-sm">{(thisWeek as any)[q.key]}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {history.length > 1 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Standups anteriores</p>
              <div className="space-y-2">
                {history.filter(h => h.week_number !== week).map(entry => (
                  <div key={entry.id} className="rounded-xl overflow-hidden" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                    <button
                      className="w-full px-4 py-3 flex items-center justify-between"
                      onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    >
                      <span className="text-white text-sm">Semana {entry.week_number}</span>
                      {expandedId === entry.id ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                    </button>
                    {expandedId === entry.id && (
                      <div className="px-4 pb-4 space-y-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                        {QUESTIONS.map(q => (
                          <div key={q.key} className="pt-2">
                            <p className="text-xs text-gray-500">{q.icon} {q.label}</p>
                            <p className="text-gray-300 text-sm mt-0.5">{(entry as any)[q.key]}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const currentQ = QUESTIONS[step]
  const isLast = step === QUESTIONS.length - 1

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col" style={{ background: '#0A0A0A' }}>
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={18} style={{ color: GOLD }} />
            <p className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>Weekly Standup — Semana {week}</p>
          </div>
          <h1 className="text-2xl font-bold text-white">Check-in semanal</h1>
          <p className="text-gray-400 text-sm mt-1">3 preguntas · ~2 minutos · Hazlo ahora.</p>
        </motion.div>

        {/* Progress dots */}
        <div className="flex gap-2 mb-8">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all"
              style={{ background: i <= step ? GOLD : '#2A2A2A' }}
            />
          ))}
        </div>

        {/* Chat UI */}
        <div className="flex-1 flex flex-col justify-end">
          <div className="space-y-4 mb-6">
            {/* Previous answered questions */}
            {QUESTIONS.slice(0, step).map((q) => (
              <div key={q.key} className="space-y-2">
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                    <p className="text-white text-sm">{q.icon} {q.label}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs" style={{ background: `${GOLD}22`, border: `1px solid ${GOLD}44` }}>
                    <p className="text-white text-sm">{answers[q.key]}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Current question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                className="flex justify-start"
              >
                <div className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                  <p className="text-xs text-gray-500 mb-1">{step + 1} de {QUESTIONS.length}</p>
                  <p className="text-white text-sm">{currentQ.icon} {currentQ.label}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Input */}
          <div className="flex gap-2 items-end">
            <textarea
              rows={3}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={currentQ.placeholder}
              className="flex-1 px-4 py-3 rounded-2xl text-sm text-white resize-none outline-none"
              style={{ background: SURFACE, border: `1px solid #2A2A2A` }}
              onFocus={e => (e.target.style.borderColor = GOLD)}
              onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleNext() } }}
            />
            <button
              onClick={handleNext}
              disabled={!inputValue.trim() || submitting}
              className="p-3 rounded-2xl transition-all disabled:opacity-40 flex-shrink-0"
              style={{ background: GOLD, color: '#0A0A0A' }}
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-gray-600 text-xs mt-2 text-center">
            {isLast ? 'Presiona Enter o → para enviar el standup' : 'Presiona Enter para siguiente pregunta'}
          </p>
        </div>

      </div>
    </div>
  )
}
