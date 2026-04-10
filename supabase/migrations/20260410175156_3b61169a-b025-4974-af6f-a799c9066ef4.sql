CREATE OR REPLACE FUNCTION public.find_offer_by_email_and_number(p_email text, p_offer_number text)
 RETURNS TABLE(public_token character varying, status offer_status, offer_number character varying, client_name character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF p_email IS NULL OR length(trim(p_email)) < 3 THEN
        RAISE EXCEPTION 'Podaj prawidłowy adres email';
    END IF;

    IF p_offer_number IS NULL OR length(trim(p_offer_number)) < 2 THEN
        RAISE EXCEPTION 'Podaj prawidłowy numer oferty';
    END IF;

    RETURN QUERY
    SELECT 
        o.public_token,
        o.status,
        o.offer_number,
        c.name AS client_name
    FROM offers o
    JOIN clients c ON o.client_id = c.id
    WHERE UPPER(o.offer_number) = UPPER(trim(p_offer_number))
    AND LOWER(c.email) = LOWER(trim(p_email))
    AND o.public_token IS NOT NULL
    LIMIT 1;
END;
$function$;