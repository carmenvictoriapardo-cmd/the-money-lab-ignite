import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { BlockerLog } from '../types'
import { Shield, Plus, X, CheckCircle2, Clock } from 'lucide-react'

const GOLD = '#C9A84C'
const SURFACE = '#111111'
const BORDER = '#1E1E1E'

const BLOCKER_TYPES = [
  { key: 'mindset',    label: 'Mindset',    emoji: '🧠', color: '#A78BFA',
    protocol: 'Identifica la creencia limitante. Pregúntate: ¿qué tendría que ser verdad para que esto sea real? Escríbela y cuestionala con evidencia contraria.' },
  { key: 'estrategia', label: 'Estrategia', emoji: '🗺️', color: '#60A5FA',
    protocol: 'Revisa tu oferta y posicionamiento. ¿El problema está en el mensaje, en el precio, o en el canal? Identifica cuál de los tres necesita ajuste.' },
  { key: 'ejecucion',  label: 'Ejecución',  emoji: '⚙️', color: GOLD,
    protocol: 'Descompón la tarea en el siguiente paso más pequeño posible. Hazlo en los próximos 30 minutos, no mañana.' },
  { key: 'recursos',   label: 'Recursos',   emoji: '💡', color: '#34D399',
    protocol: '¿Qué recurso específico te falta? ¿Dinero, tiempo, conocimiento, red? Identifica UNO y crea un plan para obtenerlo esta semana.' },
  { key: 'tiempo',     label: 'Tiempo',     emoji: '⏰', color: '#FB923C',
    protocol: 'Usa Time Blocking: bloquea 90 minutos esta semana para SOLO esta tarea. Sin interrupciones. El tiempo siempre está — es prioridad.' },
  { key: 'precio',     label: 'Precio',     emoji: '💲', color: '#FBBF24',
    protocol: 'Revisión de valor percibido: ¿qué resultado concreto le das al cliente? Calcula el ROI de tu programa. El precio es un reflejo de tu certeza.' },
  { key: 'ventas',     label: 'Ventas',     emoji: '💬', color: '#F87171',
    protocol: 'Haz un role-play de tu conversación de ventas. Identifica en qué momento pierdes momentum. ¿Es en el precio? ¿En las objeciones? Practica ese momento específico.' },
]

export default function BlockerPage() {
  const { profile } = useAuth()
  const [blockers, setBlockers] = useState<BlockerLog[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showResolved, setShowResolved] = useState(false)

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
    const meta = BLOCKER_TYPES.find(b => b.key === selectedType)
    await supabase.from('blocker_logs').insert({
      user_id: profile.id,
      blocker_type: selectedType,
      description: description.trim(),
      protocol_applied: meta?.protocol,
      resolved: false,
    })
    setShowForm(false)
    setSelectedType('')
    setDescription('')
    fetchData()
    setSubmitting(false)
  }

  async function resolveBlocker(id: string) {
    await supabase.from('blocker_logs').update({ resolved: true, resolved_at: new Date().toISOString() }).eq('id', id)
    fetchData()
  }

  const active = blockers.filter(b => !b.resolved)
  const resolved = blockers.filter(b => b.resolved)
  const selectedMeta = BLOCKER_TYPES.find(b => b.key === selectedType)

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
          <p className="text-gray-400 text-sm mt-1">Los bloqueos no resueltos detienen el progreso. Regístralos y aplica el protocolo.</p>
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
              style={{ background: 'rgba(0,0,0,0.8)' }}
              onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                className="w-full max-w-lg rounded-2xl p-6"
                style={{ background: '#1A1A1A', border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-center justify-between mb-5">
                  <p className="text-white font-semibold">¿Qué tipo de bloqueo es?</p>
                  <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
                </div>

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

                {selectedMeta && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-lg p-3 mb-4"
                    style={{ background: `${selectedMeta.color}11`, border: `1px solid ${selectedMeta.color}33` }}
                  >
                    <p className="text-xs font-semibold mb-1" style={{ color: selectedMeta.color }}>Protocolo sugerido:</p>
                    <p className="text-gray-300 text-xs leading-relaxed">{selectedMeta.protocol}</p>
                  </motion.div>
                )}

                <textarea
                  rows={3} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describe el bloqueo con detalle. ¿Qué está pasando? ¿Desde cuándo? ¿Qué ya intentaste?"
                  className="w-full px-3 py-2 rounded-lg text-sm text-white resize-none outline-none mb-4"
                  style={{ background: '#0A0A0A', border: `1px solid #2A2A2A` }}
                  onFocus={e => (e.target.style.borderColor = GOLD)} onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
                />

                <button
                  onClick={handleSubmit}
                  disabled={!selectedType || !description.trim() || submitting}
                  className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40 transition-all"
                  style={{ background: GOLD, color: '#0A0A0A' }}
                >
                  {submitting ? 'Guardando...' : 'Registrar bloqueo + aplicar protocolo'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active blockers */}
        {active.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">⚠️ Bloqueos activos ({active.length})</p>
            <div className="space-y-3">
              {active.map(b => {
                const meta = BLOCKER_TYPES.find(t => t.key === b.blocker_type)
                return (
                  <motion.div
                    key={b.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="rounded-xl p-4"
                    style={{ background: SURFACE, border: `1px solid ${meta?.color ? meta.color + '44' : BORDER}` }}
                  >
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
                    <p className="text-gray-300 text-sm mb-3">{b.description}</p>
                    {b.protocol_applied && (
                      <div className="rounded-lg p-2.5" style={{ background: `${meta?.color}11`, border: `1px solid ${meta?.color}22` }}>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: meta?.color }}>Tu protocolo:</p>
                        <p className="text-gray-400 text-xs">{b.protocol_applied}</p>
                      </div>
                    )}
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
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
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
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {blockers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🛡️</p>
            <p className="text-white font-medium mb-1">Sin bloqueos activos</p>
            <p className="text-gray-500 text-sm">Cuando encuentres uno, repórtalo de inmediato. La velocidad de resolución es clave.</p>
          </div>
        )}

      </div>
    </div>
  )
}
