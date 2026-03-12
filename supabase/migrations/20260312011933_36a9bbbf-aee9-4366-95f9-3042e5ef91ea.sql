
-- Table for tracking which users read which notices
CREATE TABLE public.notice_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id uuid NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(notice_id, user_id)
);

ALTER TABLE public.notice_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can insert own notice_reads" ON public.notice_reads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated can read own notice_reads" ON public.notice_reads
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all notice_reads" ON public.notice_reads
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Table for notification last read tracking
CREATE TABLE public.notification_last_read (
  user_id uuid PRIMARY KEY,
  last_read_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_last_read ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notification_last_read" ON public.notification_last_read
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own notification_last_read" ON public.notification_last_read
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification_last_read" ON public.notification_last_read
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Playlists table
CREATE TABLE public.playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read playlists" ON public.playlists
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert playlists" ON public.playlists
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update playlists" ON public.playlists
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete playlists" ON public.playlists
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Playlist videos junction table
CREATE TABLE public.playlist_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.video_lessons(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE(playlist_id, video_id)
);

ALTER TABLE public.playlist_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read playlist_videos" ON public.playlist_videos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert playlist_videos" ON public.playlist_videos
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete playlist_videos" ON public.playlist_videos
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
