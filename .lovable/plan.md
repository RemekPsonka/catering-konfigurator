

# Sekcje: Moje Zmiany, Uwagi, Warunki, Akceptacja, Kontakt

## Zakres
Pięć nowych komponentów na stronie publicznej oferty (`/offer/:publicToken`) + auto-save draftów + logika akceptacji oferty.

## Pliki do utworzenia

### 1. `src/components/public/changes-panel.tsx`
Floating panel "Moje zmiany":
- Props: `modifications: Map<string, DishModification>`, `offer: PublicOffer`, `onClearModifications`, `onSubmitProposal`
- Widoczność: `AnimatePresence` slide-up gdy `modifications.size > 0`
- Mobile: sticky bottom bar "Masz [N] zmian — zobacz" → klik rozwija bottom sheet (80vh)
- Desktop: sticky card `position: sticky; bottom: 2rem` po prawej
- Lista zmian z ikonami per typ (🔄/🎨/✂️/👥), stagger animation
- "Łączny wpływ: ±X zł" z `AnimatedPrice`
- Textarea "Dodatkowy komentarz" z auto-resize
- Przycisk "Wyślij propozycję zmian" z `motion.button` hover/tap
- Po wysłaniu: INSERT `change_proposals` (status: pending) + `proposal_items` per zmianę, UPDATE offers status → revision, CSS confetti animation, toast sukces
- Auto-save: `useEffect` z 5s interwałem → upsert `change_proposals` (status: draft_client), dyskretna ikona "zapisano"
- Banner oczekujących propozycji: query `change_proposals` where status = pending

### 2. `src/components/public/corrections-section.tsx`
Sekcja "Uwagi i korekty":
- Elegancki textarea z themed styling
- Przycisk "Wyślij korektę" (outline)
- INSERT `offer_corrections` + toast

### 3. `src/components/public/terms-section.tsx`
Sekcja "Warunki oferty":
- Query `offer_terms` where `is_active = true` ordered by `display_order`
- Accordion z framer-motion height transition
- Per warunek: ikona (mapowanie key → emoji), label bold + value
- Pierwszy domyślnie otwarty

### 4. `src/components/public/acceptance-section.tsx`
Sekcja "Akceptacja oferty":
- Widoczna gdy status IN (sent, viewed, revision) i `offer.accepted_at` null
- Jeśli >1 wariant: radio-card pattern do wyboru wariantu
- Przycisk "Akceptuję ofertę" — duży, themed, motion hover/tap
- Confirmation dialog z backdrop-blur (AlertDialog pattern)
- Po potwierdzeniu: UPDATE offers `accepted_at = now()`, `status = accepted`, `accepted_variant_id`
- Animated checkmark SVG + komunikat sukcesu
- Ukryj sekcję po akceptacji

### 5. `src/components/public/contact-section.tsx`
Sekcja "Kontakt":
- Karty: Phone, Mail, Instagram (Lucide icons)
- Hover: kolor → `--theme-primary`
- Linki: `tel:`, `mailto:`, `https://instagram.com/`

## Pliki do zmodyfikowania

### 6. `src/pages/public/offer.tsx`
- Import i render 5 nowych komponentów między CalculationSection a Footer
- Kolejność: ChangesPanel (floating), TermsSection, CorrectionsSection, AcceptanceSection, ContactSection
- Dodaj `accepted` state do ukrycia AcceptanceSection po akceptacji
- Przekaż callback do czyszczenia modifications po wysłaniu propozycji

### 7. `src/hooks/use-public-offer.ts`
- Dodaj `usePublicOfferProposals(offerId)` — query pending change_proposals
- Dodaj `useSubmitProposal()` — mutation: INSERT change_proposals + proposal_items + UPDATE offers status
- Dodaj `useAcceptOffer()` — mutation: UPDATE offers accepted_at, status, accepted_variant_id
- Dodaj `useSubmitCorrection()` — mutation: INSERT offer_corrections
- Dodaj `useOfferTerms()` — query offer_terms where is_active

## Szczegóły techniczne
- RLS: `change_proposals`, `proposal_items`, `offer_corrections`, `offer_events` mają publiczne INSERT policies — nie wymaga auth
- `offer_terms` ma public SELECT policy — nie wymaga auth
- Offers UPDATE dla akceptacji: wymaga auth policy (`auth.uid() IS NOT NULL`). Problem: klient nie jest zalogowany. Rozwiązanie: użyj RPC function lub dodaj publiczną UPDATE policy ograniczoną do `accepted_at`, `status`, `accepted_variant_id` na ofertach z `public_token IS NOT NULL`
- Auto-save draft: upsert po `offer_id` + `status = draft_client` (jeden draft na raz)
- Proposal items mapping: `modifications` Map → `proposal_items` rows z `change_type`, `original_dish_id`, `proposed_dish_id`, ceny
- Brak migration potrzebnej OPRÓCZ: publiczna UPDATE policy na `offers` dla akceptacji (ograniczona do pól akceptacji)

## Wymagana migracja
```sql
CREATE POLICY "public_offer_accept" ON public.offers
FOR UPDATE TO public
USING (public_token IS NOT NULL AND status IN ('sent', 'viewed', 'revision'))
WITH CHECK (public_token IS NOT NULL AND status = 'accepted');
```
Ta policy pozwoli klientowi zaakceptować ofertę bez logowania.

