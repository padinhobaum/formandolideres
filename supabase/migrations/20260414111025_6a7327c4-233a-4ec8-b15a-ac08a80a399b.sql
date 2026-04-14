
-- Drop help_desk_tickets table completely
DROP TABLE IF EXISTS public.help_desk_tickets CASCADE;

-- Drop the ticket enums
DROP TYPE IF EXISTS public.ticket_category CASCADE;
DROP TYPE IF EXISTS public.ticket_status CASCADE;

-- Create certificates table
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body_text TEXT NOT NULL,
  signatures JSONB NOT NULL DEFAULT '[{"name":"Arthur Scudeiro","role":"Fundador Formando Líderes"}]'::jsonb,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  verification_code TEXT NOT NULL DEFAULT substring(gen_random_uuid()::text, 1, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage certificates"
ON public.certificates FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can read own certificates
CREATE POLICY "Users can read own certificates"
ON public.certificates FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Anon can read for verification
CREATE POLICY "Anyone can verify certificates"
ON public.certificates FOR SELECT
TO anon
USING (true);

-- Index for verification lookups
CREATE UNIQUE INDEX idx_certificates_verification_code ON public.certificates(verification_code);
