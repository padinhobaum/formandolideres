
ALTER TABLE public.notice_comments
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.notice_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notice_comments_parent_id ON public.notice_comments(parent_id);
