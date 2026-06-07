import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  LayoutDashboard, BarChart3, Star, Zap, Shield,
  Target, DollarSign, Crown, LogOut, Flame, Award, Lightbulb, Users, KeyRound, X, Bell, BellOff, BookOpen,
} from 'lucide-react'
import { usePushNotifications } from '../../hooks/usePushNotifications'

const GOLD = '#C9A84C'
const BG = '#0A0A0A'
const SURFACE = '#111111'
const BORDER = '#1E1E1E'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/accion',    icon: Flame,           label: 'Acción' },
  { to: '/oferta',    icon: Lightbulb,       label: 'Mi Oferta' },
  { to: '/roleplay',  icon: Users,           label: 'Roleplay' },
  { to: '/crear',     icon: BarChart3,       label: 'C.R.E.A.R.' },
  { to: '/identidad', icon: Star,            label: 'Identidad' },
  { to: '/standup',   icon: Zap,             label: 'Standup' },
  { to: '/bloqueos',  icon: Shield,          label: 'Bloqueos' },
  { to: '/reviews',   icon: Target,          label: 'Reviews' },
  { to: '/revenue',   icon: DollarSign,      label: 'Revenue' },
  { to: '/evidencia',   icon: Award,      label: 'Evidencias' },
  { to: '/storybrand',  icon: BookOpen,   label: 'StoryBrand' },
]

export default function AppLayout() {
  const { profile, signOut, setPassword, getCurrentDay } = useAuth()
  const navigate = useNavigate()
  const day = getCurrentDay()
  const pct = Math.round((day / 90) * 100)

  const { permission, subscribing, subscribe } = usePushNotifications()
  const [showNotifBanner, setShowNotifBanner] = useState(false)
  const [notifDone, setNotifDone] = useState(false)
  const [showPwModal, setShowPwModal] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  async function handleEnableNotifications() {
    const ok = await subscribe()
    if (ok) { setNotifDone(true); setShowNotifBanner(false) }
  }

  async function handleSetPassword() {
    if (newPw.length < 8) { setPwMsg({ ok: false, text: 'Mínimo 8 caracteres.' }); return }
    if (newPw !== confirmPw) { setPwMsg({ ok: false, text: 'Las contraseñas no coinciden.' }); return }
    setPwLoading(true)
    const { error } = await setPassword(newPw)
    if (error) {
      setPwMsg({ ok: false, text: error.message })
    } else {
      setPwMsg({ ok: true, text: '¡Contraseña guardada! Ya puedes usarla para entrar.' })
      setNewPw(''); setConfirmPw('')
      setTimeout(() => { setShowPwModal(false); setPwMsg(null) }, 2500)
    }
    setPwLoading(false)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG }}>

      {/* ─── Set Password Modal ────────────────────────── */}
      {showPwModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowPwModal(false) }}
        >
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KeyRound size={16} style={{ color: GOLD }} />
                <h3 className="text-white font-semibold">Definir contraseña</h3>
              </div>
              <button onClick={() => setShowPwModal(false)} className="text-gray-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <p className="text-gray-400 text-xs mb-4">
              Define una contraseña para entrar sin necesitar un enlace de email cada vez.
            </p>
            <div className="space-y-3">
              <input
                type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                placeholder="Nueva contraseña (mín. 8 caracteres)"
                className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
                style={{ background: '#0A0A0A', border: '1px solid #2A2A2A' }}
              />
              <input
                type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                placeholder="Confirmar contraseña"
                className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
                style={{ background: '#0A0A0A', border: '1px solid #2A2A2A' }}
                onKeyDown={e => e.key === 'Enter' && handleSetPassword()}
              />
              {pwMsg && (
                <p className={`text-xs px-3 py-2 rounded-lg ${pwMsg.ok ? 'text-green-400' : 'text-red-400'}`}
                  style={{ background: pwMsg.ok ? '#4ADE8011' : '#EF444411' }}>
                  {pwMsg.text}
                </p>
              )}
              <button
                onClick={handleSetPassword}
                disabled={pwLoading || !newPw || !confirmPw}
                className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 transition-all"
                style={{ background: GOLD, color: '#0A0A0A' }}
              >
                {pwLoading ? 'Guardando...' : 'Guardar contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
            >
              <LogOut size={13} />
              Salir
            </button>
            <span className="text-gray-700">·</span>
            <button
              onClick={() => { setShowPwModal(true); setPwMsg(null) }}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
              title="Definir contraseña"
            >
              <KeyRound size={13} />
              Clave
            </button>
            {permission !== 'unsupported' && (
              <>
                <span className="text-gray-700">·</span>
                <button
                  onClick={() => permission === 'granted' ? null : setShowNotifBanner(true)}
                  className="flex items-center gap-1.5 text-xs transition-colors"
                  style={{ color: permission === 'granted' ? '#4ADE80' : '#6B7280' }}
                  title={permission === 'granted' ? 'Notificaciones activas' : 'Activar notificaciones'}
                >
                  {permission === 'granted'
                    ? <><Bell size={13} /><span>Notif ✓</span></>
                    : <><BellOff size={13} /><span>Notif</span></>
                  }
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ─── Main content ──────────────────────────────── */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {/* Notification permission banner */}
        {permission === 'default' && !notifDone && !showNotifBanner && (
          <div
            className="mx-4 mt-3 px-4 py-3 rounded-xl flex items-center gap-3 cursor-pointer"
            style={{ background: '#C9A84C18', border: '1px solid #C9A84C44' }}
            onClick={() => setShowNotifBanner(true)}
          >
            <Bell size={16} style={{ color: GOLD, flexShrink: 0 }} />
            <p className="text-xs flex-1" style={{ color: GOLD }}>
              Activa las notificaciones para recibir tus reminders diarios 🔔
            </p>
            <button className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ background: GOLD, color: '#0A0A0A' }}>
              Activar
            </button>
          </div>
        )}

        {showNotifBanner && (
          <div
            className="mx-4 mt-3 px-4 py-4 rounded-xl"
            style={{ background: '#1A1A1A', border: `1px solid ${GOLD}66` }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bell size={15} style={{ color: GOLD }} />
                <p className="text-white text-sm font-semibold">Activar notificaciones</p>
              </div>
              <button onClick={() => setShowNotifBanner(false)} className="text-gray-500 hover:text-white">
                <X size={14} />
              </button>
            </div>
            <p className="text-gray-400 text-xs mb-3">Recibirás reminders para tu standup, tu acción diaria y tu racha. Puedes desactivarlas cuando quieras.</p>
            <div className="flex gap-2">
              <button
                onClick={handleEnableNotifications}
                disabled={subscribing}
                className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                style={{ background: GOLD, color: '#0A0A0A' }}
              >
                {subscribing ? 'Activando...' : '🔔 Activar ahora'}
              </button>
              <button onClick={() => setShowNotifBanner(false)} className="px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-white">
                Ahora no
              </button>
            </div>
          </div>
        )}

        {notifDone && (
          <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl flex items-center gap-2" style={{ background: '#4ADE8011', border: '1px solid #4ADE8044' }}>
            <Bell size={14} className="text-green-400" />
            <p className="text-green-400 text-xs">¡Notificaciones activadas! Recibirás tus reminders diarios.</p>
          </div>
        )}

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
