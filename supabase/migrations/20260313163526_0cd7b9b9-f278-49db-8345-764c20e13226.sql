-- Allow all authenticated users to read all roles (needed for forum online users categorization)
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;

CREATE POLICY "Authenticated users can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);