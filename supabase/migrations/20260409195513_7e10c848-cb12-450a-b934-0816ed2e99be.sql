-- Drop and recreate public RLS policies to include 'won' status

-- 1. offers: public_offer_read
DROP POLICY IF EXISTS "public_offer_read" ON public.offers;
CREATE POLICY "public_offer_read"
ON public.offers
FOR SELECT
USING (
  public_token IS NOT NULL
  AND status = ANY (ARRAY[
    'ready'::offer_status,
    'sent'::offer_status,
    'viewed'::offer_status,
    'revision'::offer_status,
    'accepted'::offer_status,
    'won'::offer_status
  ])
);

-- 2. offer_variants: public_variants_read
DROP POLICY IF EXISTS "public_variants_read" ON public.offer_variants;
CREATE POLICY "public_variants_read"
ON public.offer_variants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM offers
    WHERE offers.id = offer_variants.offer_id
      AND offers.public_token IS NOT NULL
      AND offers.status = ANY (ARRAY[
        'ready'::offer_status,
        'sent'::offer_status,
        'viewed'::offer_status,
        'revision'::offer_status,
        'accepted'::offer_status,
        'won'::offer_status
      ])
  )
);

-- 3. variant_items: public_items_read
DROP POLICY IF EXISTS "public_items_read" ON public.variant_items;
CREATE POLICY "public_items_read"
ON public.variant_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM offer_variants ov
    JOIN offers o ON o.id = ov.offer_id
    WHERE ov.id = variant_items.variant_id
      AND o.public_token IS NOT NULL
      AND o.status = ANY (ARRAY[
        'ready'::offer_status,
        'sent'::offer_status,
        'viewed'::offer_status,
        'revision'::offer_status,
        'accepted'::offer_status,
        'won'::offer_status
      ])
  )
);

-- 4. offer_services: public_services_read
DROP POLICY IF EXISTS "public_services_read" ON public.offer_services;
CREATE POLICY "public_services_read"
ON public.offer_services
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM offers
    WHERE offers.id = offer_services.offer_id
      AND offers.public_token IS NOT NULL
      AND offers.status = ANY (ARRAY[
        'ready'::offer_status,
        'sent'::offer_status,
        'viewed'::offer_status,
        'revision'::offer_status,
        'accepted'::offer_status,
        'won'::offer_status
      ])
  )
);