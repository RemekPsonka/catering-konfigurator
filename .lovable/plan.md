

## Plan: Floating panel dosprzedaży + kalkulacja łączna [CS-030]

### 1. Rozszerz `calculateOfferTotals` w `src/lib/calculations.ts`

- Dodaj opcjonalny parametr `upsellTotal: number = 0`
- Dodaj `upsellTotal` do `OfferTotals` interface
- W `grandTotal`: `dishesAfterDiscount + servicesTotalCalc + deliveryCost + upsellTotal`
- W każdym `variantGrandTotal`: dodaj `+ upsellTotal`
- Przelicz `pricePerPerson` z nowym `grandTotal`
- Rabat NIE dotyczy upsellTotal — dodawany po rabacie

### 2. Zaktualizuj wszystkie wywołania `calculateOfferTotals`

Dodaj `0` jako ostatni argument (domyślny upsellTotal) w:
- `src/pages/public/offer.tsx` (2 wywołania)
- `src/components/public/calculation-section.tsx` (2 wywołania)
- `src/components/public/acceptance-section.tsx` (1 wywołanie)
- `src/components/features/offers/steps/step-pricing.tsx` (1 wywołanie)
- `src/components/features/offers/steps/step-preview-send.tsx` (1 wywołanie)
- `src/hooks/use-calculation-state.ts` (1 wywołanie)

Dzięki default value `= 0` nie trzeba nic zmieniać, ale dla czytelności zaktualizuję `offer.tsx` i `calculation-section.tsx` żeby przekazywały `offer.upsell_total ?? 0`.

### 3. Rozszerz `changes-panel.tsx`

**Nowe dane:**
- Dodaj query `offer_upsell_selections` WHERE `offer_id` AND `status='active'`, join `upsell_items(name, emoji)`
- Dodaj mutation `confirmUpsells`: UPDATE `offer_upsell_selections` SET `confirmed_at=now()` + UPDATE `offers` SET `upsell_total=SUM`
- Dodaj state `upsellConfirmed`

**Nowe props:**
- `upsellTotal: number` (suma aktywnych selekcji, obliczona w offer.tsx)

**Zmiana widoczności panelu:**
- Panel widoczny gdy `hasChanges || hasUpsellSelections || pendingProposals`
- Collapsed bar: "Masz X zmian i Y dodatków — zobacz"

**UI — nowa sekcja "Twoje dodatki" pod listą zmian dań:**
- Lista: emoji + nazwa + kwota + przycisk [×] do usunięcia (mutation: SET status='removed')
- Suma dodatków
- Separator
- Podsumowanie: "Oferta bazowa: X zł" / "Dodatki: Y zł" / "RAZEM: Z zł"

**Przycisk [Zatwierdź dodatki]:**
- Batch update `confirmed_at = now()` na aktywnych selekcjach
- Update `offers.upsell_total` = suma `total_price`
- Toast: "Dodatki zatwierdzone! Manager został powiadomiony."
- Fire notification z event_type `upsell_confirmed`
- Przycisk → "✓ Dodatki zatwierdzone" (disabled)

**Istniejący flow propozycji dań nie zmienia się** — przycisk "Wyślij propozycję zmian" dotyczy tylko modyfikacji dań.

### 4. Przekaż upsellTotal do `ChangesPanel` z `offer.tsx`

- W `offer.tsx`: query `offer_upsell_selections` lub użyj `offer.upsell_total` do przekazania
- Alternatywnie: changes-panel sam fetchuje dane (prostsze, mniej propsów)

**Decyzja:** changes-panel sam fetchuje `offer_upsell_selections` — ma pełną kontrolę nad danymi i mutacjami.

### Pliki modyfikowane
1. `src/lib/calculations.ts` — dodanie `upsellTotal` parametru
2. `src/components/public/changes-panel.tsx` — sekcja dodatków + przycisk zatwierdzenia
3. `src/pages/public/offer.tsx` — przekazanie upsellTotal do kalkulacji

### Nie ruszam
- Logika modyfikacji dań w changes-panel (istniejący flow propozycji)
- step-pricing.tsx, step-event-data.tsx, step-menu.tsx
- upsell-section.tsx, suggested-services-section.tsx

