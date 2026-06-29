import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { RevenueEvent } from '../types'
import { DollarSign, Plus, X, Sparkles } from 'lucide-react'

const GOLD = '#C9A84C'
const SURFACE = '#111111'
const BORDER = '#1E1E1E'

const EVENT_TYPES = [
  { key: 'cliente_nuevo',       label: 'Cliente Nuevo',       emoji: '🎉' },
  { key: 'upsell',              label: 'Upsell',              emoji: '📈' },
  { key: 'renovacion',          label: 'Renovación',          emoji: '🔄' },
  { key: 'servicio_adicional',  label: 'Servicio Adicional',  emoji: '➕' },
  { key: 'otro',                label: 'Otro ingreso',        emoji: '💰' },
]

function Fireworks() {
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: `${Math.random() * 100}vw`, y: '100vh', scale: 0 }}
          animate={{
            y: `${Math.random() * 50}vh`,
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 1.5, delay: i * 0.08, ease: 'easeOut' }}
          className="absolute w-3 h-3 rounded-full"
          style={{ background: [GOLD, '#4ADE80', '#60A5FA', '#F87171', '#A78BFA'][i % 5] }}
        />
      ))}
    </div>
  )
}

export default function RevenuePage() {
  const { profile, getCurrentDay } = useAuth()
  const day = getCurrentDay()
  const [events, setEvents] = useState<RevenueEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showRitual, setShowRitual] = useState(false)
  const [type, setType] = useState('cliente_nuevo')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchData() }, [profile?.id])

  async function fetchData() {
    if (!profile?.id) return
    const { data } = await supabase
      .from('revenue_events')
      .select('*')
      .eq('user_id', profile.id)
      .order('event_date', { ascending: true })
    if (data) setEvents(data)
  }

  async function handleSubmit() {
    if (!profile?.id || !amount || !description.trim()) return
    setSubmitting(true)
    const isFirst = events.length === 0
    await supabase.from('revenue_events').insert({
      user_id: profile.id,
      amount: parseFloat(amount),
      type,
      description: description.trim(),
      event_date: new Date().toISOString().split('T')[0],
    })
    setShowForm(false)
    setAmount('')
    setDescription('')
    await fetchData()
    if (isFirst) setShowRitual(true)
    setSubmitting(false)
  }

  const total = events.reduce((s, e) => s + Number(e.amount), 0)
  const hasRevenue = events.length > 0

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-2xl mx-auto">

        {/* First Revenue Ritual */}
        <AnimatePresence>
          {showRitual && (
            <>
              <Fireworks />
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center p-4 z-50"
                style={{ background: 'rgba(0,0,0,0.9)' }}
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                  className="rounded-2xl p-8 text-center max-w-sm w-full"
                  style={{ background: '#1A1A1A', border: `2px solid ${GOLD}` }}
                >
                  <motion.div
                    animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-6xl mb-4"
                  >
                    🎉
                  </motion.div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles size={16} style={{ color: GOLD }} />
                    <p className="text-xs tracking-widest uppercase font-bold" style={{ color: GOLD }}>First Revenue Ritual™</p>
                    <Sparkles size={16} style={{ color: GOLD }} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">¡Tu primer ingreso!</h2>
                  <p className="text-3xl font-bold mb-3" style={{ color: GOLD }}>${parseFloat(events[events.length - 1]?.amount?.toString() ?? '0').toLocaleString()}</p>
                  <p className="text-gray-300 text-sm mb-2">
                    Esto es real. Esto es tuyo. Lo construiste tú.
                  </p>
                  <p className="text-gray-400 text-xs mb-6">
                    Día {day} de tu programa. Este momento marca el inicio de tu nuevo nivel.
                  </p>
                  <button
                    onClick={() => setShowRitual(false)}
                    className="w-full py-3 rounded-xl font-bold text-sm"
                    style={{ background: GOLD, color: '#0A0A0A' }}
                  >
                    🔥 Continuar construyendo
                  </button>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={18} style={{ color: GOLD }} />
            <p className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>Revenue Tracker</p>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {hasRevenue ? 'Tus ingresos' : 'First Revenue Ritual™'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {hasRevenue
              ? 'Cada ingreso registrado es evidencia de tu progreso.'
              : 'Tu primer cliente está más cerca de lo que crees. Regístralo cuando llegue.'}
          </p>
        </motion.div>

        {/* Total */}
        {hasRevenue && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-6 mb-6 text-center"
            style={{ background: `${GOLD}11`, border: `1px solid ${GOLD}44` }}
          >
            <p className="text-xs tracking-wider uppercase text-gray-400 mb-1">Revenue total del programa</p>
            <p className="text-4xl font-bold mb-1" style={{ color: GOLD }}>${total.toLocaleString()}</p>
            <p className="text-gray-400 text-sm">{events.length} {events.length === 1 ? 'ingreso' : 'ingresos'} · Día {day} de 90</p>
          </motion.div>
        )}

        {/* 90-day timeline */}
        {hasRevenue && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="rounded-2xl p-5 mb-6"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Timeline del programa (90 días)</p>
            <div className="relative">
              {/* Baseline */}
              <div className="h-1 w-full rounded-full mb-4" style={{ background: '#2A2A2A' }}>
                <div className="h-1 rounded-full" style={{ width: `${(day / 90) * 100}%`, background: `${GOLD}55` }} />
              </div>
              {/* Events */}
              <div className="relative h-8">
                {events.map(e => {
                  const pct = profile?.program_start_date
                    ? Math.min(100, Math.max(0, Math.round(
                        (new Date(e.event_date).getTime() - new Date(profile.program_start_date).getTime()) /
                        (90 * 24 * 60 * 60 * 1000) * 100
                      )))
                    : 0
                  return (
                    <div
                      key={e.id}
                      className="absolute top-0 transform -translate-x-1/2 group cursor-pointer"
                      style={{ left: `${pct}%` }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ background: GOLD }} />
                      <div
                        className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                        style={{ border: `1px solid ${GOLD}44` }}
                      >
                        ${Number(e.amount).toLocaleString()} — {e.description}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>Día 1</span><span>Día 90</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Add button */}
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl font-semibold text-sm mb-6 flex items-center justify-center gap-2 hover:opacity-90 transition-all"
          style={{ background: hasRevenue ? '#1A1A1A' : GOLD, color: hasRevenue ? GOLD : '#0A0A0A', border: hasRevenue ? `1px solid ${GOLD}44` : 'none' }}
        >
          <Plus size={18} />
          {hasRevenue ? 'Registrar nuevo ingreso' : '🎉 Registrar mi primer ingreso'}
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
                className="w-full max-w-md rounded-2xl p-6"
                style={{ background: '#1A1A1A', border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-center justify-between mb-5">
                  <p className="text-white font-semibold">Registrar ingreso</p>
                  <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
                </div>

                {/* Type */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {EVENT_TYPES.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setType(t.key)}
                      className="rounded-lg p-2 text-center text-xs transition-all"
                      style={{
                        background: type === t.key ? `${GOLD}22` : '#0A0A0A',
                        border: `1px solid ${type === t.key ? GOLD + '66' : '#2A2A2A'}`,
                        color: type === t.key ? GOLD : '#aaa',
                      }}
                    >
                      <p>{t.emoji}</p>
                      <p className="mt-0.5">{t.label}</p>
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider">Monto ($)</label>
                    <input
                      type="number" value={amount} onChange={e => setAmount(e.target.value)}
                      placeholder="0.00" min="0" step="0.01"
                      className="w-full px-4 py-3 rounded-lg text-white text-lg font-bold outline-none"
                      style={{ background: '#0A0A0A', border: `1px solid #2A2A2A` }}
                      onFocus={e => (e.target.style.borderColor = GOLD)} onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider">Descripción</label>
                    <input
                      type="text" value={description} onChange={e => setDescription(e.target.value)}
                      placeholder="Ej: Primer cliente del programa BUILD — 3 meses"
                      className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                      style={{ background: '#0A0A0A', border: `1px solid #2A2A2A` }}
                      onFocus={e => (e.target.style.borderColor = GOLD)} onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!amount || !description.trim() || submitting}
                  className="w-full py-3 rounded-xl font-bold text-sm mt-4 disabled:opacity-40 transition-all"
                  style={{ background: GOLD, color: '#0A0A0A' }}
                >
                  {submitting ? 'Guardando...' : events.length === 0 ? '🎉 Registrar mi primer ingreso' : 'Registrar ingreso'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Events list */}
        {events.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Historial de ingresos</p>
            <div className="space-y-2">
              {[...events].reverse().map((e, i) => {
                const t = EVENT_TYPES.find(t => t.key === e.type) ?? EVENT_TYPES[4]
                return (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="rounded-xl p-4 flex items-center justify-between"
                    style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{t.emoji}</span>
                      <div>
                        <p className="text-white text-sm font-medium">{e.description}</p>
                        <p className="text-gray-500 text-xs">{t.label} · {new Date(e.event_date).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                    <p className="font-bold text-lg flex-shrink-0 ml-3" style={{ color: GOLD }}>${Number(e.amount).toLocaleString()}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {!hasRevenue && (
          <div className="text-center py-8 rounded-2xl" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <p className="text-5xl mb-4">💰</p>
            <p className="text-white font-semibold mb-2">Tu primer ingreso está en camino</p>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">Cuando llegue ese cliente, regístralo aquí. Será el comienzo del revenue timeline de tu programa.</p>
          </div>
        )}

      </div>
    </div>
  )
}
