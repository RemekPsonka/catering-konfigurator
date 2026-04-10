CREATE OR REPLACE FUNCTION public.reorder_variant_items(items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  FOR i IN 0..jsonb_array_length(items) - 1 LOOP
    UPDATE variant_items
    SET sort_order = (items->i->>'sort_order')::int
    WHERE id = (items->i->>'id')::uuid;
  END LOOP;
END;
$$;