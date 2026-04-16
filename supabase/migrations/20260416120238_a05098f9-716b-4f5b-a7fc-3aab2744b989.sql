
-- Proposals (create first, without collaborator RLS)
CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'geral',
  expected_impact text NOT NULL DEFAULT 'medio',
  estimated_effort text NOT NULL DEFAULT 'medio',
  target_audience text,
  author_id uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  author_avatar_url text,
  status text NOT NULL DEFAULT 'draft',
  vote_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  score numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Collaborators
CREATE TABLE public.proposal_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT '',
  user_avatar_url text,
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_collaborators ENABLE ROW LEVEL SECURITY;

-- Now create RLS for proposals (can reference collaborators)
CREATE POLICY "Authenticated can read submitted proposals" ON public.proposals FOR SELECT TO authenticated USING (status != 'draft' OR author_id = auth.uid());
CREATE POLICY "Authors can insert proposals" ON public.proposals FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors collaborators or admins can update proposals" ON public.proposals FOR UPDATE TO authenticated USING (
  author_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.proposal_collaborators WHERE proposal_id = proposals.id AND user_id = auth.uid() AND status = 'accepted') OR
  has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "Authors or admins can delete proposals" ON public.proposals FOR DELETE TO authenticated USING (
  author_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
);

-- Collaborators RLS
CREATE POLICY "Authenticated can read collaborators" ON public.proposal_collaborators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authors can invite collaborators" ON public.proposal_collaborators FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.proposals WHERE id = proposal_id AND author_id = auth.uid())
);
CREATE POLICY "Invited users can update own status" ON public.proposal_collaborators FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Authors can delete collaborators" ON public.proposal_collaborators FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.proposals WHERE id = proposal_id AND author_id = auth.uid())
);

-- Public comments
CREATE TABLE public.proposal_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  author_avatar_url text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read proposal_comments" ON public.proposal_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert proposal_comments" ON public.proposal_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors or admins can delete proposal_comments" ON public.proposal_comments FOR DELETE TO authenticated USING (
  author_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
);

-- Internal comments
CREATE TABLE public.proposal_internal_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  author_avatar_url text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_internal_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Author and collaborators can read internal comments" ON public.proposal_internal_comments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.proposals WHERE id = proposal_id AND author_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.proposal_collaborators WHERE proposal_id = proposal_internal_comments.proposal_id AND user_id = auth.uid() AND status = 'accepted')
);
CREATE POLICY "Author and collaborators can insert internal comments" ON public.proposal_internal_comments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.proposals WHERE id = proposal_id AND author_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.proposal_collaborators WHERE proposal_id = proposal_internal_comments.proposal_id AND user_id = auth.uid() AND status = 'accepted')
);

-- Votes
CREATE TABLE public.proposal_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(proposal_id, user_id)
);

ALTER TABLE public.proposal_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read votes" ON public.proposal_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own votes" ON public.proposal_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON public.proposal_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- History
CREATE TABLE public.proposal_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  edited_by uuid NOT NULL,
  edited_by_name text NOT NULL DEFAULT '',
  changes jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read proposal_history" ON public.proposal_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert history" ON public.proposal_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = edited_by);

-- Direction feedback
CREATE TABLE public.proposal_direction_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  content text NOT NULL,
  is_official boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_direction_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read direction feedback" ON public.proposal_direction_feedback FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert direction feedback" ON public.proposal_direction_feedback FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete direction feedback" ON public.proposal_direction_feedback FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Vote count trigger
CREATE OR REPLACE FUNCTION public.update_proposal_vote_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE proposals SET vote_count = vote_count + 1, score = vote_count + 1 WHERE id = NEW.proposal_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE proposals SET vote_count = GREATEST(vote_count - 1, 0), score = GREATEST(vote_count - 1, 0) WHERE id = OLD.proposal_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER trg_proposal_vote_count AFTER INSERT OR DELETE ON public.proposal_votes FOR EACH ROW EXECUTE FUNCTION public.update_proposal_vote_count();

-- Comment count trigger
CREATE OR REPLACE FUNCTION public.update_proposal_comment_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE proposals SET comment_count = comment_count + 1 WHERE id = NEW.proposal_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE proposals SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.proposal_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER trg_proposal_comment_count AFTER INSERT OR DELETE ON public.proposal_comments FOR EACH ROW EXECUTE FUNCTION public.update_proposal_comment_count();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposals;
