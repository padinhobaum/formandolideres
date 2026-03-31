
CREATE TABLE public.live_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  stream_url TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'youtube',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read live_streams"
ON public.live_streams FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can insert live_streams"
ON public.live_streams FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update live_streams"
ON public.live_streams FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete live_streams"
ON public.live_streams FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
