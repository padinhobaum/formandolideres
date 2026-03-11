
-- Create forum_categories table
CREATE TABLE public.forum_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read
CREATE POLICY "Authenticated can read forum_categories"
  ON public.forum_categories FOR SELECT TO authenticated
  USING (true);

-- Only admins can manage
CREATE POLICY "Admins can insert forum_categories"
  ON public.forum_categories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update forum_categories"
  ON public.forum_categories FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete forum_categories"
  ON public.forum_categories FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add category_id to forum_topics (nullable for backward compat)
ALTER TABLE public.forum_topics ADD COLUMN category_id UUID REFERENCES public.forum_categories(id) ON DELETE SET NULL;
