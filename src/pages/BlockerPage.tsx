import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { BlockerLog } from '../types'
import { Shield, Plus, X, CheckCircle2, Clock, Sparkles, Loader2 } from 'lucide-react'

const GOLD = '#C9A84C'
const SURFACE = '#111111'
const BORDER = '#1E1E1E'

const BLOCKER_TYPES = [
  { key: 'mindset',    label: 'Mindset',    emoji: '🧠', color: '#A78BFA' },
  { key: 'estrategia', label: 'Estrategia', emoji: '🗺️', color: '#60A5FA' },
  { key: 'ejecucion',  label: 'Ejecución',  emoji: '⚙️', color: GOLD },
  { key: 'recursos',   label: 'Recursos',   emoji: '💡', color: '#34D399' },
  { key: 'tiempo',     label: 'Tiempo',     emoji: '⏰', color: '#FB923C' },
  { key: 'precio',     label: 'Precio',     emoji: '💲', color: '#FBBF24' },
  { key: 'ventas',     label: 'Ventas',     emoji: '💬', color: '#F87171' },
]

export default function BlockerPage() {
  const { profile, getCurrentDay } = useAuth()
  const [blockers, setBlockers] = useState<BlockerLog[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showResolved, setShowResolved] = useState(false)
  const [generatingAI, setGeneratingAI] = useState<Set<string>>(new Set())

  useEffect(() => { fetchData() }, [profile?.id])

  async function fetchData() {
    if (!profile?.id) return
    const { data } = await supabase
      .from('blocker_logs')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    if (data) setBlockers(data)
  }

  async function handleSubmit() {
    if (!profile?.id || !selectedType || !description.trim()) return
    setSubmitting(true)

    // 1. Insert blocker
    const { data: newBlocker, error } = await supabase
      .from('blocker_logs')
      .insert({
        user_id: profile.id,
        blocker_type: selectedType,
        description: description.trim(),
        resolved: false,
      })
      .select()
      .single()

    if (error || !newBlocker) {
      setSubmitting(false)
      return
    }

    // 2. Close form immediately — show blocker with loading state
    setShowForm(false)
    setSelectedType('')
    setDescription('')
    setSubmitting(false)
    await fetchData()

    // 3. Call AI Coach in background
    setGeneratingAI(prev => new Set(prev).add(newBlocker.id))

    try {
      // Fetch latest CREAR scores for context
      const { data: crearData } = await supabase
        .from('weekly_scores')
        .select('crear_scores')
        .eq('user_id', profile.id)
        .order('week_number', { ascending: false })
        .limit(1)

      const { data: revenueData } = await supabase
        .from('revenue_events')
        .select('amount')
        .eq('user_id', profile.id)

      const revenueTotal = (revenueData ?? []).reduce((s, e) => s + Number(e.amount), 0)
      const allBlockers = blockers.length + 1

      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'generate-blocker-protocol',
        {
          body: {
            blocker_type: selectedType || newBlocker.blocker_type,
            description: newBlocker.description,
            day_of_program: getCurrentDay(),
            crear_scores: crearData?.[0]?.crear_scores ?? null,
            revenue_total: revenueTotal,
            blockers_count: allBlockers,
          },
        }
      )

      if (!fnError && fnData?.protocol) {
        // 4. Save AI protocol to DB
        await supabase
          .from('blocker_logs')
          .update({ ai_protocol: fnData.protocol })
          .eq('id', newBlocker.id)

        // 5. Update local state
        setBlockers(prev =>
          prev.map(b => b.id === newBlocker.id ? { ...b, ai_protocol: fnData.protocol } : b)
        )
      }
    } catch (err) {
      console.error('AI protocol generation failed:', err)
    } finally {
      setGeneratingAI(prev => {
        const next = new Set(prev)
        next.delete(newBlocker.id)
        return next
      })
    }
  }

  async function resolveBlocker(id: string) {
    await supabase
      .from('blocker_logs')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', id)
    fetchData()
  }

  const active = blockers.filter(b => !b.resolved)
  const resolved = blockers.filter(b => b.resolved)

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} style={{ color: GOLD }} />
            <p className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>Blocker Detection + Protocol™</p>
          </div>
          <h1 className="text-2xl font-bold text-white">Bloqueos</h1>
          <p className="text-gray-400 text-sm mt-1">
            Repórtalo. La IA diagnostica el patrón real y te da el protocolo de acción personalizado.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Activos', value: active.length, color: active.length > 0 ? '#F87171' : '#4ADE80' },
            { label: 'Resueltos', value: resolved.length, color: '#4ADE80' },
            { label: 'Total', value: blockers.length, color: GOLD },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* New blocker button */}
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl font-semibold text-sm mb-6 flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ background: GOLD, color: '#0A0A0A' }}
        >
          <Plus size={18} />
          Reportar un bloqueo
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
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-semibold">¿Qué tipo de bloqueo es?</p>
                  <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
                </div>
                <p className="text-gray-500 text-xs mb-4 flex items-center gap-1.5">
                  <Sparkles size={12} style={{ color: GOLD }} />
                  El AI Coach generará un protocolo personalizado para TU situación específica
                </p>

                <div className="grid grid-cols-2 gap-2 mb-5">
                  {BLOCKER_TYPES.map(b => (
                    <button
                      key={b.key}
                      onClick={() => setSelectedType(b.key)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all text-left"
                      style={{
                        background: selectedType === b.key ? `${b.color}22` : '#0A0A0A',
                        border: `1px solid ${selectedType === b.key ? b.color + '66' : '#2A2A2A'}`,
                        color: selectedType === b.key ? b.color : '#aaa',
                      }}
                    >
                      <span>{b.emoji}</span>
                      <span>{b.label}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe el bloqueo con detalle. ¿Qué está pasando exactamente? ¿Desde cuándo? ¿Qué ya intentaste? Cuanto más específico, mejor el protocolo de IA."
                  className="w-full px-3 py-2 rounded-lg text-sm text-white resize-none outline-none mb-4"
                  style={{ background: '#0A0A0A', border: `1px solid #2A2A2A` }}
                  onFocus={e => (e.target.style.borderColor = GOLD)}
                  onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
                />

                <button
                  onClick={handleSubmit}
                  disabled={!selectedType || !description.trim() || submitting}
                  className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  style={{ background: GOLD, color: '#0A0A0A' }}
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Registrando...</>
                  ) : (
                    <><Sparkles size={16} /> Registrar + Generar Protocolo IA</>
                  )}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active blockers */}
        {active.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">⚠️ Bloqueos activos ({active.length})</p>
            <div className="space-y-4">
              {active.map(b => {
                const meta = BLOCKER_TYPES.find(t => t.key === b.blocker_type)
                const isGenerating = generatingAI.has(b.id)
                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-xl p-4"
                    style={{ background: SURFACE, border: `1px solid ${meta?.color ? meta.color + '44' : BORDER}` }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{meta?.emoji}</span>
                        <span className="text-xs font-semibold" style={{ color: meta?.color }}>{meta?.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          <Clock size={10} className="inline mr-1" />
                          {new Date(b.created_at).toLocaleDateString('es-ES')}
                        </span>
                        <button
                          onClick={() => resolveBlocker(b.id)}
                          className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all"
                          style={{ background: '#4ADE8022', color: '#4ADE80', border: '1px solid #4ADE8044' }}
                        >
                          <CheckCircle2 size={12} /> Resolver
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-300 text-sm mb-3">{b.description}</p>

                    {/* AI Protocol or loading */}
                    {isGenerating ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-xl p-4"
                        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid #A78BFA44' }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={14} style={{ color: '#A78BFA' }} />
                          <p className="text-xs font-semibold" style={{ color: '#A78BFA' }}>AI Coach analizando tu bloqueo...</p>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                          <Loader2 size={12} className="animate-spin" style={{ color: '#A78BFA' }} />
                          Generando diagnóstico y protocolo personalizado
                        </div>
                        <div className="mt-3 space-y-2">
                          {[80, 60, 90, 50].map((w, i) => (
                            <motion.div
                              key={i}
                              className="h-2 rounded-full"
                              style={{ background: '#A78BFA22', width: `${w}%` }}
                              animate={{ opacity: [0.3, 0.8, 0.3] }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    ) : b.ai_protocol ? (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl p-4"
                        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid #A78BFA55' }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles size={14} style={{ color: '#A78BFA' }} />
                          <p className="text-xs font-bold tracking-wide" style={{ color: '#A78BFA' }}>
                            PROTOCOLO AI COACH
                          </p>
                        </div>
                        <div
                          className="text-gray-200 text-xs leading-relaxed whitespace-pre-wrap"
                          style={{ fontFamily: 'inherit' }}
                        >
                          {b.ai_protocol}
                        </div>
                      </motion.div>
                    ) : null}
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Resolved */}
        {resolved.length > 0 && (
          <div>
            <button
              className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-3"
              onClick={() => setShowResolved(s => !s)}
            >
              ✅ Resueltos ({resolved.length}) {showResolved ? '▲' : '▼'}
            </button>
            <AnimatePresence>
              {showResolved && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  {resolved.map(b => {
                    const meta = BLOCKER_TYPES.find(t => t.key === b.blocker_type)
                    return (
                      <div key={b.id} className="rounded-xl p-3 opacity-60" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span>{meta?.emoji}</span>
                          <span className="text-xs text-gray-400">{meta?.label}</span>
                          <CheckCircle2 size={12} className="text-green-400 ml-auto" />
                        </div>
                        <p className="text-gray-400 text-xs">{b.description}</p>
                        {b.ai_protocol && (
                          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#A78BFA66' }}>
                            <Sparkles size={10} /> Protocolo AI aplicado
                          </p>
                        )}
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {blockers.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <p className="text-4xl mb-3">🛡️</p>
            <p className="text-white font-medium mb-1">Sin bloqueos activos</p>
            <p className="text-gray-500 text-sm">
              Cuando encuentres uno, repórtalo de inmediato.<br />
              El AI Coach te dará un protocolo personalizado en segundos.
            </p>
          </motion.div>
        )}

      </div>
    </div>
  )
}
