
CREATE TABLE public.edital_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT false,
  current_phase text NOT NULL DEFAULT 'submission',
  max_votes_per_user integer NOT NULL DEFAULT 5,
  allow_multiple_votes_same_proposal boolean NOT NULL DEFAULT false,
  scheduled_open_at timestamptz,
  scheduled_close_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.edital_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read edital_config" ON public.edital_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update edital_config" ON public.edital_config FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert edital_config" ON public.edital_config FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.edital_config (is_active, current_phase) VALUES (false, 'submission');

ALTER PUBLICATION supabase_realtime ADD TABLE public.edital_config;
