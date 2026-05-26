import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { CLARITY_QUESTIONS, SECTIONS, calculateClarityScore, type ScoreBreakdown } from '../../lib/clarityQuestions'
import { useAuth } from '../../hooks/useAuth'
import ClarityResult from './ClarityResult'

const GOLD = '#C9A84C'
const SURFACE = '#1A1A1A'
const BORDER = '#2A2A2A'

export default function ClarityForm() {
  const { profile } = useAuth()
  const [currentSection, setCurrentSection] = useState(0)
  const [responses, setResponses] = useState<Record<string, string | number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ total: number; breakdown: ScoreBreakdown } | null>(null)

  const sectionKey = SECTIONS[currentSection].key
  const sectionQuestions = CLARITY_QUESTIONS.filter(q => q.sectionKey === sectionKey)
  const totalSections = SECTIONS.length

  function setResponse(id: string, value: string | number) {
    setResponses(prev => ({ ...prev, [id]: value }))
  }

  function canAdvance() {
    return sectionQuestions.every(q => {
      const r = responses[q.id]
      return r !== undefined && r !== ''
    })
  }

  async function handleSubmit() {
    setSubmitting(true)
    const { total, breakdown } = calculateClarityScore(responses)

    const { error } = await supabase.from('clarity_responses').insert({
      user_id: profile?.id,
      clarity_score: total,
      score_breakdown: breakdown,
      responses,
    })

    if (!error) {
      setResult({ total, breakdown })
      setSubmitted(true)
    }
    setSubmitting(false)
  }

  if (submitted && result) {
    return <ClarityResult score={result.total} breakdown={result.breakdown} name={profile?.full_name || ''} />
  }

  const progress = ((currentSection) / totalSections) * 100

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: '#0A0A0A' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: GOLD }}>
            Formulario de Claridad Pre-Programa
          </p>
          <h1 className="text-2xl font-bold text-white">THE MONEY LAB™ IGNITE</h1>
          <p className="text-gray-400 text-sm mt-1">
            Sección {currentSection + 1} de {totalSections}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8 rounded-full h-1" style={{ background: BORDER }}>
          <div
            className="h-1 rounded-full transition-all duration-500"
            style={{ width: `${progress + (1 / totalSections) * 100}%`, background: GOLD }}
          />
        </div>

        {/* Section nav */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {SECTIONS.map((s, i) => (
            <button
              key={s.key}
              disabled={i > currentSection}
              onClick={() => i <= currentSection && setCurrentSection(i)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: i === currentSection ? GOLD : i < currentSection ? '#2A2A2A' : '#111',
                color: i === currentSection ? '#0A0A0A' : i < currentSection ? GOLD : '#555',
                border: `1px solid ${i < currentSection ? GOLD + '44' : BORDER}`,
              }}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Questions */}
        <div className="rounded-2xl p-6 space-y-8" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
          <h2 className="text-lg font-semibold text-white">
            {SECTIONS[currentSection].icon} {SECTIONS[currentSection].label}
          </h2>

          {sectionQuestions.map((q, idx) => (
            <div key={q.id}>
              <label className="block text-sm text-gray-200 mb-3">
                <span className="text-xs font-medium mr-2 px-2 py-0.5 rounded" style={{ background: GOLD + '22', color: GOLD }}>
                  {idx + 1}
                </span>
                {q.text}
              </label>

              {q.type === 'scale' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <button
                        key={n}
                        onClick={() => setResponse(q.id, n)}
                        className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: responses[q.id] === n ? GOLD : '#111',
                          color: responses[q.id] === n ? '#0A0A0A' : '#666',
                          border: `1px solid ${responses[q.id] === n ? GOLD : BORDER}`,
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 = Nada claro</span>
                    <span>10 = Completamente claro</span>
                  </div>
                </div>
              )}

              {q.type === 'text' && (
                <textarea
                  rows={3}
                  value={String(responses[q.id] || '')}
                  onChange={e => setResponse(q.id, e.target.value)}
                  placeholder="Escribe tu respuesta aquí..."
                  className="w-full px-4 py-3 rounded-lg text-sm text-white resize-none outline-none transition-colors"
                  style={{ background: '#111', border: `1px solid ${BORDER}`, color: 'white' }}
                  onFocus={e => (e.target.style.borderColor = GOLD)}
                  onBlur={e => (e.target.style.borderColor = BORDER)}
                />
              )}

              {q.type === 'select' && (
                <div className="space-y-2">
                  {q.options!.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setResponse(q.id, opt)}
                      className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all"
                      style={{
                        background: responses[q.id] === opt ? GOLD + '22' : '#111',
                        color: responses[q.id] === opt ? GOLD : '#aaa',
                        border: `1px solid ${responses[q.id] === opt ? GOLD : BORDER}`,
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mt-6">
          {currentSection > 0 && (
            <button
              onClick={() => setCurrentSection(s => s - 1)}
              className="px-6 py-3 rounded-lg text-sm font-medium transition-all"
              style={{ background: '#1A1A1A', color: '#aaa', border: `1px solid ${BORDER}` }}
            >
              ← Anterior
            </button>
          )}

          <button
            disabled={!canAdvance() || submitting}
            onClick={() => {
              if (currentSection < totalSections - 1) {
                setCurrentSection(s => s + 1)
              } else {
                handleSubmit()
              }
            }}
            className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: canAdvance() ? GOLD : '#333', color: canAdvance() ? '#0A0A0A' : '#666' }}
          >
            {submitting
              ? 'Calculando tu score...'
              : currentSection < totalSections - 1
              ? 'Siguiente sección →'
              : 'Ver mi Clarity Score'}
          </button>
        </div>
      </div>
    </div>
  )
}
