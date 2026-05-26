import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const GOLD = '#C9A84C'

interface Applicant {
  id: string
  email: string
  full_name: string
  clarity_score: number
  submitted_at: string
  score_breakdown: Record<string, number>
  status: string
}

export default function AdminPage() {
  const { profile, signOut } = useAuth()
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Applicant | null>(null)

  useEffect(() => {
    fetchApplicants()
  }, [])

  async function fetchApplicants() {
    const { data } = await supabase
      .from('clarity_responses')
      .select(`
        id, submitted_at, clarity_score, score_breakdown, status,
        profiles (id, email, full_name)
      `)
      .order('submitted_at', { ascending: false })

    if (data) {
      setApplicants(data.map((r: any) => ({
        id: r.id,
        email: r.profiles?.email || '',
        full_name: r.profiles?.full_name || '',
        clarity_score: r.clarity_score,
        submitted_at: r.submitted_at,
        score_breakdown: r.score_breakdown,
        status: r.status,
      })))
    }
    setLoading(false)
  }

  async function markReviewed(id: string) {
    await supabase.from('clarity_responses').update({ status: 'reviewed' }).eq('id', id)
    fetchApplicants()
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <p className="text-gray-400">Acceso restringido.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0A' }}>
      <nav className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1A1A1A' }}>
        <div>
          <span className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>ADMIN</span>
          <p className="text-white font-semibold text-sm">THE MONEY LAB™ IGNITE</p>
        </div>
        <button onClick={signOut} className="text-xs text-gray-500 hover:text-white">Salir</button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-xl font-bold text-white mb-2">Portal Carmen — Aplicantes</h1>
        <p className="text-gray-400 text-sm mb-8">{applicants.length} aplicantes registradas</p>

        {loading ? (
          <p className="text-gray-400 text-sm">Cargando...</p>
        ) : (
          <div className="space-y-3">
            {applicants.map(a => (
              <div
                key={a.id}
                className="rounded-xl p-5 cursor-pointer transition-all"
                onClick={() => setSelected(selected?.id === a.id ? null : a)}
                style={{
                  background: '#1A1A1A',
                  border: `1px solid ${selected?.id === a.id ? GOLD : '#2A2A2A'}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{a.full_name || a.email}</p>
                    <p className="text-gray-400 text-xs">{a.email} · {new Date(a.submitted_at).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: GOLD }}>{a.clarity_score}</p>
                    <p className="text-xs text-gray-500">Clarity Score</p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: a.status === 'reviewed' ? '#4ADE8022' : GOLD + '22',
                        color: a.status === 'reviewed' ? '#4ADE80' : GOLD,
                      }}
                    >
                      {a.status === 'reviewed' ? '✓ Revisada' : 'Pendiente'}
                    </span>
                  </div>
                </div>

                {selected?.id === a.id && (
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid #2A2A2A' }}>
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {Object.entries(a.score_breakdown).map(([k, v]) => (
                        <div key={k} className="text-center">
                          <p className="text-xs text-gray-400 capitalize mb-1">{k}</p>
                          <p className="font-bold" style={{ color: GOLD }}>{v}%</p>
                        </div>
                      ))}
                    </div>
                    {a.status !== 'reviewed' && (
                      <button
                        onClick={e => { e.stopPropagation(); markReviewed(a.id) }}
                        className="text-xs px-4 py-2 rounded-lg font-medium"
                        style={{ background: GOLD, color: '#0A0A0A' }}
                      >
                        Marcar como revisada
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
