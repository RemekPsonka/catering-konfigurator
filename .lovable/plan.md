

## Plan: Dodatki (upsell) w wycenie managera + ilość u klienta [CS-038]

### Problem
1. **Panel managera**: Zatwierdzone przez klienta dodatki (upsell selections) nie są widoczne w kroku Wycena (StepPricing) — pojawiają się dopiero w kroku Podgląd i wysyłka.
2. **Panel klienta**: Klient może dodać tylko 1 sztukę upsell itema (np. patera owoców) — brak możliwości wyboru ilości.

### Zmiany

**1. `src/components/features/offers/steps/step-pricing.tsx` — sekcja "Dodatki klienta"**

- Dodaj query `offer_upsell_selections` (status=active, join `upsell_items(name, emoji)`) — taki sam jak w step-preview-send
- Dodaj nową sekcję Collapsible "Dodatki klienta 🎁" między usługami a rabatem, wyświetlającą listę zatwierdzonych upsell items z ilością, ceną jednostkową i łączną
- Oblicz `upsellTotal` i przekaż do `calculateOfferTotals` (obecnie jest 0)
- Pokaż `upsellTotal` w podsumowaniu sticky jako oddzielną linię
- Manager widzi ale nie edytuje (read-only) — to wybory klienta

**2. `src/components/public/upsell-section.tsx` — wybór ilości**

- Dla itemów z `price_type !== 'PER_PERSON'`: dodaj kontrolkę +/- ilości (min 1, max 10) przed przyciskiem "Dodaj"
- Dla dodanych itemów: pokaż aktualną ilość i pozwól ją zmienić (update mutation na `offer_upsell_selections`)
- Dla `PER_PERSON`: ilość = peopleCount (bez zmian, automatyczna)
- Dodaj mutation `updateQuantity` która aktualizuje `quantity` i `total_price` w `offer_upsell_selections`

**3. `src/components/public/changes-panel.tsx` — wyświetlanie ilości w panelu zmian**

- Przy wyświetlaniu upsell items w panelu "Moje zmiany", pokaż ilość × cena gdy quantity > 1

### Pliki modyfikowane
1. `src/components/features/offers/steps/step-pricing.tsx` — sekcja upsell + totals
2. `src/components/public/upsell-section.tsx` — kontrolka ilości
3. `src/components/public/changes-panel.tsx` — wyświetlanie ilości

### Nie ruszam
- `calculations.ts` (już obsługuje `upsellTotal` jako parametr)
- `step-preview-send.tsx` (już wyświetla upsell)
- `suggested-services-section.tsx`

