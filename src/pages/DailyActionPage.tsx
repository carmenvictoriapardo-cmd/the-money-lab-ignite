import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Zap, CheckCircle2, Sparkles, Loader2, Flame } from 'lucide-react'

const GOLD = '#C9A84C'
const SURFACE = '#111111'
const BORDER = '#1E1E1E'

interface DailyAction {
  id: string
  user_id: string
  action_date: string
  action_text: string
  completed: boolean
  completed_at: string | null
  created_at: string
}

function parseAISuggestion(raw: string): { action: string; why: string; time: string } {
  const actionMatch = raw.match(/ACCI[ÓO]N:\s*(.+?)(?=\n\nPOR|$)/s)
  const whyMatch = raw.match(/POR QU[ÉE] HOY:\s*(.+?)(?=\n\nTIEMPO|$)/s)
  const timeMatch = raw.match(/TIEMPO:\s*(.+?)$/s)
  return {
    action: actionMatch?.[1]?.trim() ?? raw.trim(),
    why: whyMatch?.[1]?.trim() ?? '',
    time: timeMatch?.[1]?.trim() ?? '',
  }
}

export default function DailyActionPage() {
  const { profile, getCurrentWeek, getCurrentDay } = useAuth()
  const week = getCurrentWeek()
  const day = getCurrentDay()

  const today = new Date().toISOString().split('T')[0]

  const [todayAction, setTodayAction] = useState<DailyAction | null>(null)
  const [history, setHistory] = useState<DailyAction[]>([])
  const [streak, setStreak] = useState(0)
  const [actionText, setActionText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestion, setSuggestion] = useState<{ action: string; why: string; time: string } | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => { if (profile?.id) fetchData() }, [profile?.id])

  async function fetchData() {
    if (!profile?.id) return
    setDataLoading(true)

    const { data } = await supabase
      .from('daily_revenue_actions')
      .select('*')
      .eq('user_id', profile.id)
      .order('action_date', { ascending: false })
      .limit(30)

    if (data) {
      const todayEntry = data.find(d => d.action_date === today) ?? null
      setTodayAction(todayEntry)
      setHistory(data.filter(d => d.action_date !== today))
      setStreak(calcStreak(data))
    }
    setDataLoading(false)
  }

  function calcStreak(actions: DailyAction[]): number {
    // Count consecutive completed days going back from yesterday
    const sorted = [...actions]
      .filter(a => a.completed)
      .sort((a, b) => b.action_date.localeCompare(a.action_date))

    if (!sorted.length) return 0

    let streak = 0
    const msPerDay = 24 * 60 * 60 * 1000
    // Start from today or yesterday depending on whether today is already done
    const todayDone = sorted[0]?.action_date === today
    let checkDate = new Date(todayDone ? today : new Date(Date.now() - msPerDay).toISOString().split('T')[0])

    for (const action of sorted) {
      const actionDate = new Date(action.action_date + 'T00:00:00')
      const diff = Math.round((checkDate.getTime() - actionDate.getTime()) / msPerDay)
      if (diff === 0) {
        streak++
        checkDate = new Date(checkDate.getTime() - msPerDay)
      } else {
        break
      }
    }
    return streak
  }

  async function handleSubmit() {
    if (!profile?.id || !actionText.trim()) return
    setSubmitting(true)
    const { data } = await supabase
      .from('daily_revenue_actions')
      .upsert({
        user_id: profile.id,
        action_date: today,
        action_text: actionText.trim(),
        completed: false,
      }, { onConflict: 'user_id,action_date' })
      .select()
      .single()
    if (data) setTodayAction(data)
    setActionText('')
    setSuggestion(null)
    setSubmitting(false)
  }

  async function handleComplete() {
    if (!todayAction?.id) return
    setCompleting(true)
    const { data } = await supabase
      .from('daily_revenue_actions')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', todayAction.id)
      .select()
      .single()
    if (data) {
      setTodayAction(data)
      setStreak(prev => prev + (prev === 0 || isStreakAlive() ? 1 : 1))
      fetchData() // recalculate
    }
    setCompleting(false)
  }

  function isStreakAlive(): boolean {
    // Check if yesterday had a completed action
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    return history.some(a => a.action_date === yesterday && a.completed)
  }

  async function handleSuggest() {
    if (!profile?.id) return
    setSuggesting(true)
    setSuggestion(null)

    try {
      // Fetch context
      const [crearRes, revenueRes, blockerRes] = await Promise.all([
        supabase.from('weekly_scores').select('crear_scores, total_score').eq('user_id', profile.id).order('week_number', { ascending: false }).limit(1),
        supabase.from('revenue_events').select('amount').eq('user_id', profile.id),
        supabase.from('blocker_logs').select('blocker_type, description').eq('user_id', profile.id).eq('resolved', false),
      ])

      const lastActions = history
        .filter(a => a.completed)
        .slice(0, 3)
        .map(a => a.action_text)

      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-daily-action`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({
            participant_name: profile.full_name || profile.email,
            week_number: week,
            day_of_program: day,
            crear_scores: crearRes.data?.[0]?.crear_scores ?? undefined,
            revenue_total: (revenueRes.data ?? []).reduce((s: number, e: any) => s + Number(e.amount), 0),
            active_blockers: (blockerRes.data ?? []).map((b: any) => ({
              type: b.blocker_type,
              description: b.description,
            })),
            last_actions: lastActions,
          }),
        }
      )

      if (res.ok) {
        const { suggestion: raw } = await res.json()
        if (raw) {
          const parsed = parseAISuggestion(raw)
          setSuggestion(parsed)
          setActionText(parsed.action)
        }
      }
    } catch (e) {
      console.error('Suggestion error:', e)
    } finally {
      setSuggesting(false)
    }
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <div className="w-6 h-6 rounded-full animate-spin" style={{ border: `2px solid ${GOLD}`, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const isToday = dateStr === today
    const action = isToday ? todayAction : history.find(a => a.action_date === dateStr)
    return { dateStr, isToday, action, label: d.toLocaleDateString('es-ES', { weekday: 'short' }) }
  })

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={18} style={{ color: GOLD }} />
            <p className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>Acción Diaria</p>
          </div>
          <h1 className="text-2xl font-bold text-white">¿Qué harás hoy?</h1>
          <p className="text-gray-400 text-sm mt-1">Una acción de revenue al día. Sin excusas.</p>
        </motion.div>

        {/* Streak banner */}
        {streak > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-4 mb-6 flex items-center gap-4"
            style={{
              background: streak >= 7
                ? 'linear-gradient(135deg, #1a0900 0%, #200d00 100%)'
                : 'linear-gradient(135deg, #1a1000 0%, #1a1100 100%)',
              border: `1px solid ${streak >= 7 ? '#F59E0B66' : GOLD + '44'}`,
            }}
          >
            <div className="text-4xl">{streak >= 14 ? '🔥🔥' : streak >= 7 ? '🔥' : '⚡'}</div>
            <div>
              <p className="text-white font-bold text-xl">{streak} {streak === 1 ? 'día' : 'días'} seguidos</p>
              <p className="text-sm" style={{ color: streak >= 7 ? '#F59E0B' : GOLD }}>
                {streak >= 14 ? '¡Imparable! Racha élite 🏆' :
                 streak >= 7  ? '¡Una semana completa! Sigue.' :
                 streak >= 3  ? 'Construyendo el hábito 💪' :
                                'Racha activa — no la rompas'}
              </p>
            </div>
          </motion.div>
        )}

        {/* 7-day calendar dots */}
        <div className="grid grid-cols-7 gap-1.5 mb-6">
          {weekDays.map(({ dateStr, isToday, action, label }) => {
            const done = action?.completed
            const set = !!action && !done
            return (
              <div key={dateStr} className="flex flex-col items-center gap-1">
                <p className="text-xs text-gray-600 capitalize">{label}</p>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: done ? '#4ADE8033' : set ? `${GOLD}22` : isToday ? '#FFFFFF08' : '#0A0A0A',
                    border: `1px solid ${done ? '#4ADE8066' : set ? GOLD + '55' : isToday ? '#3A3A3A' : '#1A1A1A'}`,
                    color: done ? '#4ADE80' : set ? GOLD : '#444',
                  }}
                >
                  {done ? '✓' : set ? '·' : isToday ? <Flame size={12} style={{ color: GOLD }} /> : ''}
                </div>
              </div>
            )
          })}
        </div>

        {/* TODAY'S ACTION ─────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* Completed state */}
          {todayAction?.completed && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-6 text-center mb-6"
              style={{ background: 'linear-gradient(135deg, #052014 0%, #071a0e 100%)', border: '1px solid #4ADE8055' }}
            >
              <CheckCircle2 size={40} className="mx-auto mb-3 text-green-400" />
              <p className="text-white font-bold text-lg mb-2">¡Acción completada hoy! 🎉</p>
              <p className="text-gray-400 text-sm mb-3 leading-relaxed">"{todayAction.action_text}"</p>
              <p className="text-xs" style={{ color: '#4ADE80' }}>
                {streak} {streak === 1 ? 'día' : 'días'} de racha activa
              </p>
            </motion.div>
          )}

          {/* Action set but not done */}
          {todayAction && !todayAction.completed && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 mb-6"
              style={{ background: SURFACE, border: `1px solid ${GOLD}55` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: GOLD }} />
                <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: GOLD }}>Tu acción de hoy</p>
              </div>
              <p className="text-white font-medium leading-relaxed mb-5">
                {todayAction.action_text}
              </p>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-98 disabled:opacity-50"
                style={{ background: '#4ADE80', color: '#052014' }}
              >
                {completing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {completing ? 'Marcando...' : '✓ La hice — marcar como completada'}
              </button>
            </motion.div>
          )}

          {/* No action yet */}
          {!todayAction && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 mb-6"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <p className="text-white font-semibold mb-1">Comprométete con una acción</p>
              <p className="text-gray-500 text-sm mb-4">
                Escríbela tú o deja que la IA te sugiera una basada en tus datos.
              </p>

              {/* AI suggestion card */}
              <AnimatePresence>
                {suggestion && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="rounded-xl p-4 mb-4"
                    style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 100%)', border: '1px solid #7C3AED44' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={12} className="text-purple-400" />
                      <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#A78BFA' }}>
                        Sugerencia IA
                      </p>
                    </div>
                    {suggestion.why && (
                      <p className="text-gray-400 text-xs mb-2 leading-relaxed">{suggestion.why}</p>
                    )}
                    {suggestion.time && (
                      <p className="text-xs" style={{ color: '#A78BFA' }}>⏱ {suggestion.time}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2 italic">↓ Cargada en el campo — edítala si quieres</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <textarea
                rows={3}
                value={actionText}
                onChange={e => setActionText(e.target.value)}
                placeholder="Ej: Enviar mensaje de seguimiento a 3 prospectos en Instagram con mi propuesta..."
                className="w-full px-3 py-2.5 rounded-lg text-sm text-white resize-none outline-none mb-3"
                style={{ background: '#0A0A0A', border: `1px solid #2A2A2A` }}
                onFocus={e => (e.target.style.borderColor = GOLD)}
                onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
              />

              <div className="flex gap-2">
                <button
                  onClick={handleSuggest}
                  disabled={suggesting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                  style={{ background: '#7C3AED22', color: '#A78BFA', border: '1px solid #7C3AED44' }}
                >
                  {suggesting
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Sparkles size={13} />
                  }
                  {suggesting ? 'IA pensando...' : 'IA sugiere'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!actionText.trim() || submitting}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-40 transition-all"
                  style={{ background: GOLD, color: '#0A0A0A' }}
                >
                  {submitting ? 'Guardando...' : 'Comprometerse'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {history.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Historial reciente</p>
            <div className="space-y-2">
              {history.slice(0, 10).map(a => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: a.completed ? '#4ADE8008' : '#ffffff04',
                    border: `1px solid ${a.completed ? '#4ADE8022' : '#1A1A1A'}`,
                    opacity: a.completed ? 1 : 0.5,
                  }}
                >
                  <span className="text-sm flex-shrink-0 mt-0.5">
                    {a.completed ? '✅' : '⬜'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-snug ${a.completed ? 'text-gray-300' : 'text-gray-500'}`}>
                      {a.action_text}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {new Date(a.action_date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
