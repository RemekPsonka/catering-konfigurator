CREATE POLICY "public_offer_accept" ON public.offers
FOR UPDATE TO public
USING (public_token IS NOT NULL AND status IN ('sent'::offer_status, 'viewed'::offer_status, 'revision'::offer_status))
WITH CHECK (public_token IS NOT NULL AND status = 'accepted'::offer_status);