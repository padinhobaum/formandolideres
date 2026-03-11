
-- Add image_url and cta_buttons to notices
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS cta_buttons jsonb DEFAULT '[]'::jsonb;

-- Create notices storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('notices', 'notices', true) ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated can upload to notices bucket
CREATE POLICY "Admins can upload notice images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'notices' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Anyone can read notice images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'notices');
CREATE POLICY "Admins can delete notice images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'notices' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Custom sidebar links table
CREATE TABLE public.custom_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  icon_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read custom_links" ON public.custom_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert custom_links" ON public.custom_links FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update custom_links" ON public.custom_links FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete custom_links" ON public.custom_links FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Storage bucket for custom link icons
INSERT INTO storage.buckets (id, name, public) VALUES ('icons', 'icons', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload icons" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'icons' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Anyone can read icons" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'icons');
CREATE POLICY "Admins can delete icons" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'icons' AND public.has_role(auth.uid(), 'admin'::public.app_role));
