
CREATE OR REPLACE FUNCTION public.update_offer_scoring()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INTEGER;
BEGIN
  v_score := calculate_conversion_score(NEW.offer_id);
  UPDATE offers
  SET conversion_score = v_score,
      last_client_activity_at = now()
  WHERE id = NEW.offer_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_scoring
AFTER INSERT ON public.offer_events
FOR EACH ROW
EXECUTE FUNCTION public.update_offer_scoring();
