
-- Fix poll_options insert to only allow topic authors
DROP POLICY "Authenticated can insert poll_options" ON public.poll_options;
CREATE POLICY "Topic authors can insert poll_options" ON public.poll_options
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forum_topics
      WHERE id = topic_id AND author_id = auth.uid()
    )
  );
