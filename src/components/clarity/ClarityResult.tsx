import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const GOLD = '#C9A84C'
const SECTIONS_META: Record<string, { label: string; icon: string }> = {
  identidad: { label: 'Identidad & Posicionamiento', icon: '🌟' },
  oferta:    { label: 'Oferta & Programa',           icon: '💎' },
  mercado:   { label: 'Mercado & Audiencia',         icon: '🎯' },
  ventas:    { label: 'Ventas & Revenue',            icon: '💰' },
  mentalidad:{ label: 'Mentalidad & Compromiso',     icon: '🔥' },
}

function getScoreLevel(score: number) {
  if (score >= 80) return {
    label: 'BASE SÓLIDA — LISTO(A) PARA ESCALAR',
    color: '#4ADE80',
    message: 'Tienes una base sólida. IGNITE va a acelerar tu crecimiento exponencialmente.',
  }
  if (score >= 60) return {
    label: 'CON POTENCIAL — IGNITE LO ACTIVA',
    color: GOLD,
    message: 'Tienes los fundamentos clave. IGNITE te va a dar la claridad, estructura y acción que necesitas para despegar.',
  }
  return {
    label: 'PUNTO DE PARTIDA PERFECTO',
    color: '#FB923C',
    message: 'Estás en el lugar correcto. IGNITE está diseñado exactamente para donde estás ahora — de aquí en adelante todo cambia.',
  }
}

interface ScoreBreakdown {
  identidad: number; oferta: number; mercado: number; ventas: number; mentalidad: number
}

interface Props {
  score: number
  breakdown: ScoreBreakdown
  name: string
}

export default function ClarityResult({ score, breakdown, name }: Props) {
  const navigate = useNavigate()
  const level = getScoreLevel(score)

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: '#0A0A0A' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: GOLD }}>
            Tu Resultado
          </p>
          <h1 className="text-2xl font-bold text-white mb-1">
            {name ? `Hola, ${name.split(' ')[0]}` : '¡Listo!'}
          </h1>
          <p className="text-gray-400 text-sm">Aquí está tu Clarity Score inicial</p>
        </motion.div>

        {/* Score circle */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="text-center mb-10"
        >
          <div
            className="inline-flex flex-col items-center justify-center w-44 h-44 rounded-full"
            style={{ border: `4px solid ${level.color}`, background: '#1A1A1A' }}
          >
            <span className="text-5xl font-bold" style={{ color: level.color }}>{score}</span>
            <span className="text-xs text-gray-400 mt-1">/ 100</span>
          </div>
          <div className="mt-4">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider"
              style={{ background: level.color + '22', color: level.color }}
            >
              {level.label}
            </span>
          </div>
          <p className="text-gray-300 text-sm mt-4 max-w-sm mx-auto">{level.message}</p>
        </motion.div>

        {/* Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-6 space-y-4 mb-6"
          style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
        >
          <h3 className="text-white font-semibold mb-2">Análisis por área</h3>
          {Object.entries(breakdown).map(([key, val]) => {
            const meta = SECTIONS_META[key]
            if (!meta) return null
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{meta.icon} {meta.label}</span>
                  <span className="font-semibold" style={{ color: GOLD }}>{val}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: '#2A2A2A' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${val}%` }}
                    transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                    className="h-2 rounded-full"
                    style={{ background: GOLD }}
                  />
                </div>
              </div>
            )
          })}
        </motion.div>

        {/* CTA → El Pacto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-6 text-center"
          style={{ background: `${GOLD}11`, border: `1px solid ${GOLD}44` }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: GOLD }}>
            ¡Excelente! El siguiente paso es firmar El Pacto.
          </p>
          <p className="text-gray-300 text-sm mb-5">
            Carmen revisará tu Clarity Score. Antes de entrar al programa,
            necesitas firmar El Pacto de Ejecución™.
          </p>
          <button
            onClick={() => navigate('/pacto')}
            className="w-full py-4 rounded-xl font-bold text-base tracking-wide transition-all hover:opacity-90"
            style={{ background: GOLD, color: '#0A0A0A' }}
          >
            Firmar El Pacto y entrar al programa 🔥
          </button>
          <p className="text-xs text-gray-500 mt-3">
            Revisa también tu email — recibirás una confirmación.
          </p>
        </motion.div>

      </div>
    </div>
  )
}
