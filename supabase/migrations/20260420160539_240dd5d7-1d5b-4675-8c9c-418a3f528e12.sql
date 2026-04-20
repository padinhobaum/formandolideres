
-- Tabela para registrar o "clima da turma" semanal por líder
CREATE TABLE public.class_climate_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  class_name TEXT NOT NULL,
  mood_score SMALLINT NOT NULL CHECK (mood_score BETWEEN 1 AND 5),
  comment TEXT,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT class_climate_unique_per_week UNIQUE (user_id, week_start)
);

CREATE INDEX idx_class_climate_week ON public.class_climate_responses (week_start);
CREATE INDEX idx_class_climate_class ON public.class_climate_responses (class_name, week_start);

ALTER TABLE public.class_climate_responses ENABLE ROW LEVEL SECURITY;

-- Usuários podem ler/inserir apenas suas próprias respostas
CREATE POLICY "Users read own climate responses"
ON public.class_climate_responses
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own climate responses"
ON public.class_climate_responses
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins leem/deletam tudo
CREATE POLICY "Admins read all climate responses"
ON public.class_climate_responses
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete climate responses"
ON public.class_climate_responses
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Função utilitária para retornar o início (segunda-feira) da semana de uma data
CREATE OR REPLACE FUNCTION public.get_week_start(_d DATE DEFAULT CURRENT_DATE)
RETURNS DATE
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT date_trunc('week', _d)::date;
$$;
