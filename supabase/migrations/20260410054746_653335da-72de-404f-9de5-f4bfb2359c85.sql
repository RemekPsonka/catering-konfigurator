DROP POLICY "public_offer_accept" ON public.offers;

CREATE POLICY "public_offer_status_update"
ON public.offers
FOR UPDATE
USING (
  public_token IS NOT NULL
  AND status IN ('ready', 'sent', 'viewed', 'revision')
)
WITH CHECK (
  public_token IS NOT NULL
  AND status IN ('viewed', 'revision', 'accepted')
);