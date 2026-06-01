
-- 1) Revoke EXECUTE on internal SECURITY DEFINER functions (triggers + helpers)
REVOKE EXECUTE ON FUNCTION public.update_proposal_vote_count() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_proposal_comment_count() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_climate_xp() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, text, text, integer) FROM anon, authenticated, PUBLIC;

-- has_role is invoked by RLS policies; calling role must have EXECUTE.
-- Keep authenticated execute, revoke from anon and PUBLIC default.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- verify_certificate is intentionally public (certificate verification page).
-- complete_video_lesson must be callable by signed-in users only.
REVOKE EXECUTE ON FUNCTION public.complete_video_lesson(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_video_lesson(uuid) TO authenticated;

-- 2) Restrict survey_responses INSERT to active surveys only
DROP POLICY IF EXISTS "Anon can insert responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Authenticated can insert responses" ON public.survey_responses;

CREATE POLICY "Anon can insert responses for active surveys"
ON public.survey_responses
FOR INSERT
TO anon
WITH CHECK (EXISTS (SELECT 1 FROM public.surveys s WHERE s.id = survey_id AND s.is_active = true));

CREATE POLICY "Authenticated can insert responses for active surveys"
ON public.survey_responses
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.surveys s WHERE s.id = survey_id AND s.is_active = true));

-- 3) Lock down materials bucket listing to admins (files still accessible via signed/public URLs as configured by the app)
DROP POLICY IF EXISTS "Anyone can read materials files" ON storage.objects;

CREATE POLICY "Admins can list materials files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'materials' AND public.has_role(auth.uid(), 'admin'::public.app_role));
