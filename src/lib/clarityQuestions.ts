export interface ClarityQuestion {
  id: string
  section: string
  sectionKey: keyof ScoreBreakdown
  text: string
  type: 'scale' | 'text' | 'select'
  options?: string[]
  weight: number
}

export interface ScoreBreakdown {
  identidad: number
  oferta: number
  mercado: number
  ventas: number
  mentalidad: number
}

export const CLARITY_QUESTIONS: ClarityQuestion[] = [
  // SECCIÓN 1: IDENTIDAD (4 preguntas)
  {
    id: 'id_1',
    section: 'Identidad & Posicionamiento',
    sectionKey: 'identidad',
    text: '¿Qué tan claro estás sobre quién eres como emprendedor(a) y cuál es tu misión de negocio?',
    type: 'scale',
    weight: 5,
  },
  {
    id: 'id_2',
    section: 'Identidad & Posicionamiento',
    sectionKey: 'identidad',
    text: 'Describe en 1-2 oraciones tu propuesta de valor única. ¿Qué problema específico resuelves y para quién?',
    type: 'text',
    weight: 5,
  },
  {
    id: 'id_3',
    section: 'Identidad & Posicionamiento',
    sectionKey: 'identidad',
    text: '¿Cuán diferenciada está tu marca personal de otros competidores en tu mercado?',
    type: 'scale',
    weight: 5,
  },
  {
    id: 'id_4',
    section: 'Identidad & Posicionamiento',
    sectionKey: 'identidad',
    text: '¿Tienes un sistema o metodología propia con nombre? Si sí, ¿cuál es?',
    type: 'select',
    options: ['Sí, completamente desarrollado', 'En proceso de desarrollo', 'Tengo ideas pero no está definido', 'No todavía'],
    weight: 5,
  },

  // SECCIÓN 2: OFERTA (4 preguntas)
  {
    id: 'of_1',
    section: 'Oferta & Programa',
    sectionKey: 'oferta',
    text: '¿Qué tan claro está el resultado específico y medible que logran tus clientes contigo?',
    type: 'scale',
    weight: 5,
  },
  {
    id: 'of_2',
    section: 'Oferta & Programa',
    sectionKey: 'oferta',
    text: 'Describe el resultado más poderoso que ha logrado uno de tus clientes trabajando contigo.',
    type: 'text',
    weight: 5,
  },
  {
    id: 'of_3',
    section: 'Oferta & Programa',
    sectionKey: 'oferta',
    text: '¿Cuál es el precio actual de tu oferta principal?',
    type: 'select',
    options: ['Menos de $1,000', '$1,000 - $3,000', '$3,000 - $6,000', '$6,000 - $12,000', 'Más de $12,000'],
    weight: 5,
  },
  {
    id: 'of_4',
    section: 'Oferta & Programa',
    sectionKey: 'oferta',
    text: '¿Qué tan seguro(a) te sientes de que tu precio refleja el valor real que entregas?',
    type: 'scale',
    weight: 5,
  },

  // SECCIÓN 3: MERCADO (4 preguntas)
  {
    id: 'mer_1',
    section: 'Mercado & Audiencia',
    sectionKey: 'mercado',
    text: '¿Qué tan claro tienes a tu cliente ideal (demografía, psicografía, problema principal)?',
    type: 'scale',
    weight: 5,
  },
  {
    id: 'mer_2',
    section: 'Mercado & Audiencia',
    sectionKey: 'mercado',
    text: 'Describe en detalle a tu cliente ideal: ¿quién es, qué quiere lograr, qué le impide lograrlo?',
    type: 'text',
    weight: 5,
  },
  {
    id: 'mer_3',
    section: 'Mercado & Audiencia',
    sectionKey: 'mercado',
    text: '¿Cuántos seguidores/contactos activos tienes en tu canal de adquisición principal?',
    type: 'select',
    options: ['0 - 500', '500 - 2,000', '2,000 - 10,000', '10,000 - 50,000', 'Más de 50,000'],
    weight: 5,
  },
  {
    id: 'mer_4',
    section: 'Mercado & Audiencia',
    sectionKey: 'mercado',
    text: '¿Qué tan consistente es tu presencia y contenido en tus canales principales?',
    type: 'scale',
    weight: 5,
  },

  // SECCIÓN 4: VENTAS (4 preguntas)
  {
    id: 'ven_1',
    section: 'Ventas & Revenue',
    sectionKey: 'ventas',
    text: '¿Cuántos clientes pagadores tienes actualmente en tu oferta principal?',
    type: 'select',
    options: ['0 clientes', '1 - 3 clientes', '4 - 10 clientes', '11 - 25 clientes', 'Más de 25 clientes'],
    weight: 5,
  },
  {
    id: 'ven_2',
    section: 'Ventas & Revenue',
    sectionKey: 'ventas',
    text: '¿Cuál fue tu ingreso bruto el mes pasado en tu negocio?',
    type: 'select',
    options: ['$0', '$1 - $2,000', '$2,000 - $5,000', '$5,000 - $15,000', 'Más de $15,000'],
    weight: 5,
  },
  {
    id: 'ven_3',
    section: 'Ventas & Revenue',
    sectionKey: 'ventas',
    text: '¿Qué tan cómodo(a) te sientes en conversaciones de venta y cerrando clientes de alto valor?',
    type: 'scale',
    weight: 5,
  },
  {
    id: 'ven_4',
    section: 'Ventas & Revenue',
    sectionKey: 'ventas',
    text: '¿Tienes un proceso sistemático de seguimiento y cierre de prospectos?',
    type: 'select',
    options: ['Sí, completamente definido', 'Tengo algo pero es informal', 'Lo hago ad-hoc según el caso', 'No tengo sistema'],
    weight: 5,
  },

  // SECCIÓN 5: MENTALIDAD (4 preguntas)
  {
    id: 'men_1',
    section: 'Mentalidad & Compromiso',
    sectionKey: 'mentalidad',
    text: '¿Qué tan comprometido(a) estás con hacer lo necesario para alcanzar tu siguiente nivel de ingresos este año?',
    type: 'scale',
    weight: 5,
  },
  {
    id: 'men_2',
    section: 'Mentalidad & Compromiso',
    sectionKey: 'mentalidad',
    text: '¿Cuál es el principal obstáculo interno (creencia, miedo o patrón) que sientes que te ha limitado más en tu negocio?',
    type: 'text',
    weight: 5,
  },
  {
    id: 'men_3',
    section: 'Mentalidad & Compromiso',
    sectionKey: 'mentalidad',
    text: '¿Qué tan listo(a) estás para invertir tiempo, energía y recursos en tu crecimiento este trimestre?',
    type: 'scale',
    weight: 5,
  },
  {
    id: 'men_4',
    section: 'Mentalidad & Compromiso',
    sectionKey: 'mentalidad',
    text: '¿Por qué ahora? ¿Qué hace que este sea el momento correcto para unirte a IGNITE?',
    type: 'text',
    weight: 5,
  },
]

export const SECTIONS = [
  { key: 'identidad' as const, label: 'Identidad & Posicionamiento', icon: '🌟' },
  { key: 'oferta' as const, label: 'Oferta & Programa', icon: '💎' },
  { key: 'mercado' as const, label: 'Mercado & Audiencia', icon: '🎯' },
  { key: 'ventas' as const, label: 'Ventas & Revenue', icon: '💰' },
  { key: 'mentalidad' as const, label: 'Mentalidad & Compromiso', icon: '🔥' },
]

export function calculateClarityScore(responses: Record<string, string | number>): {
  total: number
  breakdown: ScoreBreakdown
} {
  const breakdown: ScoreBreakdown = {
    identidad: 0,
    oferta: 0,
    mercado: 0,
    ventas: 0,
    mentalidad: 0,
  }

  const sectionCounts: Record<keyof ScoreBreakdown, number> = {
    identidad: 0,
    oferta: 0,
    mercado: 0,
    ventas: 0,
    mentalidad: 0,
  }

  for (const question of CLARITY_QUESTIONS) {
    const response = responses[question.id]
    if (response === undefined || response === '') continue

    let points = 0

    if (question.type === 'scale') {
      points = Number(response) * 2
    } else if (question.type === 'select') {
      const idx = question.options?.indexOf(String(response)) ?? -1
      if (idx >= 0) {
        points = Math.round(((idx + 1) / (question.options!.length)) * 10)
      }
    } else if (question.type === 'text') {
      const len = String(response).trim().length
      if (len > 100) points = 10
      else if (len > 50) points = 7
      else if (len > 20) points = 5
      else if (len > 0) points = 3
    }

    breakdown[question.sectionKey] += points
    sectionCounts[question.sectionKey]++
  }

  // Normalizar a 100 por sección
  for (const key of Object.keys(breakdown) as (keyof ScoreBreakdown)[]) {
    if (sectionCounts[key] > 0) {
      breakdown[key] = Math.min(100, Math.round((breakdown[key] / (sectionCounts[key] * 10)) * 100))
    }
  }

  const total = Math.round(
    Object.values(breakdown).reduce((a, b) => a + b, 0) / 5
  )

  return { total, breakdown }
}
