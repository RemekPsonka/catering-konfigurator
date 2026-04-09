
CREATE POLICY "public_categories_read" ON public.dish_categories
FOR SELECT USING (is_active = true);

CREATE POLICY "public_clients_read" ON public.clients
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM offers
    WHERE offers.client_id = clients.id
      AND offers.public_token IS NOT NULL
      AND offers.status = ANY (ARRAY[
        'ready'::offer_status, 'sent'::offer_status,
        'viewed'::offer_status, 'revision'::offer_status,
        'accepted'::offer_status, 'won'::offer_status
      ])
  )
);
