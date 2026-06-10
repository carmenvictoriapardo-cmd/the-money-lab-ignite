// ─── C.R.E.A.R.™ Phases ───────────────────────────────────────────────────

export const CREAR_PHASES: Record<string, { letter: string; name: string; color: string }> = {
  C:  { letter: 'C', name: 'Claridad',    color: '#3B82F6' },
  R:  { letter: 'R', name: 'Reordena',    color: '#10B981' },
  E:  { letter: 'E', name: 'Estructura',  color: '#8B5CF6' },
  A:  { letter: 'A', name: 'Activa',      color: '#F59E0B' },
  R2: { letter: 'R', name: 'Rentabiliza', color: '#EF4444' },
}

// ─── Session Types ─────────────────────────────────────────────────────────

export const SESSION_TYPES = {
  advisory: { emoji: '🎙️', label: 'Advisory Board',          color: '#8B5CF6' },
  hotseat:  { emoji: '🔥', label: 'Hot Seat Execution Review', color: '#EF4444' },
  warroom:  { emoji: '⚔️', label: 'War Room',                 color: '#6B7280' },
} as const

export type SessionTypeKey = keyof typeof SESSION_TYPES

// ─── Curriculum ────────────────────────────────────────────────────────────

export interface WeekCurriculum {
  week:   number
  phase:  string
  main: {
    title: string
    desc:  string
    href:  string
    emoji: string
  }
  secondary: {
    type:  SessionTypeKey
    title: string
    desc:  string
  }
  deliverable: {
    label: string   // "Entregable de la semana"
    desc:  string   // qué exactamente deben presentar/completar
    href:  string
    emoji: string
  }
}

export const CURRICULUM: WeekCurriculum[] = [
  // ── C — Claridad ──────────────────────────────────────────────────────────
  {
    week: 1, phase: 'C',
    main: { title: 'StoryBrand — El cliente es el héroe', desc: 'Los 7 elementos. BrandScript v1. El Pacto de Ejecución™.', href: '/storybrand', emoji: '📖' },
    secondary: { type: 'advisory', title: 'Advisory Board', desc: 'Invitado que construyó autoridad de marca desde cero.' },
    deliverable: { emoji: '📖', label: 'Completar BrandScript v1', desc: 'Los 7 elementos del StoryBrand. Submit tu BrandScript completo esta semana.', href: '/storybrand' },
  },
  {
    week: 2, phase: 'C',
    main: { title: 'StoryBrand — Profundidad y aplicación total', desc: 'BrandScript refinado. El villano. Todos los puntos de contacto hablan igual.', href: '/storybrand', emoji: '📖' },
    secondary: { type: 'hotseat', title: 'Hot Seat Execution Review', desc: '2-3 participantes presentan sus bloqueos. Diagnóstico brutal en vivo.' },
    deliverable: { emoji: '✍️', label: 'BrandScript refinado + aplicado', desc: 'Bio de Instagram, one-liner y copy web actualizados con tu StoryBrand.', href: '/storybrand' },
  },
  // ── R — Reordena ──────────────────────────────────────────────────────────
  {
    week: 3, phase: 'R',
    main: { title: 'Redes como máquina de negocio', desc: 'Los 4 pilares de contenido. Plan de 30 días. Producción sin excusas.', href: '/accion', emoji: '📱' },
    secondary: { type: 'warroom', title: 'War Room', desc: 'Avances, bloqueos, dirección y decisiones. Sin agenda fija.' },
    deliverable: { emoji: '📅', label: 'Plan de contenido de 30 días', desc: 'Calendario con los 4 pilares. Mínimo 12 piezas planificadas y tema por semana.', href: '/accion' },
  },
  {
    week: 4, phase: 'R',
    main: { title: 'Contenido avanzado + identidad en cámara', desc: 'Reels de autoridad. Storytelling propio. Métricas reales.', href: '/identidad', emoji: '🎬' },
    secondary: { type: 'hotseat', title: 'Hot Seat Execution Review', desc: '2-3 participantes. ¿Qué evitaste? ¿Por qué? ¿Qué no decidiste?' },
    deliverable: { emoji: '🎥', label: '2 Reels de autoridad publicados', desc: 'Graba y publica 2 Reels usando tu StoryBrand. Sube el link como evidencia.', href: '/evidencia' },
  },
  {
    week: 5, phase: 'R',
    main: { title: 'Facebook Ads — Medir para escalar', desc: 'Paid media sobre contenido orgánico probado. KPIs reales. Primera campaña.', href: '/revenue', emoji: '📊' },
    secondary: { type: 'advisory', title: 'Advisory Board', desc: 'Especialista en Meta Ads o fundadora que escaló con paid media.' },
    deliverable: { emoji: '🚀', label: 'Primera campaña Facebook Ads activa', desc: 'Ad set configurado, audience definida, $5–$10/día corriendo. Screenshot de resultados.', href: '/revenue' },
  },
  // ── E — Estructura ────────────────────────────────────────────────────────
  {
    week: 6, phase: 'E',
    main: { title: 'La Oferta Irresistible — Diseño', desc: 'Los 6 elementos. Del servicio genérico a la oferta con firma propia.', href: '/oferta', emoji: '💡' },
    secondary: { type: 'hotseat', title: 'Hot Seat Execution Review', desc: '2-3 participantes. ¿Enviaste la oferta o la perfeccionaste sin enviarla?' },
    deliverable: { emoji: '💡', label: 'Oferta Irresistible diseñada', desc: 'Los 6 elementos completos + nombre de tu oferta. Submit para revisión de Carmen.', href: '/oferta' },
  },
  {
    week: 7, phase: 'E',
    main: { title: 'La Oferta Irresistible — Pricing y percepción', desc: 'Precio estratégico. Stack de valor. Presentar el precio sin disculparse.', href: '/oferta', emoji: '💰' },
    secondary: { type: 'warroom', title: 'War Room', desc: 'El precio que quieres cobrar vs el que cobras. Se decide en sala.' },
    deliverable: { emoji: '💰', label: 'Precio definido + presentado 3 veces', desc: 'Cotiza tu oferta con el nuevo precio a 3 personas reales. Reporta los resultados.', href: '/standup' },
  },
  // ── A — Activa ────────────────────────────────────────────────────────────
  {
    week: 8, phase: 'A',
    main: { title: 'Roleplay de ventas — Vender sin vergüenza', desc: 'La conversación de ventas. Objeciones reales. El cierre como servicio.', href: '/roleplay', emoji: '🎭' },
    secondary: { type: 'hotseat', title: 'Hot Seat Execution Review', desc: '2-3 participantes. ¿Hiciste las llamadas o las postergaste?' },
    deliverable: { emoji: '🎭', label: '3 simulaciones de roleplay completadas', desc: 'Practica la conversación de ventas con la IA 3 veces. Reporta qué objeciones surgieron.', href: '/roleplay' },
  },
  {
    week: 9, phase: 'A',
    main: { title: 'Manejo financiero — El dinero que ya tienes', desc: 'Número de libertad. Modelo de ingresos. Flujo de caja real.', href: '/revenue', emoji: '💵' },
    secondary: { type: 'advisory', title: 'Advisory Board', desc: 'CFO, contador o fundadora que maneja las finanzas con claridad.' },
    deliverable: { emoji: '📊', label: 'Número de libertad calculado', desc: 'Tu gasto mensual real + 20% colchón = tu número de libertad. Compártelo en standup.', href: '/revenue' },
  },
  {
    week: 10, phase: 'A',
    main: { title: 'Sistema de ventas y pipeline', desc: 'Pipeline en 4 etapas. CRM básico. El 80% cierra después del 5to contacto.', href: '/crear', emoji: '🔧' },
    secondary: { type: 'hotseat', title: 'Hot Seat Execution Review', desc: '2-3 participantes. Cierres pendientes. ¿Qué falta para cerrar?' },
    deliverable: { emoji: '🔧', label: 'Pipeline actualizado con 5+ prospectos', desc: 'CRM con prospectos en cada etapa. ¿Cuántos están a 1 conversación del cierre?', href: '/standup' },
  },
  // ── R2 — Rentabiliza ──────────────────────────────────────────────────────
  {
    week: 11, phase: 'R2',
    main: { title: 'DEMO DAY — Vende frente a todos', desc: 'Presentación real. 5-7 min por participante. Invitados externos opcionales.', href: '/evidencia', emoji: '🏆' },
    secondary: { type: 'warroom', title: 'War Room', desc: 'Post Demo Day. Decisiones inmediatas basadas en el feedback recibido.' },
    deliverable: { emoji: '🏆', label: 'Presentación Demo Day lista', desc: '5-7 min: quién eres, qué ofreces, resultados reales, próximos pasos. Practica antes.', href: '/evidencia' },
  },
  {
    week: 12, phase: 'R2',
    main: { title: 'Plan de escala — Los próximos 12 meses', desc: 'Cierre del Scorecard. Evolución real. Identidad de fundadora que ejecuta.', href: '/crear', emoji: '🚀' },
    secondary: { type: 'advisory', title: 'Advisory Board Final', desc: 'Invitado especial que Carmen admire profundamente. El cierre que inspira.' },
    deliverable: { emoji: '🗺️', label: 'Plan de escala 12 meses presentado', desc: 'Meta de ingresos, 3 iniciativas clave, equipo necesario. Tu plan de los próximos 12 meses.', href: '/crear' },
  },
]

export function getCurriculumWeek(week: number): WeekCurriculum {
  return CURRICULUM.find(c => c.week === week) ?? CURRICULUM[0]
}
