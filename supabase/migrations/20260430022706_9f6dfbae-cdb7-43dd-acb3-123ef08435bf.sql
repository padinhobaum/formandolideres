
CREATE TABLE IF NOT EXISTS public.notice_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id uuid NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  author_avatar_url text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notice_comments_notice_id ON public.notice_comments(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_comments_created_at ON public.notice_comments(created_at);

ALTER TABLE public.notice_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read notice_comments"
  ON public.notice_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert own notice_comments"
  ON public.notice_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors or admins can delete notice_comments"
  ON public.notice_comments FOR DELETE TO authenticated
  USING ((auth.uid() = author_id) OR has_role(auth.uid(), 'admin'::app_role));
