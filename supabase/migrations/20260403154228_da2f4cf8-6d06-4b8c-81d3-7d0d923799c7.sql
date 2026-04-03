
-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Add event_id column to notices
ALTER TABLE public.notices ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;
