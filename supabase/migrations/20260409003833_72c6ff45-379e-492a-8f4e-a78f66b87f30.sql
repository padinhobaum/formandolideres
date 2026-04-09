
-- Surveys table
CREATE TABLE public.surveys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  bimester smallint NOT NULL CHECK (bimester BETWEEN 1 AND 4),
  short_code text NOT NULL UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 8),
  results_released boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read surveys" ON public.surveys FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert surveys" ON public.surveys FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update surveys" ON public.surveys FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete surveys" ON public.surveys FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
-- Public can read surveys for the public form (anon)
CREATE POLICY "Anon can read active surveys" ON public.surveys FOR SELECT TO anon USING (is_active = true);

-- Survey-leader association
CREATE TABLE public.survey_leaders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  leader_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(survey_id, leader_user_id)
);

ALTER TABLE public.survey_leaders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read survey_leaders" ON public.survey_leaders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert survey_leaders" ON public.survey_leaders FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete survey_leaders" ON public.survey_leaders FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Survey responses (anonymous)
CREATE TABLE public.survey_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  student_rm text NOT NULL,
  score_general smallint NOT NULL CHECK (score_general BETWEEN 0 AND 10),
  score_communication smallint NOT NULL CHECK (score_communication BETWEEN 0 AND 10),
  contributes_environment boolean NOT NULL,
  keeps_informed boolean NOT NULL,
  opens_space boolean NOT NULL,
  comments text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Anon can insert responses (public form)
CREATE POLICY "Anon can insert responses" ON public.survey_responses FOR INSERT TO anon WITH CHECK (true);
-- Authenticated can also insert
CREATE POLICY "Authenticated can insert responses" ON public.survey_responses FOR INSERT TO authenticated WITH CHECK (true);
-- Admins can read all responses
CREATE POLICY "Admins can read all responses" ON public.survey_responses FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
-- Leaders can read responses for their surveys when results are released
CREATE POLICY "Leaders can read own survey responses" ON public.survey_responses FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.survey_leaders sl
    JOIN public.surveys s ON s.id = sl.survey_id
    WHERE sl.survey_id = survey_responses.survey_id
      AND sl.leader_user_id = auth.uid()
      AND s.results_released = true
  )
);

-- Enable realtime for response counting
ALTER PUBLICATION supabase_realtime ADD TABLE public.survey_responses;
