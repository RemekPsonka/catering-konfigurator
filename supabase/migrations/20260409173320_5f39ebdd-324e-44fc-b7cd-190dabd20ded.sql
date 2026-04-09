-- 1. Remove CHECK constraint on people_count
ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_people_count_check;

-- 2. Make people_count nullable with NULL default
ALTER TABLE public.offers ALTER COLUMN people_count DROP NOT NULL;
ALTER TABLE public.offers ALTER COLUMN people_count SET DEFAULT NULL;

-- 3. Make delivery_type nullable for drafts
ALTER TABLE public.offers ALTER COLUMN delivery_type DROP NOT NULL;

-- 4. Updated trigger: drafts pass freely, non-drafts require key fields
CREATE OR REPLACE FUNCTION public.validate_offer_status()
RETURNS trigger LANGUAGE plpgsql AS $function$
BEGIN
  -- Drafts: no validation required
  IF NEW.status = 'draft' THEN
    RETURN NEW;
  END IF;

  -- Non-draft statuses require key fields
  IF NEW.status IN ('ready','sent','viewed','revision','accepted','won') THEN
    IF NEW.client_id IS NULL THEN
      RAISE EXCEPTION 'Klient jest wymagany dla statusu: %', NEW.status;
    END IF;
    IF NEW.people_count IS NULL OR NEW.people_count < 1 THEN
      RAISE EXCEPTION 'Liczba osób jest wymagana dla statusu: %', NEW.status;
    END IF;
    IF NEW.delivery_type IS NULL THEN
      RAISE EXCEPTION 'Typ dostawy jest wymagany dla statusu: %', NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;