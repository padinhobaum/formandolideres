
-- ============================================================
-- DROP: sistema antigo de videoaulas
-- ============================================================
DROP TABLE IF EXISTS public.video_comments CASCADE;
DROP TABLE IF EXISTS public.playlist_videos CASCADE;
DROP TABLE IF EXISTS public.playlists CASCADE;
DROP TABLE IF EXISTS public.video_lessons CASCADE;

-- ============================================================
-- TRILHAS / MÓDULOS / AULAS
-- ============================================================
CREATE TABLE public.tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_sequential BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration_seconds INTEGER,
  difficulty TEXT NOT NULL DEFAULT 'simples', -- simples | intermediario | avancado
  xp_reward INTEGER NOT NULL DEFAULT 10,
  extra_material_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_modules_track ON public.modules(track_id, sort_order);
CREATE INDEX idx_lessons_module ON public.lessons(module_id, sort_order);

-- ============================================================
-- COMPLETIONS de aulas (1 por usuário+aula)
-- ============================================================
CREATE TABLE public.lesson_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX idx_lesson_completions_user ON public.lesson_completions(user_id);
CREATE INDEX idx_lesson_completions_lesson ON public.lesson_completions(lesson_id);

-- ============================================================
-- TRACK COMPLETIONS (para conceder o bônus +50 XP só uma vez)
-- ============================================================
CREATE TABLE public.track_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, track_id)
);

-- ============================================================
-- STREAKS DIÁRIOS
-- ============================================================
CREATE TABLE public.user_streaks (
  user_id UUID NOT NULL PRIMARY KEY,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CONQUISTAS
-- ============================================================
CREATE TABLE public.achievements (
  id TEXT NOT NULL PRIMARY KEY, -- ex: 'first_lesson', 'streak_7', 'first_track'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  xp_bonus INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- tracks
CREATE POLICY "Authenticated can read tracks" ON public.tracks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert tracks" ON public.tracks FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update tracks" ON public.tracks FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete tracks" ON public.tracks FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- modules
CREATE POLICY "Authenticated can read modules" ON public.modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert modules" ON public.modules FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update modules" ON public.modules FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete modules" ON public.modules FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- lessons
CREATE POLICY "Authenticated can read lessons" ON public.lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert lessons" ON public.lessons FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update lessons" ON public.lessons FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete lessons" ON public.lessons FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- lesson_completions
CREATE POLICY "Users read own completions" ON public.lesson_completions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all completions" ON public.lesson_completions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users insert own completions" ON public.lesson_completions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- track_completions
CREATE POLICY "Users read own track completions" ON public.track_completions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all track completions" ON public.track_completions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System insert track completions" ON public.track_completions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- user_streaks
CREATE POLICY "Authenticated read streaks" ON public.user_streaks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users upsert own streak" ON public.user_streaks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own streak" ON public.user_streaks FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- achievements (lookup)
CREATE POLICY "Authenticated read achievements" ON public.achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage achievements" ON public.achievements FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_achievements
CREATE POLICY "Authenticated read user_achievements" ON public.user_achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own achievements" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Triggers de updated_at
-- ============================================================
CREATE TRIGGER trg_tracks_updated BEFORE UPDATE ON public.tracks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_modules_updated BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_lessons_updated BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- FUNÇÃO PRINCIPAL: complete_lesson
-- Concede XP da aula, +5 XP se for a primeira aula do dia,
-- atualiza streak (com bônus 3/7/15 dias), concede conquistas
-- e bônus de trilha completa.
-- Retorna JSON com tudo o que aconteceu para a UI mostrar.
-- ============================================================
CREATE OR REPLACE FUNCTION public.complete_lesson(_lesson_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _lesson RECORD;
  _track_id UUID;
  _xp_lesson INTEGER := 0;
  _xp_daily_bonus INTEGER := 0;
  _xp_streak_bonus INTEGER := 0;
  _xp_track_bonus INTEGER := 0;
  _xp_achievement_bonus INTEGER := 0;
  _today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  _streak RECORD;
  _new_streak INTEGER := 1;
  _had_completion_today BOOLEAN;
  _total_lessons INTEGER;
  _completed_lessons INTEGER;
  _track_completed BOOLEAN := false;
  _new_achievements TEXT[] := ARRAY[]::TEXT[];
  _completion_count INTEGER;
  _ach TEXT;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Carrega aula + trilha
  SELECT l.*, m.track_id INTO _lesson
  FROM lessons l JOIN modules m ON m.id = l.module_id
  WHERE l.id = _lesson_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aula não encontrada';
  END IF;
  _track_id := _lesson.track_id;

  -- Já completou? (idempotente)
  IF EXISTS (SELECT 1 FROM lesson_completions WHERE user_id = _user_id AND lesson_id = _lesson_id) THEN
    RETURN jsonb_build_object(
      'already_completed', true,
      'xp_earned', 0
    );
  END IF;

  -- Verifica se já houve completion hoje (antes de inserir)
  SELECT EXISTS (
    SELECT 1 FROM lesson_completions
    WHERE user_id = _user_id
      AND (completed_at AT TIME ZONE 'America/Sao_Paulo')::date = _today
  ) INTO _had_completion_today;

  -- XP base da aula
  _xp_lesson := COALESCE(_lesson.xp_reward, 10);

  -- Insere completion
  INSERT INTO lesson_completions (lesson_id, user_id, xp_earned)
  VALUES (_lesson_id, _user_id, _xp_lesson);

  -- Concede XP da aula via award_xp (idempotente por reference_id)
  PERFORM award_xp(_user_id, 'lesson_completed', _lesson_id::text, _xp_lesson);

  -- Bônus diário (+5) na primeira aula do dia
  IF NOT _had_completion_today THEN
    _xp_daily_bonus := 5;
    PERFORM award_xp(_user_id, 'daily_first_lesson', _today::text, _xp_daily_bonus);
  END IF;

  -- ============ STREAK ============
  SELECT * INTO _streak FROM user_streaks WHERE user_id = _user_id;
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (_user_id, 1, 1, _today);
    _new_streak := 1;
  ELSIF _streak.last_activity_date = _today THEN
    -- mesmo dia, streak não muda
    _new_streak := _streak.current_streak;
  ELSIF _streak.last_activity_date = _today - INTERVAL '1 day' THEN
    _new_streak := _streak.current_streak + 1;
    UPDATE user_streaks SET
      current_streak = _new_streak,
      longest_streak = GREATEST(longest_streak, _new_streak),
      last_activity_date = _today,
      updated_at = now()
    WHERE user_id = _user_id;
  ELSE
    -- quebrou
    _new_streak := 1;
    UPDATE user_streaks SET
      current_streak = 1,
      last_activity_date = _today,
      updated_at = now()
    WHERE user_id = _user_id;
  END IF;

  -- Bônus de streak (concedido só na primeira vez que atinge cada marco)
  IF _new_streak = 3 THEN
    _xp_streak_bonus := 10;
    PERFORM award_xp(_user_id, 'streak_3', _today::text, 10);
  ELSIF _new_streak = 7 THEN
    _xp_streak_bonus := 25;
    PERFORM award_xp(_user_id, 'streak_7', _today::text, 25);
  ELSIF _new_streak = 15 THEN
    _xp_streak_bonus := 50;
    PERFORM award_xp(_user_id, 'streak_15', _today::text, 50);
  END IF;

  -- ============ TRILHA COMPLETA ============
  SELECT COUNT(*) INTO _total_lessons
  FROM lessons l JOIN modules m ON m.id = l.module_id
  WHERE m.track_id = _track_id;

  SELECT COUNT(*) INTO _completed_lessons
  FROM lesson_completions lc
  JOIN lessons l ON l.id = lc.lesson_id
  JOIN modules m ON m.id = l.module_id
  WHERE m.track_id = _track_id AND lc.user_id = _user_id;

  IF _total_lessons > 0 AND _completed_lessons >= _total_lessons THEN
    INSERT INTO track_completions (track_id, user_id)
    VALUES (_track_id, _user_id)
    ON CONFLICT (user_id, track_id) DO NOTHING;
    IF FOUND THEN
      _track_completed := true;
      _xp_track_bonus := 50;
      PERFORM award_xp(_user_id, 'track_completed', _track_id::text, 50);
    END IF;
  END IF;

  -- ============ CONQUISTAS ============
  SELECT COUNT(*) INTO _completion_count FROM lesson_completions WHERE user_id = _user_id;

  -- first_lesson
  IF _completion_count = 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (_user_id, 'first_lesson')
    ON CONFLICT DO NOTHING;
    IF FOUND THEN _new_achievements := _new_achievements || 'first_lesson'; END IF;
  END IF;

  -- five_lessons
  IF _completion_count >= 5 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (_user_id, 'five_lessons')
    ON CONFLICT DO NOTHING;
    IF FOUND THEN _new_achievements := _new_achievements || 'five_lessons'; END IF;
  END IF;

  -- first_track
  IF _track_completed THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (_user_id, 'first_track')
    ON CONFLICT DO NOTHING;
    IF FOUND THEN _new_achievements := _new_achievements || 'first_track'; END IF;
  END IF;

  -- streak_7
  IF _new_streak >= 7 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (_user_id, 'streak_7_days')
    ON CONFLICT DO NOTHING;
    IF FOUND THEN _new_achievements := _new_achievements || 'streak_7_days'; END IF;
  END IF;

  -- Concede XP bônus das conquistas novas
  FOREACH _ach IN ARRAY _new_achievements LOOP
    DECLARE _bonus INTEGER;
    BEGIN
      SELECT xp_bonus INTO _bonus FROM achievements WHERE id = _ach;
      IF _bonus IS NOT NULL AND _bonus > 0 THEN
        _xp_achievement_bonus := _xp_achievement_bonus + _bonus;
        PERFORM award_xp(_user_id, 'achievement_' || _ach, _ach, _bonus);
      END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'already_completed', false,
    'xp_lesson', _xp_lesson,
    'xp_daily_bonus', _xp_daily_bonus,
    'xp_streak_bonus', _xp_streak_bonus,
    'xp_track_bonus', _xp_track_bonus,
    'xp_achievement_bonus', _xp_achievement_bonus,
    'xp_total', _xp_lesson + _xp_daily_bonus + _xp_streak_bonus + _xp_track_bonus + _xp_achievement_bonus,
    'current_streak', _new_streak,
    'track_completed', _track_completed,
    'new_achievements', _new_achievements
  );
END;
$$;

-- ============================================================
-- SEED: conquistas iniciais
-- ============================================================
INSERT INTO public.achievements (id, title, description, icon, xp_bonus, sort_order) VALUES
  ('first_lesson', 'Primeiro Passo', 'Concluiu sua primeira aula', 'play', 5, 1),
  ('five_lessons', 'Em Ritmo', 'Concluiu 5 aulas', 'flame', 15, 2),
  ('first_track', 'Trilha Conquistada', 'Concluiu sua primeira trilha completa', 'map', 25, 3),
  ('streak_7_days', 'Constância de 7 dias', 'Manteve uma sequência de 7 dias seguidos', 'calendar-check', 50, 4)
ON CONFLICT (id) DO NOTHING;
