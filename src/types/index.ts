export interface User {
  id: string
  email: string
  full_name: string
  role: 'client' | 'admin'
  cohort_id?: string
  onboarded: boolean
  el_pacto_signed: boolean
  el_pacto_signed_at?: string
  program_start_date?: string
  avatar_url?: string
  created_at: string
}

export interface ClarityResponse {
  id: string
  user_id: string
  submitted_at: string
  clarity_score: number
  score_breakdown: ScoreBreakdown
  responses: Record<string, string | number>
  status: 'pending' | 'reviewed'
  admin_notes?: string
}

export interface ScoreBreakdown {
  identidad: number
  oferta: number
  mercado: number
  ventas: number
  mentalidad: number
}

export interface Cohort {
  id: string
  name: string
  start_date: string
  end_date: string
  active: boolean
}

export interface WeeklyScore {
  id: string
  user_id: string
  week_number: number
  crear_scores: CREARScores
  total_score: number
  wins?: string
  challenges?: string
  created_at: string
}

export interface CREARScores {
  claridad: number   // Claridad de oferta e identidad (1-10)
  revenue: number    // Acciones de revenue tomadas (1-10)
  ejecucion: number  // Entregables completados (1-10)
  autoridad: number  // Visibilidad y autoridad (1-10)
  relaciones: number // Networking y relaciones (1-10)
}

export interface StrategicReview {
  id: string
  user_id: string
  week_number: number
  type: 'win' | 'challenge' | 'ask'
  context: string
  evidence: string
  carmen_response?: string
  video_url?: string
  created_at: string
}

export interface IdentityEntry {
  id: string
  user_id: string
  week_number: number
  affirmation: string
  evidence: string
  confidence_level: number
  created_at: string
}

export interface BlockerLog {
  id: string
  user_id: string
  blocker_type: 'mindset' | 'estrategia' | 'ejecucion' | 'recursos' | 'tiempo' | 'precio' | 'ventas'
  description: string
  protocol_applied?: string
  ai_protocol?: string
  resolved: boolean
  resolved_at?: string
  created_at: string
}

export interface RevenueEvent {
  id: string
  user_id: string
  amount: number
  type: 'cliente_nuevo' | 'upsell' | 'renovacion' | 'servicio_adicional' | 'otro'
  description: string
  event_date: string
  created_at: string
}

export interface WeeklyStandup {
  id: string
  user_id: string
  week_number: number
  win: string
  revenue_action: string
  needs_from_carmen: string
  created_at: string
}

export interface EvidenceItem {
  id: string
  user_id: string
  type: 'primer_dm' | 'primer_pago' | 'testimonio' | 'breakthrough' | 'otro'
  title: string
  description?: string
  image_url?: string
  event_date: string
  created_at: string
}

export interface AdminNote {
  id: string
  user_id: string
  note: string
  created_by: string
  created_at: string
}

// ─── Computed/derived types ───────────────────────────────
export interface ParticipantSummary {
  profile: User
  clarityScore?: number
  latestCREAR?: WeeklyScore
  revenueTotal: number
  standupsCompleted: number
  lastActivityDate?: string
  igniteScore: number
  momentum: 'fuego' | 'caliente' | 'tibia' | 'fria'
  riskAlert: boolean
}
