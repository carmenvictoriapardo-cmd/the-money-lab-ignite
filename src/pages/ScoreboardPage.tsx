import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { RefreshCw, Flame, TrendingUp, DollarSign, Zap } from 'lucide-react'

const GOLD    = '#C9A84C'
const BG      = '#0A0A0A'
const SURFACE = '#111111'
const BORDER  = '#1E1E1E'

interface ScoreEntry {
  id:             string
  name:           string
  igniteScore:    number
  latestCrear:    number
  totalRevenue:   number
  standupsCount:  number
  latestIdentity: number
  streak:         number
}

const MEDALS = ['🥇', '🥈', '🥉']
const RANK_COLORS = ['#F59E0B', '#9CA3AF', '#CD7F32']

export default function ScoreboardPage() {
  const { profile } = useAuth()
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [scores, setScores]         = useState<ScoreEntry[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => { fetchScoreboard() }, [])

  async function fetchScoreboard(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-scoreboard`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      )
      const data: ScoreEntry[] = await res.json()
      if (Array.isArray(data)) {
        setScores(data)
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
    setRefreshing(false)
  }

  const myRank   = scores.findIndex(s => s.id === profile?.id) + 1
  const myScore  = scores.find(s => s.id === profile?.id)
  const maxScore = scores[0]?.igniteScore || 100

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="w-6 h-6 rounded-full animate-spin" style={{ border: `2px solid ${GOLD}`, borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: BG }}>
      <div className="max-w-2xl mx-auto">

        {/* ── HEADER ──────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: GOLD }}>
                THE MONEY LAB™
              </p>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                🏆 Scoreboard
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Ranking de la cohorte · Presión positiva
              </p>
            </div>
            <button
              onClick={() => fetchScoreboard(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl transition-all disabled:opacity-50"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} style={{ color: GOLD }} />
            </button>
          </div>

          {/* My position banner */}
          {myScore && myRank > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 rounded-2xl p-4 flex items-center gap-4"
              style={{ background: `${GOLD}18`, border: `1.5px solid ${GOLD}44` }}
            >
              <div className="text-3xl">{MEDALS[myRank - 1] || `#${myRank}`}</div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">Tu posición actual</p>
                <p className="text-white font-bold text-lg">
                  #{myRank} · {myScore.igniteScore} pts
                </p>
              </div>
              <div className="text-right">
                {myScore.streak > 0 && (
                  <p className="text-sm font-semibold" style={{ color: '#EF4444' }}>
                    🔥 {myScore.streak} días
                  </p>
                )}
                {myScore.totalRevenue > 0 && (
                  <p className="text-sm font-semibold text-green-400">
                    ${myScore.totalRevenue.toLocaleString()}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* ── LEGEND ──────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-4 px-1 flex-wrap">
          {[
            { icon: TrendingUp, label: 'C.R.E.A.R.', color: '#60A5FA' },
            { icon: DollarSign, label: 'Revenue',    color: '#4ADE80' },
            { icon: Zap,        label: 'Standups',   color: GOLD       },
            { icon: Flame,      label: 'Racha',      color: '#EF4444'  },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <Icon size={10} style={{ color }} />
              <span className="text-xs text-gray-600">{label}</span>
            </div>
          ))}
        </div>

        {/* ── RANKINGS ────────────────────────────────────── */}
        {scores.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-gray-400">Aún no hay datos en el scoreboard.</p>
            <p className="text-gray-600 text-sm mt-1">Completa actividades para aparecer en el ranking.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scores.map((entry, i) => {
              const isMe      = entry.id === profile?.id
              const rankColor = RANK_COLORS[i] || '#4B5563'
              const barWidth  = maxScore > 0 ? (entry.igniteScore / maxScore) * 100 : 0

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl p-4 transition-all"
                  style={{
                    background: isMe ? `${GOLD}10` : SURFACE,
                    border: `1.5px solid ${isMe ? GOLD + '55' : BORDER}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-8 text-center flex-shrink-0">
                      {i < 3 ? (
                        <span className="text-xl">{MEDALS[i]}</span>
                      ) : (
                        <span className="text-sm font-bold" style={{ color: rankColor }}>#{i + 1}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        background: isMe ? `${GOLD}33` : '#1E1E1E',
                        color: isMe ? GOLD : '#6B7280',
                        border: `1px solid ${isMe ? GOLD + '44' : '#2A2A2A'}`,
                      }}>
                      {entry.name[0].toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-white truncate">
                          {entry.name}
                          {isMe && <span className="ml-1 text-xs" style={{ color: GOLD }}>(tú)</span>}
                        </p>
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {entry.latestCrear > 0 && (
                          <span className="text-xs flex items-center gap-1" style={{ color: '#60A5FA' }}>
                            <TrendingUp size={9} />
                            {entry.latestCrear}%
                          </span>
                        )}
                        {entry.totalRevenue > 0 && (
                          <span className="text-xs flex items-center gap-1 text-green-400">
                            <DollarSign size={9} />
                            ${entry.totalRevenue.toLocaleString()}
                          </span>
                        )}
                        {entry.standupsCount > 0 && (
                          <span className="text-xs flex items-center gap-1" style={{ color: GOLD }}>
                            <Zap size={9} />
                            {entry.standupsCount}
                          </span>
                        )}
                        {entry.streak > 0 && (
                          <span className="text-xs flex items-center gap-1 text-red-400">
                            <Flame size={9} />
                            {entry.streak}d
                          </span>
                        )}
                      </div>

                      {/* Score bar */}
                      <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: '#2A2A2A' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: isMe ? GOLD : rankColor + 'BB' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ duration: 0.8, delay: i * 0.05 + 0.3 }}
                        />
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-black" style={{ color: isMe ? GOLD : rankColor }}>
                        {entry.igniteScore}
                      </p>
                      <p className="text-xs text-gray-600">pts</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* ── SCORE FORMULA ───────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-6 rounded-xl p-4"
          style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">
            Cómo se calcula el Score
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-500">
            <span>📊 C.R.E.A.R. último</span><span className="text-right" style={{ color: '#60A5FA' }}>35%</span>
            <span>💰 Revenue generado</span><span className="text-right text-green-400">hasta 20 pts</span>
            <span>⚡ Standups completados</span><span className="text-right" style={{ color: GOLD }}>hasta 20 pts</span>
            <span>⭐ Identidad semanal</span><span className="text-right" style={{ color: '#A78BFA' }}>15%</span>
            <span>🔥 Racha de días</span><span className="text-right text-red-400">hasta 10 pts</span>
          </div>
          {lastUpdated && (
            <p className="text-xs text-gray-700 mt-2">
              Actualizado: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </motion.div>

        <div className="h-8" />
      </div>
    </div>
  )
}
