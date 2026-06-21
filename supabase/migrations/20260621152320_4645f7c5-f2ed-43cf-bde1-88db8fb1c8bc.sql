-- ============================================================
-- SECURITY HARDENING: anon-CRUD lockdown + column-level offers
-- Tickets: CS-042, CS-043, CS-044, CS-045
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_offer_public(p_offer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM offers
    WHERE id = p_offer_id
      AND public_token IS NOT NULL
  )
$$;

CREATE OR REPLACE FUNCTION public.is_offer_editable_by_client(p_offer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM offers
    WHERE id = p_offer_id
      AND public_token IS NOT NULL
      AND status IN ('ready'::offer_status, 'sent'::offer_status, 'viewed'::offer_status, 'revision'::offer_status)
  )
$$;

-- ============================================================
-- CS-042: change_proposals
-- ============================================================
DROP POLICY IF EXISTS "public_proposals_read" ON public.change_proposals;
DROP POLICY IF EXISTS "public_proposals_insert" ON public.change_proposals;
DROP POLICY IF EXISTS "public_proposals_update" ON public.change_proposals;
DROP POLICY IF EXISTS "public_proposals_delete" ON public.change_proposals;

CREATE POLICY "change_proposals_select_public" ON public.change_proposals
  FOR SELECT USING (public.is_offer_public(offer_id));

CREATE POLICY "change_proposals_insert_public" ON public.change_proposals
  FOR INSERT WITH CHECK (public.is_offer_editable_by_client(offer_id));

CREATE POLICY "change_proposals_update_public" ON public.change_proposals
  FOR UPDATE
  USING (public.is_offer_public(offer_id))
  WITH CHECK (public.is_offer_editable_by_client(offer_id));

CREATE POLICY "change_proposals_delete_public" ON public.change_proposals
  FOR DELETE USING (public.is_offer_editable_by_client(offer_id));

-- ============================================================
-- CS-042b: proposal_items
-- ============================================================
DROP POLICY IF EXISTS "public_pitems_read" ON public.proposal_items;
DROP POLICY IF EXISTS "public_pitems_insert" ON public.proposal_items;

CREATE POLICY "proposal_items_select_public" ON public.proposal_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM change_proposals cp
      WHERE cp.id = proposal_items.proposal_id
        AND public.is_offer_public(cp.offer_id)
    )
  );

CREATE POLICY "proposal_items_insert_public" ON public.proposal_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM change_proposals cp
      WHERE cp.id = proposal_items.proposal_id
        AND public.is_offer_editable_by_client(cp.offer_id)
    )
  );

-- ============================================================
-- CS-043: offer_events
-- ============================================================
DROP POLICY IF EXISTS "public_events_insert" ON public.offer_events;

CREATE POLICY "offer_events_insert_public" ON public.offer_events
  FOR INSERT WITH CHECK (public.is_offer_public(offer_id));

-- ============================================================
-- CS-044: offers UPDATE - column-level protection
-- ============================================================
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'offers' AND cmd = 'UPDATE'
      AND 'public' = ANY(roles)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.offers', pol.policyname);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_offer_client_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.discount_percent IS DISTINCT FROM OLD.discount_percent
    OR NEW.discount_value IS DISTINCT FROM OLD.discount_value
    OR NEW.delivery_cost IS DISTINCT FROM OLD.delivery_cost
    OR NEW.total_value IS DISTINCT FROM OLD.total_value
    OR NEW.price_per_person IS DISTINCT FROM OLD.price_per_person
    OR NEW.min_offer_price IS DISTINCT FROM OLD.min_offer_price
    OR NEW.notes_internal IS DISTINCT FROM OLD.notes_internal
    OR NEW.notes_client IS DISTINCT FROM OLD.notes_client
    OR NEW.event_type IS DISTINCT FROM OLD.event_type
    OR NEW.event_date IS DISTINCT FROM OLD.event_date
    OR NEW.valid_until IS DISTINCT FROM OLD.valid_until
    OR NEW.client_id IS DISTINCT FROM OLD.client_id
    OR NEW.coordinator_name IS DISTINCT FROM OLD.coordinator_name
    OR NEW.coordinator_phone IS DISTINCT FROM OLD.coordinator_phone
    OR NEW.pricing_mode IS DISTINCT FROM OLD.pricing_mode
    OR NEW.price_display_mode IS DISTINCT FROM OLD.price_display_mode
    OR NEW.is_people_count_editable IS DISTINCT FROM OLD.is_people_count_editable
    OR NEW.theme_id IS DISTINCT FROM OLD.theme_id
    OR NEW.created_by IS DISTINCT FROM OLD.created_by
  THEN
    RAISE EXCEPTION 'Klient nie ma uprawnień do modyfikacji tych pól oferty'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status NOT IN (
    'viewed'::offer_status, 'revision'::offer_status, 'accepted'::offer_status
  ) THEN
    RAISE EXCEPTION 'Klient nie może ustawić statusu na %', NEW.status
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_offer_client_columns ON public.offers;
CREATE TRIGGER trg_enforce_offer_client_columns
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_offer_client_columns();

CREATE POLICY "offers_update_public_limited" ON public.offers
  FOR UPDATE
  USING (public.is_offer_editable_by_client(id))
  WITH CHECK (public.is_offer_editable_by_client(id));

-- ============================================================
-- CS-045: is_active filter dla słowników publicznych
-- ============================================================
DROP POLICY IF EXISTS "public_dishes_read" ON public.dishes;
CREATE POLICY "dishes_select_active_public" ON public.dishes
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "public_services_read" ON public.services;
CREATE POLICY "services_select_active_public" ON public.services
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "public_terms_read" ON public.offer_terms;
CREATE POLICY "offer_terms_select_active_public" ON public.offer_terms
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "testimonials_public_read" ON public.testimonials;
CREATE POLICY "testimonials_select_active_public" ON public.testimonials
  FOR SELECT USING (is_active = true);

-- offer_upsell_selections
DROP POLICY IF EXISTS "upsell_selections_select_all" ON public.offer_upsell_selections;
DROP POLICY IF EXISTS "upsell_selections_insert_all" ON public.offer_upsell_selections;
DROP POLICY IF EXISTS "upsell_selections_update_all" ON public.offer_upsell_selections;

CREATE POLICY "upsell_selections_select_public" ON public.offer_upsell_selections
  FOR SELECT USING (public.is_offer_public(offer_id));

CREATE POLICY "upsell_selections_insert_public" ON public.offer_upsell_selections
  FOR INSERT WITH CHECK (public.is_offer_editable_by_client(offer_id));

CREATE POLICY "upsell_selections_update_public" ON public.offer_upsell_selections
  FOR UPDATE
  USING (public.is_offer_public(offer_id))
  WITH CHECK (public.is_offer_editable_by_client(offer_id));