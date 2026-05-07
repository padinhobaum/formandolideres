
-- 1. Remove conflicting permissive policy on students
DROP POLICY IF EXISTS "Authenticated can read students" ON public.students;

-- 2. Certificates: replace open anon policy with code-scoped RPC
DROP POLICY IF EXISTS "Anyone can verify certificates" ON public.certificates;

CREATE OR REPLACE FUNCTION public.verify_certificate(_code text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  body_text text,
  issued_date date,
  verification_code text,
  full_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.user_id, c.title, c.body_text, c.issued_date, c.verification_code, p.full_name
  FROM public.certificates c
  LEFT JOIN public.profiles p ON p.user_id = c.user_id
  WHERE c.verification_code = _code
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;

-- 3. Remove survey_responses from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.survey_responses;

-- 4. Avatars storage: drop overly permissive policies; tighten INSERT
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload avatars" ON storage.objects;

CREATE POLICY "Authenticated can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);
