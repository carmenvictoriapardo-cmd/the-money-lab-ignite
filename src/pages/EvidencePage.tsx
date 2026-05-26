import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { EvidenceItem } from '../types'
import { Award, Plus, X, ExternalLink } from 'lucide-react'

const GOLD = '#C9A84C'
const SURFACE = '#111111'
const BORDER = '#1E1E1E'

const EVIDENCE_TYPES = [
  {
    key: 'primer_pago',
    label: 'Primer Pago',
    emoji: '💰',
    color: '#4ADE80',
    desc: 'Primera venta o pago confirmado — el hito más importante.',
  },
  {
    key: 'primer_dm',
    label: 'Primer DM',
    emoji: '💬',
    color: '#60A5FA',
    desc: 'Tu primer mensaje o respuesta de un potencial cliente.',
  },
  {
    key: 'testimonio',
    label: 'Testimonio',
    emoji: '⭐',
    color: GOLD,
    desc: 'Feedback, review o testimonio de un cliente.',
  },
  {
    key: 'breakthrough',
    label: 'Breakthrough',
    emoji: '⚡',
    color: '#A78BFA',
    desc: 'Momento de quiebre, claridad o realización clave.',
  },
  {
    key: 'otro',
    label: 'Otro Win',
    emoji: '🏆',
    color: '#FB923C',
    desc: 'Otro logro o hito importante del programa.',
  },
] as const

type EvidenceType = typeof EVIDENCE_TYPES[number]['key']

function typeMeta(key: string) {
  return EVIDENCE_TYPES.find(t => t.key === key) ?? EVIDENCE_TYPES[4]
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function EvidencePage() {
  const { profile } = useAuth()
  const [items, setItems] = useState<EvidenceItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState<EvidenceType>('primer_pago')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [profile?.id])

  async function fetchData() {
    if (!profile?.id) return
    const { data } = await supabase
      .from('evidence_items')
      .select('*')
      .eq('user_id', profile.id)
      .order('event_date', { ascending: false })
    if (data) setItems(data)
  }

  async function handleSubmit() {
    if (!profile?.id || !title.trim()) return
    setSubmitting(true)
    await supabase.from('evidence_items').insert({
      user_id: profile.id,
      type,
      title: title.trim(),
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      event_date: eventDate,
    })
    setShowForm(false)
    resetForm()
    fetchData()
    setSubmitting(false)
  }

  function resetForm() {
    setType('primer_pago')
    setTitle('')
    setDescription('')
    setImageUrl('')
    setEventDate(new Date().toISOString().split('T')[0])
  }

  // ── Stats ──────────────────────────────────────────────────────────────
  const totalItems = items.length
  const testimonials = items.filter(i => i.type === 'testimonio').length
  const breakthroughs = items.filter(i => i.type === 'breakthrough').length
  const firstPayment = items.find(i => i.type === 'primer_pago')

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Award size={18} style={{ color: GOLD }} />
            <p className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>Evidence Locker™</p>
          </div>
          <h1 className="text-2xl font-bold text-white">Tu muro de wins</h1>
          <p className="text-gray-400 text-sm mt-1">
            Cada evidencia aquí es prueba de que estás avanzando. Guarda todo.
          </p>
        </motion.div>

        {/* Stats bar */}
        {totalItems > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            {[
              { label: 'Total evidencias', value: totalItems, color: GOLD },
              { label: 'Testimonios', value: testimonials, color: GOLD },
              { label: 'Breakthroughs', value: breakthroughs, color: '#A78BFA' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* First payment highlight */}
        {firstPayment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-4 mb-6 flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, #052014 0%, #071a0e 100%)', border: '1px solid #4ADE8066' }}
          >
            <span className="text-3xl">💰</span>
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#4ADE80' }}>Primera venta</p>
              <p className="text-white font-bold">{firstPayment.title}</p>
              <p className="text-gray-400 text-xs mt-0.5">{formatDate(firstPayment.event_date)}</p>
            </div>
          </motion.div>
        )}

        {/* Add button */}
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl font-semibold text-sm mb-6 flex items-center justify-center gap-2 hover:opacity-90 transition-all"
          style={{ background: GOLD, color: '#0A0A0A' }}
        >
          <Plus size={18} />
          Agregar evidencia
        </button>

        {/* Form modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-end md:items-center justify-center p-4 z-50"
              style={{ background: 'rgba(0,0,0,0.88)' }}
              onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); resetForm() } }}
            >
              <motion.div
                initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                className="w-full max-w-lg rounded-2xl p-6"
                style={{ background: '#1A1A1A', border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-center justify-between mb-5">
                  <p className="text-white font-semibold">Nueva evidencia</p>
                  <button onClick={() => { setShowForm(false); resetForm() }}>
                    <X size={18} className="text-gray-400" />
                  </button>
                </div>

                {/* Type selector */}
                <div className="grid grid-cols-5 gap-1.5 mb-5">
                  {EVIDENCE_TYPES.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setType(t.key)}
                      className="rounded-xl p-2 text-center transition-all"
                      style={{
                        background: type === t.key ? `${t.color}22` : '#0A0A0A',
                        border: `1px solid ${type === t.key ? t.color + '66' : '#2A2A2A'}`,
                      }}
                    >
                      <p className="text-lg mb-0.5">{t.emoji}</p>
                      <p className="text-xs leading-tight" style={{ color: type === t.key ? t.color : '#888' }}>
                        {t.label}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Type description */}
                <div
                  className="rounded-lg p-3 mb-4 text-xs"
                  style={{
                    background: `${typeMeta(type).color}11`,
                    color: typeMeta(type).color,
                    border: `1px solid ${typeMeta(type).color}33`,
                  }}
                >
                  {typeMeta(type).desc}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider">Título *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder={
                        type === 'primer_pago' ? 'Ej: Primer cliente pagó $1,500' :
                        type === 'primer_dm' ? 'Ej: Respuesta de potencial cliente en LinkedIn' :
                        type === 'testimonio' ? 'Ej: María dice que duplicó sus ventas' :
                        type === 'breakthrough' ? 'Ej: Entendí cuál es mi oferta irresistible' :
                        'Describe tu win en una línea'
                      }
                      className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                      style={{ background: '#0A0A0A', border: `1px solid #2A2A2A` }}
                      onFocus={e => (e.target.style.borderColor = GOLD)}
                      onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider">Detalle (opcional)</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Contexto, historia detrás, qué lo hizo posible..."
                      className="w-full px-3 py-2 rounded-lg text-sm text-white resize-none outline-none"
                      style={{ background: '#0A0A0A', border: `1px solid #2A2A2A` }}
                      onFocus={e => (e.target.style.borderColor = GOLD)}
                      onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider">Fecha</label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={e => setEventDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                        style={{ background: '#0A0A0A', border: `1px solid #2A2A2A`, colorScheme: 'dark' }}
                        onFocus={e => (e.target.style.borderColor = GOLD)}
                        onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider">URL imagen (opcional)</label>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={e => setImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                        style={{ background: '#0A0A0A', border: `1px solid #2A2A2A` }}
                        onFocus={e => (e.target.style.borderColor = GOLD)}
                        onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!title.trim() || submitting}
                  className="w-full py-3 rounded-xl font-semibold text-sm mt-5 disabled:opacity-40 transition-all"
                  style={{ background: GOLD, color: '#0A0A0A' }}
                >
                  {submitting ? 'Guardando...' : 'Guardar evidencia'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {items.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <p className="text-5xl mb-4">🏆</p>
            <p className="text-white font-semibold text-lg mb-2">Tu locker está vacío — por ahora</p>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              Cada win cuenta, cada DM respondido, cada pago, cada testimonio. Empieza a guardarlos aquí.
            </p>
          </motion.div>
        )}

        {/* Evidence cards */}
        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((item, i) => {
              const meta = typeMeta(item.type)
              const isExpanded = expandedId === item.id
              const isFirstPayment = item.type === 'primer_pago'

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: SURFACE,
                    border: `1px solid ${isFirstPayment ? '#4ADE8055' : meta.color + '33'}`,
                    boxShadow: isFirstPayment ? '0 0 20px #4ADE8011' : undefined,
                  }}
                >
                  <button
                    className="w-full px-4 py-4 flex items-start justify-between text-left"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0 pr-3">
                      <span className="text-2xl flex-shrink-0 mt-0.5">{meta.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: meta.color + '22', color: meta.color }}
                          >
                            {meta.label}
                          </span>
                          {isFirstPayment && (
                            <span className="text-xs px-2 py-0.5 rounded-full animate-pulse"
                              style={{ background: '#4ADE8022', color: '#4ADE80' }}>
                              🥇 Hito
                            </span>
                          )}
                        </div>
                        <p className="text-white font-medium text-sm leading-snug">{item.title}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{formatDate(item.event_date)}</p>
                      </div>
                    </div>
                    <span className="text-gray-500 text-xs flex-shrink-0 mt-1">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ borderTop: `1px solid ${BORDER}` }}
                      >
                        <div className="px-4 py-4 space-y-3">
                          {item.description && (
                            <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
                          )}
                          {item.image_url && (
                            <div>
                              <img
                                src={item.image_url}
                                alt={item.title}
                                className="w-full rounded-lg object-cover max-h-64"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                              <a
                                href={item.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs mt-2 hover:opacity-80"
                                style={{ color: meta.color }}
                              >
                                <ExternalLink size={11} />
                                Ver imagen original
                              </a>
                            </div>
                          )}
                          {!item.description && !item.image_url && (
                            <p className="text-gray-600 text-xs italic">Sin detalles adicionales.</p>
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

        {/* Bottom motivational note */}
        {items.length >= 3 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="mt-6 rounded-xl p-4 text-center"
            style={{ background: `${GOLD}0A`, border: `1px solid ${GOLD}22` }}
          >
            <p className="text-sm" style={{ color: GOLD }}>
              {items.length} evidencias capturadas — cada una es prueba de que eres capaz. 🔥
            </p>
          </motion.div>
        )}

      </div>
    </div>
  )
}
