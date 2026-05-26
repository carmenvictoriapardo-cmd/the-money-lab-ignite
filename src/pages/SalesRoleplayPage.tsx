import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Users, Send, Square, ChevronLeft, Loader2, RotateCcw } from 'lucide-react'

const GOLD = '#C9A84C'
const SURFACE = '#111111'
const BORDER = '#1E1E1E'

interface Message { role: 'user' | 'assistant'; content: string }

interface RoleplaySession {
  id: string
  user_id: string
  scenario_id: string
  scenario_label: string
  messages: Message[]
  debrief: string | null
  score: number | null
  created_at: string
  ended_at: string | null
}

const SCENARIOS = [
  {
    id: 'dm_frio',
    label: 'DM en frío',
    emoji: '📱',
    description: 'Tu primer mensaje a un prospecto que no te conoce. El momento más difícil.',
    initialMessage: '¡Hola! Vi tu perfil por ahí. ¿De qué se trata lo que hacés exactamente?',
    difficulty: 'Media',
    difficultyColor: '#60A5FA',
    color: '#60A5FA',
    tip: 'Abre con una pregunta sobre ellos, no con un pitch sobre ti.',
  },
  {
    id: 'discovery_call',
    label: 'Llamada de descubrimiento',
    emoji: '📞',
    description: 'El prospecto aceptó hablar. Interesado pero evaluando opciones.',
    initialMessage: 'Hola, gracias por el tiempo. Mira, tengo solo 20 minutos hoy. ¿De qué me querías hablar?',
    difficulty: 'Media',
    difficultyColor: '#A78BFA',
    color: '#A78BFA',
    tip: 'Primero entiende su dolor. La oferta viene después.',
  },
  {
    id: 'objecion_precio',
    label: 'Objeción de precio',
    emoji: '💰',
    description: 'Todo iba bien hasta que llegó el precio. "Es mucho dinero para mí ahora."',
    initialMessage: 'Mira, lo que describís suena bien y me interesa... pero honestamente ese precio está bastante fuera de lo que tenía pensado gastar.',
    difficulty: 'Alta',
    difficultyColor: '#FB923C',
    color: '#FB923C',
    tip: 'Nunca bajes el precio. Eleva el valor percibido.',
  },
  {
    id: 'lead_frio',
    label: 'Lead que se enfrió',
    emoji: '❄️',
    description: 'Hubo interés antes, luego silencio. Retomás el hilo.',
    initialMessage: 'Ah sí, perdón que desaparecí... ha sido una semana muy intensa. ¿Qué me ibas a decir?',
    difficulty: 'Media',
    difficultyColor: '#4ADE80',
    color: '#4ADE80',
    tip: 'No menciones que desapareció. Seguí desde donde quedaron.',
  },
  {
    id: 'cierre',
    label: 'Cierre de venta',
    emoji: '🎯',
    description: 'Casi convencido/a pero dice "déjame pensarlo unos días."',
    initialMessage: 'Sí, todo lo que me explicaste tiene sentido y lo veo interesante... pero necesito pensarlo un poco. Te escribo la semana que viene, ¿dale?',
    difficulty: 'Alta',
    difficultyColor: GOLD,
    color: GOLD,
    tip: '"Déjame pensarlo" casi siempre es una objeción no dicha. Descúbrela.',
  },
]

function scoreColor(score: number) {
  if (score >= 8) return '#4ADE80'
  if (score >= 6) return GOLD
  if (score >= 4) return '#FB923C'
  return '#F87171'
}

function renderDebrief(text: string) {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />
    const bold = line.split(/\*\*([^*]+)\*\*/g)
    return (
      <p key={i} className="text-sm text-gray-300 leading-relaxed">
        {bold.map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part
        )}
      </p>
    )
  })
}

export default function SalesRoleplayPage() {
  const { profile } = useAuth()

  const [view, setView] = useState<'home' | 'chat'>('home')
  const [sessions, setSessions] = useState<RoleplaySession[]>([])
  const [session, setSession] = useState<RoleplaySession | null>(null)
  const [input, setInput] = useState('')
  const [aiTyping, setAiTyping] = useState(false)
  const [gettingDebrief, setGettingDebrief] = useState(false)
  const [offerCtx, setOfferCtx] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { if (profile?.id) init() }, [profile?.id])
  useEffect(() => { scrollToBottom() }, [session?.messages])

  async function init() {
    if (!profile?.id) return
    const [sessRes, offerRes] = await Promise.all([
      supabase.from('roleplay_sessions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('offer_builder').select('ideal_client, result_promised, timeframe, one_liner').eq('user_id', profile.id).maybeSingle(),
    ])
    if (sessRes.data) setSessions(sessRes.data as RoleplaySession[])
    if (offerRes.data) setOfferCtx(offerRes.data)
    setLoading(false)
  }

  function scrollToBottom() {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function startSession(scenario: typeof SCENARIOS[number]) {
    if (!profile?.id) return
    const initialMessages: Message[] = [
      { role: 'assistant', content: scenario.initialMessage },
    ]

    const { data } = await supabase
      .from('roleplay_sessions')
      .insert({
        user_id: profile.id,
        scenario_id: scenario.id,
        scenario_label: scenario.label,
        messages: initialMessages,
      })
      .select()
      .single()

    if (data) {
      setSession(data as RoleplaySession)
      setView('chat')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  async function sendMessage() {
    if (!input.trim() || !session || aiTyping) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    setInput('')

    const updatedMessages = [...session.messages, userMsg]
    const optimisticSession = { ...session, messages: updatedMessages }
    setSession(optimisticSession)
    setAiTyping(true)

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-roleplay`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authSession?.access_token ?? ''}` },
          body: JSON.stringify({
            mode: 'chat',
            scenario_id: session.scenario_id,
            scenario_label: session.scenario_label,
            messages: updatedMessages,
            offer_context: offerCtx ?? undefined,
            participant_name: profile?.full_name || 'Vendedor',
          }),
        }
      )

      const { reply } = await res.json()
      if (reply) {
        const withReply = [...updatedMessages, { role: 'assistant' as const, content: reply }]
        const newSession = { ...optimisticSession, messages: withReply }
        setSession(newSession)
        // Save to DB
        await supabase.from('roleplay_sessions').update({ messages: withReply }).eq('id', session.id)
      }
    } catch (e) {
      console.error('Chat error:', e)
    } finally {
      setAiTyping(false)
    }
  }

  async function endSession() {
    if (!session || gettingDebrief) return
    setGettingDebrief(true)

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-roleplay`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authSession?.access_token ?? ''}` },
          body: JSON.stringify({
            mode: 'debrief',
            scenario_id: session.scenario_id,
            scenario_label: session.scenario_label,
            messages: session.messages,
            offer_context: offerCtx ?? undefined,
            participant_name: profile?.full_name || 'Vendedor',
          }),
        }
      )

      const { debrief, score } = await res.json()
      if (debrief) {
        const updated = { ...session, debrief, score: score ?? null, ended_at: new Date().toISOString() }
        setSession(updated)
        await supabase.from('roleplay_sessions').update({
          debrief,
          score: score ?? null,
          ended_at: new Date().toISOString(),
        }).eq('id', session.id)
        // Refresh sessions list
        init()
        scrollToBottom()
      }
    } catch (e) {
      console.error('Debrief error:', e)
    } finally {
      setGettingDebrief(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const currentScenario = SCENARIOS.find(s => s.id === session?.scenario_id)

  // ── Loading ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <div className="w-6 h-6 rounded-full animate-spin" style={{ border: `2px solid ${GOLD}`, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  // ── CHAT view ───────────────────────────────────────────────────────
  if (view === 'chat' && session) {
    const isEnded = !!session.ended_at
    const accentColor = currentScenario?.color ?? GOLD

    return (
      <div className="flex flex-col h-screen" style={{ background: '#0A0A0A' }}>

        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <button onClick={() => { setView('home'); setSession(null) }}
              className="text-gray-400 hover:text-white transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{currentScenario?.emoji}</span>
                <p className="text-white font-semibold text-sm">{session.scenario_label}</p>
                {isEnded && session.score && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: scoreColor(session.score) + '22', color: scoreColor(session.score) }}>
                    {session.score}/10
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{session.messages.length} mensajes</p>
            </div>
          </div>
          {!isEnded && (
            <button
              onClick={endSession}
              disabled={gettingDebrief || session.messages.length < 3}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
              style={{ background: '#EF444422', color: '#F87171', border: '1px solid #EF444444' }}
            >
              {gettingDebrief ? <Loader2 size={12} className="animate-spin" /> : <Square size={12} />}
              {gettingDebrief ? 'Analizando...' : 'Terminar'}
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

          {/* Scenario tip */}
          {currentScenario?.tip && (
            <div className="rounded-lg px-3 py-2 text-center"
              style={{ background: `${accentColor}0A`, border: `1px solid ${accentColor}22` }}>
              <p className="text-xs" style={{ color: accentColor }}>💡 {currentScenario.tip}</p>
            </div>
          )}

          {session.messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-0.5"
                  style={{ background: accentColor + '22', border: `1px solid ${accentColor}44` }}>
                  🎭
                </div>
              )}
              <div
                className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={{
                  background: msg.role === 'user' ? `${GOLD}22` : SURFACE,
                  border: `1px solid ${msg.role === 'user' ? GOLD + '44' : BORDER}`,
                  color: msg.role === 'user' ? '#E5D28A' : '#D1D5DB',
                  borderBottomRightRadius: msg.role === 'user' ? 4 : undefined,
                  borderBottomLeftRadius: msg.role === 'assistant' ? 4 : undefined,
                }}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}

          {/* AI typing indicator */}
          {aiTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm mr-2" style={{ background: accentColor + '22' }}>🎭</div>
              <div className="rounded-2xl rounded-bl px-4 py-3 flex items-center gap-1.5"
                style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: accentColor, animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Getting debrief */}
          {gettingDebrief && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-xl p-4 text-center"
              style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 100%)', border: '1px solid #7C3AED44' }}>
              <Loader2 size={20} className="animate-spin mx-auto mb-2 text-purple-400" />
              <p className="text-sm text-purple-300">El coach está analizando la conversación...</p>
            </motion.div>
          )}

          {/* Debrief */}
          <AnimatePresence>
            {session.debrief && !gettingDebrief && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-5"
                style={{ background: 'linear-gradient(135deg, #0d0d1f 0%, #1a1030 100%)', border: '1px solid #7C3AED55' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#A78BFA' }}>
                    🎓 Debrief de coaching
                  </p>
                  {session.score && (
                    <span className="text-sm font-bold px-3 py-1 rounded-full"
                      style={{ background: scoreColor(session.score) + '22', color: scoreColor(session.score) }}>
                      {session.score}/10
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {renderDebrief(session.debrief)}
                </div>
                <button
                  onClick={() => { setView('home'); setSession(null) }}
                  className="w-full mt-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                  style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: '#aaa' }}
                >
                  Volver al inicio
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {!isEnded && (
          <div className="flex-shrink-0 px-4 pb-4 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                rows={2}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe como si fuera una conversación real... (Enter para enviar)"
                disabled={aiTyping}
                className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white resize-none outline-none disabled:opacity-50"
                style={{ background: SURFACE, border: `1px solid #2A2A2A` }}
                onFocus={e => (e.target.style.borderColor = GOLD + '88')}
                onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || aiTyping}
                className="p-3 rounded-xl transition-all disabled:opacity-40 flex-shrink-0"
                style={{ background: GOLD, color: '#0A0A0A' }}
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-600 text-center mt-2">
              {session.messages.filter(m => m.role === 'user').length} respuesta{session.messages.filter(m => m.role === 'user').length !== 1 ? 's' : ''} dadas · Mínimo 2 para obtener debrief
            </p>
          </div>
        )}
      </div>
    )
  }

  // ── HOME view ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Users size={18} style={{ color: GOLD }} />
            <p className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>Sales Roleplay™</p>
          </div>
          <h1 className="text-2xl font-bold text-white">Practica antes de la llamada real</h1>
          <p className="text-gray-400 text-sm mt-1">
            La IA juega al prospecto escéptico. Tú practicas. El coach te da feedback al final.
          </p>
        </motion.div>

        {/* No offer warning */}
        {!offerCtx?.one_liner && (
          <div className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3"
            style={{ background: `${GOLD}0A`, border: `1px solid ${GOLD}33` }}>
            <span>💡</span>
            <p className="text-xs" style={{ color: GOLD }}>
              Completa el Offer Builder primero — la IA usará tu oferta para hacer el roleplay más realista.
            </p>
          </div>
        )}

        {/* Scenario selector */}
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Elige tu escenario</p>
        <div className="space-y-2 mb-8">
          {SCENARIOS.map((scenario, i) => (
            <motion.button
              key={scenario.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => startSession(scenario)}
              className="w-full rounded-xl p-4 text-left flex items-center gap-4 hover:scale-[1.01] transition-all"
              style={{ background: SURFACE, border: `1px solid ${scenario.color}33` }}
            >
              <span className="text-3xl flex-shrink-0">{scenario.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-white font-semibold text-sm">{scenario.label}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: scenario.difficultyColor + '22', color: scenario.difficultyColor }}>
                    {scenario.difficulty}
                  </span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">{scenario.description}</p>
              </div>
              <ChevronLeft size={16} className="rotate-180 flex-shrink-0" style={{ color: scenario.color + '88' }} />
            </motion.button>
          ))}
        </div>

        {/* Past sessions */}
        {sessions.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Sesiones anteriores</p>
            <div className="space-y-2">
              {sessions.slice(0, 5).map(s => {
                const sc = SCENARIOS.find(x => x.id === s.scenario_id)
                return (
                  <motion.button
                    key={s.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    onClick={() => { setSession(s); setView('chat') }}
                    className="w-full rounded-xl px-4 py-3 flex items-center justify-between hover:opacity-80 transition-all"
                    style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl flex-shrink-0">{sc?.emoji ?? '💬'}</span>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{s.scenario_label}</p>
                        <p className="text-gray-600 text-xs">
                          {new Date(s.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          {' · '}{s.messages.length} mensajes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {s.score && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: scoreColor(s.score) + '22', color: scoreColor(s.score) }}>
                          {s.score}/10
                        </span>
                      )}
                      {!s.ended_at && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: `${GOLD}22`, color: GOLD }}>
                          En curso
                        </span>
                      )}
                      <RotateCcw size={13} className="text-gray-600" />
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
