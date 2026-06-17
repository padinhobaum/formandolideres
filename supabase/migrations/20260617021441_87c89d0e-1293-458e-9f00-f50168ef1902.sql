
-- =======================
-- topic_reactions
-- =======================
CREATE TABLE IF NOT EXISTS public.topic_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like','agree','applaud','inspire')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (topic_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_topic_reactions_topic ON public.topic_reactions(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_reactions_user ON public.topic_reactions(user_id);

GRANT SELECT, INSERT, DELETE ON public.topic_reactions TO authenticated;
GRANT ALL ON public.topic_reactions TO service_role;

ALTER TABLE public.topic_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read reactions"
  ON public.topic_reactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can add their own reactions"
  ON public.topic_reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
  ON public.topic_reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =======================
-- topic_saves
-- =======================
CREATE TABLE IF NOT EXISTS public.topic_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (topic_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_topic_saves_user ON public.topic_saves(user_id);

GRANT SELECT, INSERT, DELETE ON public.topic_saves TO authenticated;
GRANT ALL ON public.topic_saves TO service_role;

ALTER TABLE public.topic_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own saves"
  ON public.topic_saves FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can save topics"
  ON public.topic_saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave their own saves"
  ON public.topic_saves FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =======================
-- user_follows
-- =======================
CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);

GRANT SELECT, INSERT, DELETE ON public.user_follows TO authenticated;
GRANT ALL ON public.user_follows TO service_role;

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read follows"
  ON public.user_follows FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can follow others"
  ON public.user_follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.user_follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- =======================
-- forum_topics.post_type
-- =======================
ALTER TABLE public.forum_topics
  ADD COLUMN IF NOT EXISTS post_type text NOT NULL DEFAULT 'text';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'forum_topics_post_type_check'
  ) THEN
    ALTER TABLE public.forum_topics
      ADD CONSTRAINT forum_topics_post_type_check
      CHECK (post_type IN ('text','image','poll','question','challenge','announcement'));
  END IF;
END $$;

-- =======================
-- Realtime
-- =======================
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.topic_reactions;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_topics;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_replies;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
