import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

type Mode = 'password' | 'magic'

const GOLD = '#C9A84C'

export default function LoginPage() {
  const { signInWithMagicLink, signInWithPassword } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode]         = useState<Mode>('password')
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const inputStyle = {
    background: '#0A0A0A',
    border: '1px solid #2A2A2A',
    color: 'white',
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signInWithPassword(email.trim(), password)
    if (error) {
      if (error.message.toLowerCase().includes('invalid')) {
        setError('Email o contraseña incorrectos. Si es tu primera vez, usa "Primer acceso / olvidé mi contraseña".')
      } else {
        setError(error.message)
      }
    }
    setLoading(false)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signInWithMagicLink(email.trim())
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0A0A0A' }}>
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] mb-3 uppercase" style={{ color: GOLD }}>
            Carmen Victoria Pardo
          </p>
          <h1 className="text-3xl font-bold text-white mb-1">THE MONEY LAB™</h1>
          <p className="text-lg font-light text-gray-400">IGNITE OS</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>

          {/* ── SENT confirmation ── */}
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="text-white text-xl font-semibold mb-2">Revisa tu email</h2>
              <p className="text-gray-400 text-sm">
                Enviamos un enlace a{' '}
                <span style={{ color: GOLD }}>{email}</span>
              </p>
              <p className="text-gray-500 text-xs mt-3">
                El enlace expira en 1 hora. Revisa también spam.
              </p>
              <button
                onClick={() => { setSent(false); setMode('password'); setError('') }}
                className="mt-5 text-xs text-gray-500 hover:text-white transition-colors"
              >
                ← Volver al login
              </button>
            </div>

          /* ── PASSWORD login ── */
          ) : mode === 'password' ? (
            <>
              <h2 className="text-white text-xl font-semibold mb-1">Bienvenida</h2>
              <p className="text-gray-400 text-sm mb-5">Ingresa tu email y contraseña.</p>

              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com" required autoComplete="username"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Contraseña</label>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required autoComplete="current-password"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                    style={inputStyle}
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-xs leading-relaxed">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full py-3 rounded-lg font-semibold text-sm tracking-wide transition-all disabled:opacity-40"
                  style={{ background: GOLD, color: '#0A0A0A' }}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>

              {/* Divider */}
              <div className="mt-5 pt-5" style={{ borderTop: '1px solid #2A2A2A' }}>
                <p className="text-center text-xs text-gray-500 mb-3">
                  ¿Primera vez o no recuerdas tu contraseña?
                </p>
                <button
                  onClick={() => { setMode('magic'); setError('') }}
                  className="w-full py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{ background: 'transparent', color: GOLD, border: `1px solid ${GOLD}44` }}
                >
                  Primer acceso / Olvidé mi contraseña
                </button>
              </div>
            </>

          /* ── MAGIC LINK ── */
          ) : (
            <>
              <button
                onClick={() => { setMode('password'); setError('') }}
                className="text-xs text-gray-500 hover:text-white transition-colors mb-5 flex items-center gap-1"
              >
                ← Volver
              </button>
              <h2 className="text-white text-xl font-semibold mb-1">Enlace de acceso</h2>
              <p className="text-gray-400 text-sm mb-5">
                Te enviamos un enlace por email para entrar. Desde el app podrás definir tu contraseña.
              </p>

              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com" required autoComplete="email"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                    style={inputStyle}
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-xs">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3 rounded-lg font-semibold text-sm tracking-wide transition-all disabled:opacity-40"
                  style={{ background: GOLD, color: '#0A0A0A' }}
                >
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          © 2026 Carmen Victoria Pardo · Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}
