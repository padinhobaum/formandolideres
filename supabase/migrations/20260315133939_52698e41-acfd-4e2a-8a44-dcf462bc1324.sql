
-- Table to store user XP totals
CREATE TABLE public.user_xp (
  user_id uuid NOT NULL PRIMARY KEY,
  total_xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all user_xp" ON public.user_xp
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own user_xp" ON public.user_xp
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_xp" ON public.user_xp
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Table to log individual XP events (prevents duplicates)
CREATE TABLE public.xp_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action text NOT NULL,
  reference_id text NOT NULL,
  xp_amount integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, action, reference_id)
);

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own xp_events" ON public.xp_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp_events" ON public.xp_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Function to calculate level from XP
-- Levels: 1=0, 2=100, 3=250, 4=500, 5=800, 6=1200, 7=1700, 8=2300, 9=3000, 10=4000
CREATE OR REPLACE FUNCTION public.calculate_level(xp integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN xp >= 4000 THEN 10
    WHEN xp >= 3000 THEN 9
    WHEN xp >= 2300 THEN 8
    WHEN xp >= 1700 THEN 7
    WHEN xp >= 1200 THEN 6
    WHEN xp >= 800 THEN 5
    WHEN xp >= 500 THEN 4
    WHEN xp >= 250 THEN 3
    WHEN xp >= 100 THEN 2
    ELSE 1
  END;
$$;

-- Function to award XP (idempotent via unique constraint)
CREATE OR REPLACE FUNCTION public.award_xp(
  _user_id uuid,
  _action text,
  _reference_id text,
  _xp_amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to insert the event (will fail silently if duplicate)
  INSERT INTO xp_events (user_id, action, reference_id, xp_amount)
  VALUES (_user_id, _action, _reference_id, _xp_amount)
  ON CONFLICT (user_id, action, reference_id) DO NOTHING;

  -- If we inserted, update the totals
  IF FOUND THEN
    INSERT INTO user_xp (user_id, total_xp, level, updated_at)
    VALUES (_user_id, _xp_amount, calculate_level(_xp_amount), now())
    ON CONFLICT (user_id) DO UPDATE SET
      total_xp = user_xp.total_xp + _xp_amount,
      level = calculate_level(user_xp.total_xp + _xp_amount),
      updated_at = now();
  END IF;
END;
$$;
