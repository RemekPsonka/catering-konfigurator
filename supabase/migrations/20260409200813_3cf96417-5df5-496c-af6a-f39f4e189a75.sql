CREATE OR REPLACE FUNCTION public.generate_public_token()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  bytes bytea;
  result text := '';
  i int;
BEGIN
  IF NEW.public_token IS NULL THEN
    bytes := gen_random_bytes(12);
    FOR i IN 0..11 LOOP
      result := result || substr(chars, (get_byte(bytes, i) % 54) + 1, 1);
    END LOOP;
    NEW.public_token := result;
  END IF;
  RETURN NEW;
END;
$$;