ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS highlight_color text DEFAULT '#006ab5';
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS category text DEFAULT NULL;