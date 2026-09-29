CREATE POLICY "Service role manages climate email deliveries"
ON public.climate_email_deliveries
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);