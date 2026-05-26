export interface User {
  id: string
  email: string
  full_name: string
  role: 'client' | 'admin'
  cohort_id?: string
  onboarded: boolean
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
  created_at: string
}

export interface CREARScores {
  claridad: number
  revenue: number
  ejecucion: number
  autoridad: number
  relaciones: number
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
  blocker_type: string
  description: string
  protocol_applied?: string
  resolved: boolean
  created_at: string
}

export interface RevenueEvent {
  id: string
  user_id: string
  amount: number
  type: string
  description: string
  date: string
  created_at: string
}
