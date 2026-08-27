-- Revoke anon execute on privileged helper function
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

-- Restrict user_roles reads to own row + admins
DROP POLICY IF EXISTS "Authenticated users can read all roles" ON public.user_roles;

-- Safe helper: exposes only which users are admins (needed for badges/ranking)
CREATE OR REPLACE FUNCTION public.get_admin_user_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.user_roles WHERE role = 'admin' AND auth.uid() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.get_admin_user_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_user_ids() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_user_ids() TO authenticated;