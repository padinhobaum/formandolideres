
-- Fix: Students table - restrict SELECT to admins only
DROP POLICY IF EXISTS "Authenticated can view students" ON public.students;
CREATE POLICY "Only admins can view students" ON public.students
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix: Materials storage - restrict upload to admins
DROP POLICY IF EXISTS "Admins can upload materials files" ON storage.objects;
CREATE POLICY "Admins can upload materials files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'materials' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Fix: Materials storage - restrict delete to admins
DROP POLICY IF EXISTS "Admins can delete materials files" ON storage.objects;
CREATE POLICY "Admins can delete materials files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'materials' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Fix: Avatars storage - restrict update/delete to own files
DROP POLICY IF EXISTS "Authenticated can update own avatar" ON storage.objects;
CREATE POLICY "Authenticated can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Authenticated can delete own avatar" ON storage.objects;
CREATE POLICY "Authenticated can delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Fix: user_roles - restrict SELECT to own roles or admins
DROP POLICY IF EXISTS "Users can read roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated can read roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
