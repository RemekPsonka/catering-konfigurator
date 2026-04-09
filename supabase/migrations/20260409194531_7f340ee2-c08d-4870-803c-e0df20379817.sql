CREATE POLICY "public_services_read"
ON public.services
FOR SELECT
USING (is_active = true);