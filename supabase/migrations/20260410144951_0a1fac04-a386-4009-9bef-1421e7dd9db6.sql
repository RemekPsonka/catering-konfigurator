
-- 1. Drop old INSERT trigger for public_token generation
DROP TRIGGER IF EXISTS tr_offer_token ON public.offers;

-- 2. Update generate_public_token to work on UPDATE (when status becomes 'sent' and no token yet)
CREATE OR REPLACE FUNCTION public.generate_public_token()
  RETURNS trigger
  LANGUAGE plpgsql
AS $function$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  bytes bytea;
  result text := '';
  i int;
BEGIN
  -- Only generate token when status changes to 'sent' and no token exists yet
  IF NEW.status = 'sent' AND NEW.public_token IS NULL THEN
    bytes := gen_random_bytes(12);
    FOR i IN 0..11 LOOP
      result := result || substr(chars, (get_byte(bytes, i) % 54) + 1, 1);
    END LOOP;
    NEW.public_token := result;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Create new trigger on UPDATE only
CREATE TRIGGER tr_offer_token
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION generate_public_token();

-- 4. Update find_offer_by_email_and_number to only return offers with a public_token
CREATE OR REPLACE FUNCTION public.find_offer_by_email_and_number(p_email text, p_offer_number text)
  RETURNS TABLE(public_token character varying, status offer_status, offer_number character varying, client_name character varying)
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        o.public_token,
        o.status,
        o.offer_number,
        c.name AS client_name
    FROM offers o
    JOIN clients c ON o.client_id = c.id
    WHERE UPPER(o.offer_number) = UPPER(p_offer_number)
    AND LOWER(c.email) = LOWER(p_email)
    AND o.public_token IS NOT NULL
    LIMIT 1;
END;
$function$;
