import { useAuth } from '../hooks/useAuth'
import ClarityForm from '../components/clarity/ClarityForm'

const GOLD = '#C9A84C'

export default function DashboardPage() {
  const { profile, signOut } = useAuth()

  // Si no ha completado onboarding → mostrar Clarity Form
  if (!profile?.onboarded) {
    return <ClarityForm />
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0A' }}>
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1A1A1A' }}>
        <div>
          <span className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>THE MONEY LAB™</span>
          <p className="text-white font-semibold text-sm">IGNITE OS</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{profile?.email}</span>
          <button
            onClick={signOut}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Salir
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-white mb-2">
          Bienvenida, {profile?.full_name?.split(' ')[0] || 'Igniter'}
        </h1>
        <p className="text-gray-400 text-sm mb-8">Tu Dashboard IGNITE está en construcción. Sprint 2 coming soon.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'C.R.E.A.R. Scorecard', icon: '📊', status: 'Sprint 2' },
            { label: 'Strategic Review', icon: '🎯', status: 'Sprint 2' },
            { label: 'Identity Tracker™', icon: '🌟', status: 'Sprint 2' },
            { label: 'Weekly Standup', icon: '⚡', status: 'Sprint 2' },
            { label: 'First Revenue Ritual™', icon: '💰', status: 'Sprint 3' },
            { label: 'Blocker Protocol', icon: '🛡️', status: 'Sprint 3' },
          ].map(item => (
            <div
              key={item.label}
              className="rounded-xl p-5"
              style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
            >
              <span className="text-2xl">{item.icon}</span>
              <p className="text-white text-sm font-medium mt-2">{item.label}</p>
              <span className="text-xs mt-1 px-2 py-0.5 rounded-full" style={{ background: GOLD + '22', color: GOLD }}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
