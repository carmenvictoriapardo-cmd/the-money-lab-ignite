import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  LayoutDashboard, BarChart3, Star, Zap, Shield,
  Target, DollarSign, Crown, LogOut, Flame, Award, Lightbulb,
} from 'lucide-react'

const GOLD = '#C9A84C'
const BG = '#0A0A0A'
const SURFACE = '#111111'
const BORDER = '#1E1E1E'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/accion',    icon: Flame,           label: 'Acción' },
  { to: '/oferta',    icon: Lightbulb,       label: 'Mi Oferta' },
  { to: '/crear',     icon: BarChart3,       label: 'C.R.E.A.R.' },
  { to: '/identidad', icon: Star,            label: 'Identidad' },
  { to: '/standup',   icon: Zap,             label: 'Standup' },
  { to: '/bloqueos',  icon: Shield,          label: 'Bloqueos' },
  { to: '/reviews',   icon: Target,          label: 'Reviews' },
  { to: '/revenue',   icon: DollarSign,      label: 'Revenue' },
  { to: '/evidencia', icon: Award,           label: 'Evidencias' },
]

export default function AppLayout() {
  const { profile, signOut, getCurrentDay } = useAuth()
  const navigate = useNavigate()
  const day = getCurrentDay()
  const pct = Math.round((day / 90) * 100)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG }}>

      {/* ─── Sidebar (desktop) ─────────────────────────── */}
      <aside
        className="hidden md:flex flex-col"
        style={{
          width: 220,
          minWidth: 220,
          background: SURFACE,
          borderRight: `1px solid ${BORDER}`,
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <p className="text-xs tracking-[0.25em] uppercase font-medium" style={{ color: GOLD }}>
            THE MONEY LAB™
          </p>
          <p className="text-white text-sm font-bold mt-0.5">IGNITE OS</p>

          {/* Program progress */}
          {profile?.onboarded && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Día {day} de 90</span>
                <span style={{ color: GOLD }}>{pct}%</span>
              </div>
              <div className="h-1 rounded-full" style={{ background: '#2A2A2A' }}>
                <div
                  className="h-1 rounded-full transition-all"
                  style={{ width: `${pct}%`, background: GOLD }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive ? 'font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? GOLD : undefined,
                background: isActive ? `${GOLD}15` : undefined,
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} style={{ color: isActive ? GOLD : undefined }} />
                  {label}
                </>
              )}
            </NavLink>
          ))}

          {/* Admin link */}
          {profile?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive ? 'font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? '#F59E0B' : undefined,
                background: isActive ? '#F59E0B15' : undefined,
              })}
            >
              {({ isActive }) => (
                <>
                  <Crown size={16} style={{ color: isActive ? '#F59E0B' : undefined }} />
                  Admin
                </>
              )}
            </NavLink>
          )}
        </nav>

        {/* User / sign out */}
        <div className="px-4 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: `${GOLD}33`, color: GOLD }}
            >
              {(profile?.full_name || profile?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {profile?.full_name || 'Igniter'}
              </p>
              <p className="text-gray-500 text-xs truncate">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors w-full"
          >
            <LogOut size={13} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ─── Main content ──────────────────────────────── */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* ─── Bottom nav (mobile) ───────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center py-2 px-1"
        style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, zIndex: 50 }}
      >
        {[...NAV_ITEMS, ...(profile?.role === 'admin' ? [{ to: '/admin', icon: Crown, label: 'Admin' }] : [])].map(
          ({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 px-2 py-1"
              style={({ isActive }) => ({ color: isActive ? GOLD : '#6B7280' })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} style={{ color: isActive ? GOLD : '#6B7280' }} />
                  <span className="text-xs">{label}</span>
                  {to === '/standup' && (
                    <Flame size={8} style={{ color: GOLD, marginTop: -2 }} />
                  )}
                </>
              )}
            </NavLink>
          )
        )}
      </nav>
    </div>
  )
}
