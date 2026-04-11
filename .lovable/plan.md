

## Plan: Tracking zachowań + Scoring Dashboard [CS-038]

### Obecny stan
- `trackOfferEvent()` w `src/lib/tracking.ts` — fire-and-forget insert do `offer_events`
- `calculate_conversion_score()` — DB function istnieje, oblicza score 0-100
- `offers.conversion_score` i `offers.last_client_activity_at` — kolumny istnieją
- Brak triggera na `offer_events` INSERT → score nie jest aktualizowany automatycznie
- Brak trackera na publicznej stronie (poza punktowymi wywołaniami w FAQ i Share)
- Brak sekcji HOT na dashboardzie

### Zmiany

**1. DB trigger: auto-update scoring po INSERT do offer_events**
- Migration: CREATE FUNCTION `update_offer_scoring()` — po INSERT do `offer_events`: wywołuje `calculate_conversion_score(NEW.offer_id)`, UPDATE `offers SET conversion_score = wynik, last_client_activity_at = now()`
- CREATE TRIGGER `trg_update_scoring` AFTER INSERT ON `offer_events` FOR EACH ROW

**2. Nowy plik: `src/components/public/offer-tracker.tsx`**
- Invisible component, renderowany w `offer.tsx`
- Props: `offerId`, `variantCount`
- Używa React ref do deduplication (Set of sent event keys)
- Trackowane eventy:
  - `page_open`: raz per mount (ref guard)
  - `section_view`: IntersectionObserver na sekcjach (data-track-section attribute) — menu, services, calculation, upsell, faq, acceptance
  - `scroll_depth`: sentinel divs at 25/50/75/100% — IntersectionObserver, raz per próg
  - `time_on_page`: `visibilitychange` + `beforeunload` — wysyła `{ seconds }`, min 5s żeby nie spamować
- Debounce: ten sam event_type nie częściej niż 30s (timestamp ref)

**3. Wariant tracking w `offer.tsx`**
- Przy `setActiveVariantId` → `trackOfferEvent(offer.id, 'variant_compared', { variant_id })` z debounce (ref, max raz na 30s)

**4. Nowy hook: `src/hooks/use-hot-offers.ts`**
- `useHotOffers()`: SELECT `offers` WHERE status IN ('sent','viewed','revision'), `conversion_score > 0`, ORDER BY `conversion_score DESC`, LIMIT 10, JOIN `clients(name)`
- Zwraca: id, offer_number, client name, event_type, conversion_score, last_client_activity_at

**5. Dashboard: sekcja "Oferty HOT 🔥"** (`dashboard.tsx`)
- Nowa sekcja między KPI a Warnings
- Per oferta: Card/row z offer_number, client_name, conversion_score (Progress bar: zielony 70+, żółty 40-69, czerwony 0-39), last_client_activity_at (formatDistanceToNow)
- CTA: klik → navigate do `/admin/offers/${id}/edit`
- Empty state: "Brak aktywnych ofert z aktywnością klienta"

### Nowe pliki
1. `src/components/public/offer-tracker.tsx`
2. `src/hooks/use-hot-offers.ts`

### Modyfikowane pliki
1. `src/pages/public/offer.tsx` — dodaj `<OfferTracker>`, variant_compared tracking, data-track-section attrs
2. `src/pages/admin/dashboard.tsx` — sekcja HOT offers
3. `src/hooks/use-dashboard.ts` — (opcjonalnie, jeśli hook trafi tu zamiast osobnego pliku)

### Migration SQL
- `update_offer_scoring()` trigger function + trigger na `offer_events`

### Nie ruszam
- Istniejących wywołań trackOfferEvent (FAQ, Share), logiki kalkulacji, wizarda, schematu offer_events

