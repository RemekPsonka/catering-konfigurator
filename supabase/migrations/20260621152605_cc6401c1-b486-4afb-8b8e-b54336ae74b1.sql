-- ============================================================
-- PERFORMANCE: brakujące indeksy na FK + hot-paths
-- Ticket: CS-052
-- ============================================================

-- 10 brakujących indeksów na FK (z audytu hot-paths)
CREATE INDEX IF NOT EXISTS idx_dish_photos_dish_id ON public.dish_photos(dish_id);
CREATE INDEX IF NOT EXISTS idx_offer_services_service_id ON public.offer_services(service_id);
CREATE INDEX IF NOT EXISTS idx_offer_upsell_selections_upsell_item_id ON public.offer_upsell_selections(upsell_item_id);
CREATE INDEX IF NOT EXISTS idx_offers_accepted_variant_id ON public.offers(accepted_variant_id) WHERE accepted_variant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_offers_theme_id ON public.offers(theme_id) WHERE theme_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposal_items_original_dish_id ON public.proposal_items(original_dish_id) WHERE original_dish_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposal_items_proposed_dish_id ON public.proposal_items(proposed_dish_id) WHERE proposed_dish_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposal_items_variant_item_id ON public.proposal_items(variant_item_id) WHERE variant_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_survey_responses_offer_id ON public.survey_responses(offer_id);
CREATE INDEX IF NOT EXISTS idx_variant_items_split_parent_id ON public.variant_items(split_parent_id) WHERE split_parent_id IS NOT NULL;

-- Hot-path 1: lista ofert filtrowana po statusie (dashboard "Wygasające", lista admin z tabsami)
CREATE INDEX IF NOT EXISTS idx_offers_status_event_date ON public.offers(status, event_date) WHERE event_date IS NOT NULL;

-- Hot-path 2: scoring z offer_events agregowane po offer_id + chronologia
CREATE INDEX IF NOT EXISTS idx_offer_events_offer_id_created_at ON public.offer_events(offer_id, created_at DESC);

-- Hot-path 3: lookup oferty po public_token + valid_until (dla expiry checków)
CREATE INDEX IF NOT EXISTS idx_offers_valid_until_status ON public.offers(valid_until, status) WHERE valid_until IS NOT NULL AND public_token IS NOT NULL;

-- Hot-path 4: dashboard "Hot offers" sortowane po conversion_score
CREATE INDEX IF NOT EXISTS idx_offers_conversion_score_status ON public.offers(conversion_score DESC, status) WHERE conversion_score IS NOT NULL AND status NOT IN ('won'::offer_status, 'lost'::offer_status, 'expired'::offer_status);

-- ANALYZE żeby planner natychmiast skorzystał z nowych indeksów
ANALYZE public.dish_photos;
ANALYZE public.offer_services;
ANALYZE public.offer_upsell_selections;
ANALYZE public.offers;
ANALYZE public.proposal_items;
ANALYZE public.survey_responses;
ANALYZE public.variant_items;
ANALYZE public.offer_events;