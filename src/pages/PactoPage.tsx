import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { CheckCircle2, Flame } from 'lucide-react'

const GOLD = '#C9A84C'

export default function PactoPage() {
  const { profile, signPacto } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)
  const [error, setError] = useState('')

  async function handleSign() {
    if (!fullName.trim()) {
      setError('Por favor ingresa tu nombre completo para firmar.')
      return
    }
    setSigning(true)
    setError('')
    const { error: err } = await signPacto(fullName.trim())
    if (err) {
      setError('Hubo un problema. Intenta de nuevo.')
      setSigning(false)
      return
    }
    setSigned(true)
    setTimeout(() => navigate('/dashboard'), 2500)
  }

  if (signed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: '#0A0A0A' }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-6xl mb-4"
          >
            🔥
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">El Pacto está firmado.</h2>
          <p className="text-gray-400 text-sm mb-1">Bienvenida al programa, {fullName.split(' ')[0]}.</p>
          <p style={{ color: GOLD }} className="text-sm">Redirigiendo a tu dashboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: '#0A0A0A' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Flame size={20} style={{ color: GOLD }} />
            <p className="text-xs tracking-[0.3em] uppercase font-medium" style={{ color: GOLD }}>
              THE MONEY LAB™ IGNITE
            </p>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">El Pacto de Ejecución™</h1>
          <p className="text-gray-400 text-sm">El acuerdo más importante de tu programa</p>
        </motion.div>

        {/* El Pacto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-8 mb-6"
          style={{ background: '#111', border: `1px solid ${GOLD}33` }}
        >
          <div className="text-center mb-8">
            <span
              className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4"
              style={{ background: `${GOLD}22`, color: GOLD }}
            >
              Documento Oficial
            </span>
            <div className="w-12 h-px mx-auto mb-4" style={{ background: GOLD }} />
          </div>

          <div className="space-y-5 text-gray-300 text-sm leading-relaxed">
            <p>
              Este pacto define la relación entre <strong className="text-white">Carmen Victoria Pardo</strong> y tú
              durante los próximos <strong className="text-white">90 días</strong> del programa THE MONEY LAB™ IGNITE.
            </p>

            <div className="rounded-xl p-5" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
              <p className="font-semibold mb-3" style={{ color: GOLD }}>Tu compromiso:</p>
              <ul className="space-y-2">
                {[
                  'Completar el standup semanal cada semana sin excepción',
                  'Enviar tu C.R.E.A.R. Scorecard todos los lunes',
                  'Reportar cada bloqueo dentro de las 24h de identificarlo',
                  'Ejecutar las acciones de revenue que defines, no solo planificarlas',
                  'Ser honesta sobre tus resultados — los números no mienten',
                  'Pedir ayuda ANTES de rendirte',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 size={14} style={{ color: GOLD, marginTop: 2, flexShrink: 0 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl p-5" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
              <p className="font-semibold mb-3 text-white">Mi compromiso (Carmen):</p>
              <ul className="space-y-2">
                {[
                  'Responder cada Strategic Review dentro de 48 horas',
                  'Intervenir personalmente cuando detecte que estás bloqueada',
                  'No soltarte mientras tú estés ejecutando',
                  'Darte feedback directo, no solo validación',
                  'Compartir contigo exactamente lo que haría yo en tu situación',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-xl p-5 text-center"
              style={{ background: `${GOLD}11`, border: `1px solid ${GOLD}44` }}
            >
              <p className="text-base font-bold text-white mb-1">
                "Mientras ejecutes, yo no te suelto."
              </p>
              <p className="text-xs text-gray-400">— Carmen Victoria Pardo</p>
            </div>
          </div>
        </motion.div>

        {/* Firma */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-6"
          style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
        >
          <p className="text-white font-semibold mb-1">Firma con tu nombre completo</p>
          <p className="text-gray-400 text-sm mb-4">
            Al escribir tu nombre y presionar "Firmar El Pacto", aceptas los términos anteriores.
          </p>

          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Tu nombre completo"
            className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none mb-4"
            style={{
              background: '#0A0A0A',
              border: `1px solid #2A2A2A`,
              fontFamily: 'cursive',
              fontSize: '1.1rem',
            }}
            onFocus={e => (e.target.style.borderColor = GOLD)}
            onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
          />

          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

          <button
            onClick={handleSign}
            disabled={signing || !fullName.trim()}
            className="w-full py-4 rounded-xl font-bold text-base tracking-wide transition-all disabled:opacity-40"
            style={{ background: GOLD, color: '#0A0A0A' }}
          >
            {signing ? 'Firmando...' : '🔥 Firmar El Pacto y entrar al programa'}
          </button>

          <p className="text-gray-500 text-xs text-center mt-3">
            Fecha: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

      </div>
    </div>
  )
}
