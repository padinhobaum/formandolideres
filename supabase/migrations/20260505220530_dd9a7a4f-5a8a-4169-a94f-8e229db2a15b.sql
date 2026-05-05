DROP POLICY IF EXISTS "Authenticated can read notices" ON public.notices;

CREATE POLICY "Users can read applicable notices"
  ON public.notices FOR SELECT
  TO authenticated
  USING (
    target_user_ids IS NULL
    OR auth.uid() = ANY(target_user_ids)
    OR has_role(auth.uid(), 'admin'::app_role)
  );