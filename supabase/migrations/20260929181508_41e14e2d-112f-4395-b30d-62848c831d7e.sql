CREATE TABLE public.climate_email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  reminder_type text NOT NULL CHECK (reminder_type IN ('monday', 'friday', 'sunday')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start, reminder_type)
);

GRANT ALL ON public.climate_email_deliveries TO service_role;

ALTER TABLE public.climate_email_deliveries ENABLE ROW LEVEL SECURITY;