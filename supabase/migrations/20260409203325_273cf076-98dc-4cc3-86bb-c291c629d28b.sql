CREATE POLICY "public_corrections_read" ON public.offer_corrections
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.offers
    WHERE offers.id = offer_corrections.offer_id
      AND offers.public_token IS NOT NULL
  )
);