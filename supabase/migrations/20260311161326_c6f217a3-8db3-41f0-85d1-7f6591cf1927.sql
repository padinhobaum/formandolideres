
-- Add image_url column to forum_topics
ALTER TABLE public.forum_topics ADD COLUMN IF NOT EXISTS image_url text;

-- Add image_url and parent_reply_id columns to forum_replies
ALTER TABLE public.forum_replies ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.forum_replies ADD COLUMN IF NOT EXISTS parent_reply_id uuid REFERENCES public.forum_replies(id) ON DELETE CASCADE;

-- Create reply_likes table
CREATE TABLE public.reply_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id uuid NOT NULL REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(reply_id, user_id)
);

ALTER TABLE public.reply_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read reply_likes" ON public.reply_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own reply_likes" ON public.reply_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reply_likes" ON public.reply_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create forum_images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('forum_images', 'forum_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for forum_images
CREATE POLICY "Authenticated can upload forum images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'forum_images');

CREATE POLICY "Anyone can read forum images" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'forum_images');

-- Enable realtime for reply_likes
ALTER PUBLICATION supabase_realtime ADD TABLE public.reply_likes;
