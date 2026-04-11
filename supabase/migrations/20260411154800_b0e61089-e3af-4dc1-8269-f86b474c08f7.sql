
-- 1. dishes: is_active=true → true
DROP POLICY IF EXISTS "public_dishes_read" ON public.dishes;
CREATE POLICY "public_dishes_read" ON public.dishes FOR SELECT USING (true);

-- 2. dish_categories: is_active=true → true
DROP POLICY IF EXISTS "public_categories_read" ON public.dish_categories;
CREATE POLICY "public_categories_read" ON public.dish_categories FOR SELECT USING (true);

-- 3. services: is_active=true → true
DROP POLICY IF EXISTS "public_services_read" ON public.services;
CREATE POLICY "public_services_read" ON public.services FOR SELECT USING (true);

-- 4. offer_terms: is_active=true → true
DROP POLICY IF EXISTS "public_read_terms" ON public.offer_terms;
CREATE POLICY "public_terms_read" ON public.offer_terms FOR SELECT USING (true);

-- 5. event_type_profiles: is_active=true → true + remove dev_full_access
DROP POLICY IF EXISTS "public_read_profiles" ON public.event_type_profiles;
DROP POLICY IF EXISTS "dev_full_access" ON public.event_type_profiles;
CREATE POLICY "public_profiles_read" ON public.event_type_profiles FOR SELECT USING (true);

-- 6. event_type_photos: remove dev_full_access (public_read_photos + auth_full_access already exist)
DROP POLICY IF EXISTS "dev_full_access" ON public.event_type_photos;

-- 7. offer_events: simplify INSERT
DROP POLICY IF EXISTS "public_events_insert" ON public.offer_events;
CREATE POLICY "public_events_insert" ON public.offer_events FOR INSERT WITH CHECK (true);

-- 8. change_proposals: open public CRUD
DROP POLICY IF EXISTS "public_proposals_read" ON public.change_proposals;
DROP POLICY IF EXISTS "public_proposals_insert" ON public.change_proposals;
DROP POLICY IF EXISTS "public_proposals_update" ON public.change_proposals;
CREATE POLICY "public_proposals_read" ON public.change_proposals FOR SELECT USING (true);
CREATE POLICY "public_proposals_insert" ON public.change_proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "public_proposals_update" ON public.change_proposals FOR UPDATE USING (true);
CREATE POLICY "public_proposals_delete" ON public.change_proposals FOR DELETE USING (true);

-- 9. proposal_items: open public read + insert
DROP POLICY IF EXISTS "public_proposal_items_read" ON public.proposal_items;
DROP POLICY IF EXISTS "public_proposal_items_insert" ON public.proposal_items;
CREATE POLICY "public_pitems_read" ON public.proposal_items FOR SELECT USING (true);
CREATE POLICY "public_pitems_insert" ON public.proposal_items FOR INSERT WITH CHECK (true);
