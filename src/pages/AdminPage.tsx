import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Crown, AlertTriangle, CheckCircle2, Clock, MessageSquare, X, Sparkles, UserPlus, Trash2, ShieldCheck } from 'lucide-react'
import type { StrategicReview } from '../types'

const GOLD = '#C9A84C'
const SURFACE = '#111111'
const BORDER = '#1E1E1E'

interface ParticipantData {
  id: string
  email: string
  full_name: string
  program_start_date?: string
  el_pacto_signed: boolean
  onboarded: boolean
  clarityScore: number
  crearTotal: number
  revenueTotal: number
  activeBlockers: number
  evidenceCount: number
  lastActivity: string | null
  dayInProgram: number
  igniteScore: number
}

// Renders **bold** markdown inline
function renderMd(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-white">{part}</strong>
      : <span key={i}>{part}</span>
  )
}

function AIAnalysisCard({ analysis }: { analysis: string }) {
  const lines = analysis.split('\n')
  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 100%)', border: '1px solid #7C3AED44' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-purple-400" />
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#A78BFA' }}>Pre-análisis IA para Carmen</p>
      </div>
      <div className="space-y-1.5">
        {lines.map((line, i) => {
          if (!line.trim()) return <div key={i} className="h-1" />
          return (
            <p key={i} className="text-gray-300 text-xs leading-relaxed">
              {renderMd(line)}
            </p>
          )
        })}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { profile } = useAuth()
  const [participants, setParticipants] = useState<ParticipantData[]>([])
  const [pendingReviews, setPendingReviews] = useState<(StrategicReview & { profile_email: string; profile_name: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [tab, setTab] = useState<'cohort' | 'reviews' | 'acceso'>('cohort')

  // Acceso tab state
  const [invitedList, setInvitedList] = useState<{ id: string; email: string; full_name: string | null; notes: string | null; invited_at: string }[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [addingAccess, setAddingAccess] = useState(false)
  const [accessMsg, setAccessMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    if (profile?.role === 'admin') { fetchAll() }
  }, [profile?.id])

  async function fetchAll() {
    await Promise.all([fetchParticipants(), fetchPendingReviews(), fetchInvited()])
    setLoading(false)
  }

  async function fetchInvited() {
    const { data } = await supabase
      .from('invited_participants')
      .select('*')
      .order('invited_at', { ascending: false })
    if (data) setInvitedList(data)
  }

  async function addInvited() {
    if (!newEmail.trim()) return
    setAddingAccess(true)
    setAccessMsg(null)
    const { error } = await supabase.from('invited_participants').insert({
      email: newEmail.toLowerCase().trim(),
      full_name: newName.trim() || null,
      notes: newNotes.trim() || null,
    })
    if (error) {
      setAccessMsg({ type: 'err', text: error.message.includes('unique') ? 'Ese email ya está en la lista.' : error.message })
    } else {
      setAccessMsg({ type: 'ok', text: `✓ Acceso habilitado para ${newEmail.trim()}` })
      setNewEmail('')
      setNewName('')
      setNewNotes('')
      fetchInvited()
    }
    setAddingAccess(false)
    setTimeout(() => setAccessMsg(null), 4000)
  }

  async function removeInvited(id: string, email: string) {
    if (!confirm(`¿Quitar acceso a ${email}?`)) return
    await supabase.from('invited_participants').delete().eq('id', id)
    fetchInvited()
  }

  async function fetchParticipants() {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client')

    if (!profilesData) return

    const enriched: ParticipantData[] = await Promise.all(
      profilesData.map(async (p: any) => {
        const [clarityRes, crearRes, revenueRes, blockerRes, evidenceRes] = await Promise.all([
          supabase.from('clarity_responses').select('clarity_score').eq('user_id', p.id).order('submitted_at', { ascending: false }).limit(1),
          supabase.from('weekly_scores').select('total_score, created_at').eq('user_id', p.id).order('week_number', { ascending: false }).limit(1),
          supabase.from('revenue_events').select('amount').eq('user_id', p.id),
          supabase.from('blocker_logs').select('id').eq('user_id', p.id).eq('resolved', false),
          supabase.from('evidence_items').select('id').eq('user_id', p.id),
        ])

        const clarityScore = clarityRes.data?.[0]?.clarity_score ?? 0
        const crearTotal = crearRes.data?.[0]?.total_score ?? 0
        const revenueTotal = (revenueRes.data ?? []).reduce((s: number, e: any) => s + Number(e.amount), 0)
        const activeBlockers = blockerRes.data?.length ?? 0
        const evidenceCount = evidenceRes.data?.length ?? 0
        const lastActivity = crearRes.data?.[0]?.created_at ?? null

        const dayInProgram = p.program_start_date
          ? Math.min(90, Math.max(1, Math.floor((Date.now() - new Date(p.program_start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1))
          : 0

        const igniteScore = Math.round(crearTotal * 0.4 + (revenueTotal > 0 ? 100 : 0) * 0.3 + 30)

        return { id: p.id, email: p.email, full_name: p.full_name, program_start_date: p.program_start_date, el_pacto_signed: p.el_pacto_signed, onboarded: p.onboarded, clarityScore, crearTotal, revenueTotal, activeBlockers, evidenceCount, lastActivity, dayInProgram, igniteScore }
      })
    )
    setParticipants(enriched)
  }

  async function fetchPendingReviews() {
    const { data } = await supabase
      .from('strategic_reviews')
      .select(`*, profiles(email, full_name)`)
      .is('carmen_response', null)
      .order('created_at', { ascending: true })

    if (data) {
      setPendingReviews(data.map((r: any) => ({
        ...r,
        profile_email: r.profiles?.email ?? '',
        profile_name: r.profiles?.full_name ?? r.profiles?.email ?? 'Participante',
      })))
    }
  }

  async function submitResponse(reviewId: string) {
    if (!responseText.trim()) return
    await supabase.from('strategic_reviews').update({
      carmen_response: responseText.trim(),
      video_url: videoUrl.trim() || null,
    }).eq('id', reviewId)
    setRespondingTo(null)
    setResponseText('')
    setVideoUrl('')
    fetchPendingReviews()
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <p className="text-gray-400">Acceso restringido.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <div className="w-6 h-6 rounded-full animate-spin" style={{ border: `2px solid ${GOLD}`, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const riskParticipants = participants.filter(p =>
    p.onboarded && (p.igniteScore < 40 || p.activeBlockers > 2 || (p.lastActivity && (Date.now() - new Date(p.lastActivity).getTime()) > 7 * 24 * 60 * 60 * 1000))
  )

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Crown size={18} style={{ color: '#F59E0B' }} />
            <p className="text-xs tracking-[0.2em] uppercase" style={{ color: '#F59E0B' }}>Portal de Carmen</p>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">{participants.length} participantes · {pendingReviews.length} reviews pendientes · {invitedList.length} con acceso</p>
        </motion.div>

        {/* Risk alerts */}
        {riskParticipants.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-xl p-4 mb-6 flex items-start gap-3"
            style={{ background: '#EF444411', border: '1px solid #EF444444' }}
          >
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-sm font-semibold mb-1">⚠️ Alerta de intervención — {riskParticipants.length} participante{riskParticipants.length > 1 ? 's' : ''}</p>
              <div className="space-y-0.5">
                {riskParticipants.map(p => (
                  <p key={p.id} className="text-gray-400 text-xs">• {p.full_name || p.email} — Score: {p.igniteScore}, Bloqueos: {p.activeBlockers}</p>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'cohort', label: `Cohort (${participants.length})` },
            { key: 'reviews', label: `Reviews (${pendingReviews.length})` },
            { key: 'acceso', label: `Acceso (${invitedList.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === t.key ? GOLD : SURFACE,
                color: tab === t.key ? '#0A0A0A' : '#aaa',
                border: `1px solid ${tab === t.key ? GOLD : BORDER}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* COHORT TAB */}
        {tab === 'cohort' && (
          <div className="space-y-3">
            {participants.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">No hay participantes registrados todavía.</p>
              </div>
            )}
            {participants.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: SURFACE, border: `1px solid ${selected === p.id ? GOLD + '66' : BORDER}` }}
              >
                <button
                  className="w-full px-5 py-4 flex items-center justify-between"
                  onClick={() => setSelected(selected === p.id ? null : p.id)}
                >
                  <div className="flex items-center gap-4 text-left min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: `${GOLD}22`, color: GOLD }}
                    >
                      {(p.full_name || p.email)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{p.full_name || '—'}</p>
                      <p className="text-gray-500 text-xs truncate">{p.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Ignite score */}
                    <div className="text-center hidden md:block">
                      <p className="font-bold text-lg"
                        style={{ color: p.igniteScore >= 70 ? '#4ADE80' : p.igniteScore >= 40 ? GOLD : '#F87171' }}>
                        {p.igniteScore}
                      </p>
                      <p className="text-xs text-gray-500">IGNITE</p>
                    </div>
                    {/* Day */}
                    <div className="text-center hidden md:block">
                      <p className="font-bold text-white">{p.dayInProgram > 0 ? `D${p.dayInProgram}` : '—'}</p>
                      <p className="text-xs text-gray-500">Día</p>
                    </div>
                    {/* Revenue */}
                    <div className="text-center hidden md:block">
                      <p className="font-bold" style={{ color: p.revenueTotal > 0 ? '#4ADE80' : '#6B7280' }}>
                        {p.revenueTotal > 0 ? `$${p.revenueTotal.toLocaleString()}` : '$0'}
                      </p>
                      <p className="text-xs text-gray-500">Revenue</p>
                    </div>
                    {/* Status badges */}
                    <div className="flex gap-1">
                      {!p.onboarded && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F8712222', color: '#FB923C' }}>Pendiente</span>}
                      {p.activeBlockers > 0 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#EF444422', color: '#F87171' }}>⚠️ {p.activeBlockers}</span>}
                      {p.revenueTotal > 0 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#4ADE8022', color: '#4ADE80' }}>💰</span>}
                      {p.evidenceCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#C9A84C22', color: '#C9A84C' }}>🏆 {p.evidenceCount}</span>}
                    </div>
                    <span className="text-gray-500 text-xs">{selected === p.id ? '▲' : '▼'}</span>
                  </div>
                </button>

                {selected === p.id && (
                  <div className="px-5 pb-5" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      {[
                        { label: 'Clarity Score', value: p.clarityScore > 0 ? `${p.clarityScore}/100` : '—' },
                        { label: 'C.R.E.A.R.', value: p.crearTotal > 0 ? `${p.crearTotal}%` : '—' },
                        { label: 'Revenue', value: `$${p.revenueTotal.toLocaleString()}` },
                        { label: 'Bloqueos activos', value: String(p.activeBlockers) },
                        { label: 'Evidencias', value: String(p.evidenceCount) },
                      ].map(s => (
                        <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: '#0A0A0A', border: `1px solid #2A2A2A` }}>
                          <p className="font-bold text-white">{s.value}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: p.el_pacto_signed ? '#4ADE8022' : '#F8712222', color: p.el_pacto_signed ? '#4ADE80' : '#FB923C' }}>
                        {p.el_pacto_signed ? '✓ Pacto firmado' : '⏳ Pacto pendiente'}
                      </span>
                      {p.program_start_date && (
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#2A2A2A', color: '#aaa' }}>
                          <Clock size={10} className="inline mr-1" />
                          Inicio: {new Date(p.program_start_date).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* ACCESO TAB */}
        {tab === 'acceso' && (
          <div className="space-y-6">

            {/* Add form */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={16} style={{ color: GOLD }} />
                <h2 className="text-white font-semibold">Habilitar acceso</h2>
              </div>
              <p className="text-gray-400 text-xs mb-4">
                Solo las personas en esta lista pueden solicitar un enlace de acceso. Tu email de admin siempre tiene acceso.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Email *</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="participante@email.com"
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none transition-colors"
                    style={{ background: '#0A0A0A', border: '1px solid #2A2A2A' }}
                    onFocus={e => (e.target.style.borderColor = GOLD)}
                    onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
                    onKeyDown={e => e.key === 'Enter' && addInvited()}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Nombre</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="Nombre completo"
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
                      style={{ background: '#0A0A0A', border: '1px solid #2A2A2A' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Notas</label>
                    <input
                      type="text"
                      value={newNotes}
                      onChange={e => setNewNotes(e.target.value)}
                      placeholder="Ej: Cohort mayo 2026"
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
                      style={{ background: '#0A0A0A', border: '1px solid #2A2A2A' }}
                    />
                  </div>
                </div>

                {accessMsg && (
                  <p className={`text-xs px-3 py-2 rounded-lg ${accessMsg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}
                    style={{ background: accessMsg.type === 'ok' ? '#4ADE8011' : '#EF444411' }}>
                    {accessMsg.text}
                  </p>
                )}

                <button
                  onClick={addInvited}
                  disabled={addingAccess || !newEmail.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 transition-all"
                  style={{ background: GOLD, color: '#0A0A0A' }}
                >
                  <UserPlus size={15} />
                  {addingAccess ? 'Agregando...' : 'Habilitar acceso'}
                </button>
              </div>
            </motion.div>

            {/* Invited list */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">{invitedList.length} persona{invitedList.length !== 1 ? 's' : ''} con acceso habilitado</p>
              {invitedList.length === 0 ? (
                <div className="text-center py-10">
                  <ShieldCheck size={36} className="mx-auto mb-3" style={{ color: '#2A2A2A' }} />
                  <p className="text-gray-500 text-sm">Nadie en la lista todavía.</p>
                  <p className="text-gray-600 text-xs mt-1">Agrega el email de tus participantes para darles acceso.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invitedList.map((inv, i) => (
                    <motion.div
                      key={inv.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: `${GOLD}22`, color: GOLD }}
                        >
                          {(inv.full_name || inv.email)[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{inv.full_name || inv.email}</p>
                          <p className="text-gray-500 text-xs truncate">{inv.full_name ? inv.email : ''}{inv.notes ? ` · ${inv.notes}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-gray-600 text-xs hidden sm:block">
                          {new Date(inv.invited_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                        <button
                          onClick={() => removeInvited(inv.id, inv.email)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                          title="Quitar acceso"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {tab === 'reviews' && (
          <div>
            {pendingReviews.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 size={40} className="mx-auto text-green-400 mb-3" />
                <p className="text-white font-medium">¡Todo al día!</p>
                <p className="text-gray-500 text-sm mt-1">No hay reviews pendientes de respuesta.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReviews.map(r => {
                  const typeColors: Record<string, string> = { win: '#4ADE80', challenge: '#FB923C', ask: GOLD }
                  const typeEmojis: Record<string, string> = { win: '🏆', challenge: '⚡', ask: '🎯' }
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl p-5"
                      style={{ background: SURFACE, border: `1px solid ${typeColors[r.type] + '44'}` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: typeColors[r.type] + '22', color: typeColors[r.type] }}>
                              {typeEmojis[r.type]} {r.type === 'win' ? 'Win' : r.type === 'challenge' ? 'Desafío' : 'Pregunta'}
                            </span>
                            <span className="text-xs text-gray-500">Sem. {r.week_number}</span>
                          </div>
                          <p className="text-xs text-gray-400">{r.profile_name} · {new Date(r.created_at).toLocaleDateString('es-ES')}</p>
                        </div>
                      </div>

                      <p className="text-gray-200 text-sm mb-2">{r.context}</p>
                      {r.evidence && <p className="text-gray-400 text-xs mb-3 italic">Evidencia: {r.evidence}</p>}

                      {/* AI Pre-analysis */}
                      {r.ai_analysis
                        ? <AIAnalysisCard analysis={r.ai_analysis} />
                        : (
                          <div className="rounded-lg px-3 py-2 mb-4 flex items-center gap-2"
                            style={{ background: '#7C3AED11', border: '1px solid #7C3AED33' }}>
                            <Sparkles size={12} className="text-purple-400 animate-pulse" />
                            <p className="text-xs" style={{ color: '#A78BFA' }}>IA analizando este review…</p>
                          </div>
                        )
                      }

                      {respondingTo === r.id ? (
                        <div className="space-y-3">
                          <textarea
                            rows={3} value={responseText} onChange={e => setResponseText(e.target.value)}
                            placeholder="Tu respuesta directa a este participante..."
                            className="w-full px-3 py-2 rounded-lg text-sm text-white resize-none outline-none"
                            style={{ background: '#0A0A0A', border: `1px solid #2A2A2A` }}
                            onFocus={e => (e.target.style.borderColor = GOLD)} onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
                          />
                          <input
                            type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                            placeholder="URL del video de respuesta (opcional)"
                            className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                            style={{ background: '#0A0A0A', border: `1px solid #2A2A2A` }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => submitResponse(r.id)}
                              disabled={!responseText.trim()}
                              className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
                              style={{ background: GOLD, color: '#0A0A0A' }}
                            >
                              Enviar respuesta
                            </button>
                            <button
                              onClick={() => { setRespondingTo(null); setResponseText(''); setVideoUrl('') }}
                              className="px-3 py-2 rounded-lg text-gray-400 hover:text-white"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRespondingTo(r.id)}
                          className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-all"
                          style={{ background: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}44` }}
                        >
                          <MessageSquare size={14} />
                          Responder
                        </button>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
