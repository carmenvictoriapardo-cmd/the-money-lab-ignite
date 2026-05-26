import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signInWithMagicLink(email)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0A0A0A' }}>
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] text-yellow-500 mb-3 uppercase">Carmen Victoria Pardo</p>
          <h1 className="text-3xl font-bold text-white mb-1">THE MONEY LAB™</h1>
          <p className="text-lg font-light text-gray-400">IGNITE OS</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="text-white text-xl font-semibold mb-2">Revisa tu email</h2>
              <p className="text-gray-400 text-sm">
                Enviamos un enlace de acceso a <span className="text-yellow-500">{email}</span>
              </p>
              <p className="text-gray-500 text-xs mt-4">
                El enlace expira en 1 hora. Revisa también tu carpeta de spam.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-white text-xl font-semibold mb-1">Accede a tu programa</h2>
              <p className="text-gray-400 text-sm mb-6">
                Ingresa tu email para recibir un enlace de acceso seguro.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none focus:border-yellow-500 transition-colors"
                    style={{ background: '#0A0A0A', border: '1px solid #2A2A2A', color: 'white' }}
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3 rounded-lg font-semibold text-sm tracking-wide transition-all disabled:opacity-50"
                  style={{ background: '#C9A84C', color: '#0A0A0A' }}
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de acceso'}
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
