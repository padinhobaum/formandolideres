
-- Create banners table
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  button_text TEXT,
  button_url TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image', -- 'image' or 'video'
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert banners" ON public.banners FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update banners" ON public.banners FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete banners" ON public.banners FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can read banners" ON public.banners FOR SELECT TO authenticated USING (true);

-- Create storage bucket for banners
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

CREATE POLICY "Admins can upload banner media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view banner media" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Admins can delete banner media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'::app_role));
