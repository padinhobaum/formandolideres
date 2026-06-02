ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'notice';

ALTER TABLE public.notices
  DROP CONSTRAINT IF EXISTS notices_category_check;

ALTER TABLE public.notices
  ADD CONSTRAINT notices_category_check CHECK (category IN ('notice', 'article'));

CREATE INDEX IF NOT EXISTS idx_notices_category ON public.notices(category);