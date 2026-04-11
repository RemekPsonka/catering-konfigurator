
ALTER TYPE public.offer_status ADD VALUE IF NOT EXISTS 'expired';

-- Function to bulk-mark expired offers
CREATE OR REPLACE FUNCTION public.check_offer_expiry()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE offers
  SET status = 'expired'
  WHERE valid_until IS NOT NULL
    AND valid_until < CURRENT_DATE
    AND status IN ('sent', 'viewed', 'revision')
    AND status != 'expired';
END;
$$;

-- Trigger to prevent accepting expired offers
CREATE OR REPLACE FUNCTION public.prevent_expired_acceptance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('accepted', 'won')
     AND OLD.status NOT IN ('accepted', 'won')
     AND OLD.valid_until IS NOT NULL
     AND OLD.valid_until < CURRENT_DATE THEN
    RAISE EXCEPTION 'Oferta wygasła — nie można jej zaakceptować. Skontaktuj się z managerem.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_expired_acceptance
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.prevent_expired_acceptance();
