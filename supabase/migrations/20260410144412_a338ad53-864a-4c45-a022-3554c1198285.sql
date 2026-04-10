
-- 1. offers: public read without status filter
DROP POLICY IF EXISTS "public_offer_read" ON public.offers;
CREATE POLICY "public_offer_read"
  ON public.offers FOR SELECT
  USING (public_token IS NOT NULL);

-- 2. clients: read via offer with token (no status filter)
DROP POLICY IF EXISTS "public_clients_read" ON public.clients;
CREATE POLICY "public_clients_read"
  ON public.clients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM offers
    WHERE offers.client_id = clients.id
      AND offers.public_token IS NOT NULL
  ));

-- 3. offer_variants: read via offer with token (no status filter)
DROP POLICY IF EXISTS "public_variants_read" ON public.offer_variants;
CREATE POLICY "public_variants_read"
  ON public.offer_variants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM offers
    WHERE offers.id = offer_variants.offer_id
      AND offers.public_token IS NOT NULL
  ));

-- 4. variant_items: read via offer with token (no status filter)
DROP POLICY IF EXISTS "public_items_read" ON public.variant_items;
CREATE POLICY "public_items_read"
  ON public.variant_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM offer_variants ov
    JOIN offers o ON o.id = ov.offer_id
    WHERE ov.id = variant_items.variant_id
      AND o.public_token IS NOT NULL
  ));

-- 5. offer_services: read via offer with token (no status filter)
DROP POLICY IF EXISTS "public_services_read" ON public.offer_services;
CREATE POLICY "public_services_read"
  ON public.offer_services FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM offers
    WHERE offers.id = offer_services.offer_id
      AND offers.public_token IS NOT NULL
  ));
