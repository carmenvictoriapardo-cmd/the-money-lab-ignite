-- THE MONEY LAB™ IGNITE OS — Schema SQL
-- Ejecutar en Supabase SQL Editor

-- ────────────────────────────────────────────
-- COHORTS
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- USERS (extiende auth.users de Supabase)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  cohort_id UUID REFERENCES cohorts(id),
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ────────────────────────────────────────────
-- CLARITY RESPONSES (formulario pre-programa)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clarity_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  clarity_score INTEGER NOT NULL DEFAULT 0,
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  responses JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
  admin_notes TEXT
);

-- ────────────────────────────────────────────
-- WEEKLY SCORES (C.R.E.A.R. Scorecard)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  crear_scores JSONB NOT NULL DEFAULT '{}',
  total_score INTEGER NOT NULL DEFAULT 0,
  wins TEXT,
  challenges TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_number)
);

-- ────────────────────────────────────────────
-- STRATEGIC REVIEWS
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS strategic_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('win', 'challenge', 'ask')),
  context TEXT NOT NULL,
  evidence TEXT,
  carmen_response TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- IDENTITY TRACKER
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS identity_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  affirmation TEXT NOT NULL,
  evidence TEXT NOT NULL,
  confidence_level INTEGER NOT NULL CHECK (confidence_level BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- BLOCKER LOGS
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocker_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocker_type TEXT NOT NULL,
  description TEXT NOT NULL,
  protocol_applied TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- REVENUE EVENTS
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenue_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- ADMIN NOTES
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clarity_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocker_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;

-- Policies: cada usuario ve solo sus datos
CREATE POLICY "Users see own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users see own clarity" ON clarity_responses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own scores" ON weekly_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own reviews" ON strategic_reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own identity" ON identity_tracker FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own blockers" ON blocker_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own revenue" ON revenue_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Cohorts are public" ON cohorts FOR SELECT USING (true);

-- Admin (carmen@...) ve todo
CREATE POLICY "Admin sees all profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin sees all clarity" ON clarity_responses FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manages notes" ON admin_notes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
