-- THE MONEY LAB™ IGNITE OS — Schema v2 (Sprint 2 additions)
-- Ejecutar en Supabase SQL Editor DESPUÉS del schema.sql original

-- ────────────────────────────────────────────
-- NUEVOS CAMPOS EN PROFILES
-- ────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS el_pacto_signed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS el_pacto_signed_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS program_start_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ────────────────────────────────────────────
-- WEEKLY STANDUPS (standup semanal chat-style)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_standups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  win TEXT NOT NULL,
  revenue_action TEXT NOT NULL,
  needs_from_carmen TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_number)
);

ALTER TABLE weekly_standups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own standups" ON weekly_standups
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admin sees all standups" ON weekly_standups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ────────────────────────────────────────────
-- EVIDENCE LOCKER™ (pruebas de transformación)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evidence_locker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('primer_dm', 'primer_pago', 'testimonio', 'breakthrough', 'otro')),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  event_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE evidence_locker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own evidence" ON evidence_locker
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admin sees all evidence" ON evidence_locker
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ────────────────────────────────────────────
-- INDEX para mejor performance
-- ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_weekly_scores_user_week ON weekly_scores(user_id, week_number DESC);
CREATE INDEX IF NOT EXISTS idx_strategic_reviews_user ON strategic_reviews(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_identity_tracker_user ON identity_tracker(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocker_logs_user ON blocker_logs(user_id, resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_events_user ON revenue_events(user_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_standups_user ON weekly_standups(user_id, week_number DESC);
