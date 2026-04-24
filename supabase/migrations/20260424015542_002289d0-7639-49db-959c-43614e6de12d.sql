-- ============================================
-- REVERSÃO COMPLETA DE TRILHAS DE APRENDIZAGEM
-- ============================================

-- Drop função RPC de trilhas
DROP FUNCTION IF EXISTS public.complete_lesson(uuid) CASCADE;

-- Drop tabelas de trilhas (em ordem de dependência)
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.user_streaks CASCADE;
DROP TABLE IF EXISTS public.track_completions CASCADE;
DROP TABLE IF EXISTS public.lesson_completions CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.tracks CASCADE;

-- ============================================
-- RECRIAÇÃO DO SISTEMA DE VIDEOAULAS
-- (Categorias + Playlists + Aulas + Comentários)
-- + Streak de aprendizado + Achievements
-- ============================================

-- Categorias temáticas (Liderança, Comunicação, etc)
CREATE TABLE public.video_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#1a5632',
  icon TEXT DEFAULT 'graduation-cap',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Playlists (cursos/coleções de videoaulas)
CREATE TABLE public.video_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  category_id UUID REFERENCES public.video_categories(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Videoaulas
CREATE TABLE public.video_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES public.video_playlists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  difficulty TEXT NOT NULL DEFAULT 'simples', -- simples | intermediario | avancado
  xp_reward INTEGER NOT NULL DEFAULT 10,
  extra_material_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conclusões de aulas (XP)
CREATE TABLE public.video_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.video_lessons(id) ON DELETE CASCADE,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

-- Comentários encadeados nas videoaulas
CREATE TABLE public.video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.video_lessons(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.video_comments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  author_avatar_url TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Streak de aprendizado (mantido do sistema anterior)
CREATE TABLE public.user_streaks (
  user_id UUID PRIMARY KEY,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Achievements (mantido)
CREATE TABLE public.achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  xp_bonus INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

-- ============================================
-- INDICES
-- ============================================
CREATE INDEX idx_video_lessons_playlist ON public.video_lessons(playlist_id, sort_order);
CREATE INDEX idx_video_completions_user ON public.video_completions(user_id);
CREATE INDEX idx_video_completions_lesson ON public.video_completions(lesson_id);
CREATE INDEX idx_video_comments_lesson ON public.video_comments(lesson_id, created_at);
CREATE INDEX idx_video_playlists_category ON public.video_playlists(category_id);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: video_categories
-- ============================================
CREATE POLICY "Authenticated read video_categories" ON public.video_categories
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage video_categories" ON public.video_categories
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- video_playlists
CREATE POLICY "Authenticated read video_playlists" ON public.video_playlists
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage video_playlists" ON public.video_playlists
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- video_lessons
CREATE POLICY "Authenticated read video_lessons" ON public.video_lessons
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage video_lessons" ON public.video_lessons
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- video_completions
CREATE POLICY "Users read own video_completions" ON public.video_completions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all video_completions" ON public.video_completions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users insert own video_completions" ON public.video_completions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- video_comments
CREATE POLICY "Authenticated read video_comments" ON public.video_comments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert video_comments" ON public.video_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors or admins delete video_comments" ON public.video_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role));

-- user_streaks
CREATE POLICY "Users read own streak" ON public.user_streaks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated read streaks" ON public.user_streaks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "System manages streaks" ON public.user_streaks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- achievements
CREATE POLICY "Authenticated read achievements" ON public.achievements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage achievements" ON public.achievements
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_achievements
CREATE POLICY "Authenticated read user_achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "System inserts user_achievements" ON public.user_achievements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_video_playlists_updated_at
  BEFORE UPDATE ON public.video_playlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_lessons_updated_at
  BEFORE UPDATE ON public.video_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FUNÇÃO: complete_video_lesson
-- (XP base + bônus diário + streak + achievements)
-- ============================================
CREATE OR REPLACE FUNCTION public.complete_video_lesson(_lesson_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _lesson RECORD;
  _xp_lesson INTEGER := 0;
  _xp_daily_bonus INTEGER := 0;
  _xp_streak_bonus INTEGER := 0;
  _xp_achievement_bonus INTEGER := 0;
  _today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  _streak RECORD;
  _new_streak INTEGER := 1;
  _had_completion_today BOOLEAN;
  _new_achievements TEXT[] := ARRAY[]::TEXT[];
  _completion_count INTEGER;
  _ach TEXT;
  _bonus INTEGER;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO _lesson FROM video_lessons WHERE id = _lesson_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aula não encontrada';
  END IF;

  IF EXISTS (SELECT 1 FROM video_completions WHERE user_id = _user_id AND lesson_id = _lesson_id) THEN
    RETURN jsonb_build_object('already_completed', true, 'xp_earned', 0);
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM video_completions
    WHERE user_id = _user_id
      AND (completed_at AT TIME ZONE 'America/Sao_Paulo')::date = _today
  ) INTO _had_completion_today;

  _xp_lesson := COALESCE(_lesson.xp_reward, 10);

  INSERT INTO video_completions (lesson_id, user_id, xp_earned)
  VALUES (_lesson_id, _user_id, _xp_lesson);

  PERFORM award_xp(_user_id, 'video_lesson_completed', _lesson_id::text, _xp_lesson);

  IF NOT _had_completion_today THEN
    _xp_daily_bonus := 5;
    PERFORM award_xp(_user_id, 'video_daily_first', _today::text, _xp_daily_bonus);
  END IF;

  -- STREAK
  SELECT * INTO _streak FROM user_streaks WHERE user_id = _user_id;
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (_user_id, 1, 1, _today);
    _new_streak := 1;
  ELSIF _streak.last_activity_date = _today THEN
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
    _new_streak := 1;
    UPDATE user_streaks SET
      current_streak = 1,
      last_activity_date = _today,
      updated_at = now()
    WHERE user_id = _user_id;
  END IF;

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

  -- ACHIEVEMENTS
  SELECT COUNT(*) INTO _completion_count FROM video_completions WHERE user_id = _user_id;

  IF _completion_count = 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (_user_id, 'first_lesson')
    ON CONFLICT DO NOTHING;
    IF FOUND THEN _new_achievements := _new_achievements || 'first_lesson'; END IF;
  END IF;

  IF _completion_count >= 5 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (_user_id, 'five_lessons')
    ON CONFLICT DO NOTHING;
    IF FOUND THEN _new_achievements := _new_achievements || 'five_lessons'; END IF;
  END IF;

  IF _completion_count >= 20 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (_user_id, 'twenty_lessons')
    ON CONFLICT DO NOTHING;
    IF FOUND THEN _new_achievements := _new_achievements || 'twenty_lessons'; END IF;
  END IF;

  IF _new_streak >= 7 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (_user_id, 'streak_7_days')
    ON CONFLICT DO NOTHING;
    IF FOUND THEN _new_achievements := _new_achievements || 'streak_7_days'; END IF;
  END IF;

  FOREACH _ach IN ARRAY _new_achievements LOOP
    SELECT xp_bonus INTO _bonus FROM achievements WHERE id = _ach;
    IF _bonus IS NOT NULL AND _bonus > 0 THEN
      _xp_achievement_bonus := _xp_achievement_bonus + _bonus;
      PERFORM award_xp(_user_id, 'achievement_' || _ach, _ach, _bonus);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'already_completed', false,
    'xp_lesson', _xp_lesson,
    'xp_daily_bonus', _xp_daily_bonus,
    'xp_streak_bonus', _xp_streak_bonus,
    'xp_achievement_bonus', _xp_achievement_bonus,
    'xp_total', _xp_lesson + _xp_daily_bonus + _xp_streak_bonus + _xp_achievement_bonus,
    'current_streak', _new_streak,
    'new_achievements', _new_achievements
  );
END;
$$;

-- ============================================
-- SEEDS: Achievements e Categorias padrão
-- ============================================
INSERT INTO public.achievements (id, title, description, icon, xp_bonus, sort_order) VALUES
  ('first_lesson', 'Primeira Aula', 'Você concluiu sua primeira videoaula!', 'play-circle', 10, 1),
  ('five_lessons', '5 Aulas Concluídas', 'Você está pegando o ritmo!', 'flame', 25, 2),
  ('twenty_lessons', '20 Aulas Concluídas', 'Líder dedicado em formação!', 'award', 75, 3),
  ('streak_7_days', 'Sequência de 7 Dias', 'Uma semana inteira aprendendo!', 'zap', 50, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.video_categories (name, description, color, icon, sort_order) VALUES
  ('Liderança', 'Desenvolva sua capacidade de liderar com propósito', '#1a5632', 'crown', 1),
  ('Comunicação', 'Aprenda a se expressar com clareza e impacto', '#006ab5', 'message-circle', 2),
  ('Gestão de Conflitos', 'Resolva impasses com inteligência emocional', '#dc2626', 'shield', 3),
  ('Trabalho em Equipe', 'Construa equipes engajadas e colaborativas', '#9333ea', 'users', 4),
  ('Desenvolvimento Pessoal', 'Cresça como pessoa e líder', '#ea580c', 'sparkles', 5)
ON CONFLICT (name) DO NOTHING;
