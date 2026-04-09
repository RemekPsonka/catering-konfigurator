

# Krok 5 wizarda — Kalkulacja i podsumowanie

## Zakres
Implementacja kroku 5: read-only podsumowanie finansowe oferty z edytowalnymi polami rabatu, dostawy i tekstów. Zapisuje `discount_percent`, `discount_value`, `delivery_cost`, `greeting_text`, `notes_client`, `ai_summary` do tabeli `offers`.

## Plik do utworzenia

### `src/components/features/offers/steps/step-calculation.tsx`

Komponent z 7 sekcjami w Card-ach:

**Sekcja 1 — Kalkulacja per wariant** (Accordion/Tabs):
- Reuse `useOfferVariants(offerId)` + `getItemPrice()` z `use-offer-variants.ts`
- Per wariant: tabela read-only (Danie | Ilość | Cena jedn. | Suma)
- Podsumowanie zależne od `pricingMode`:
  - PER_PERSON: `[kwota]/os × [people_count] os = [total] zł`
  - FIXED_QUANTITY: `[total] zł`

**Sekcja 2 — Usługi** (read-only):
- Reuse `useOfferServices(offerId)`
- Tabela: Usługa | Ilość | Cena | Suma
- "Usługi łącznie: X zł"

**Sekcja 3 — Rabat** (edytowalne):
- RadioGroup: "Rabat procentowy" / "Rabat kwotowy"
- Input % → auto-wylicz kwotę: "Rabat X% = Y zł"
- Lub input PLN
- Rabat TYLKO od dań (nie usług/dostawy)
- "Dania po rabacie: X zł"

**Sekcja 4 — Dostawa** (edytowalne):
- Input number: kwota dostawy

**Sekcja 5 — Podsumowanie końcowe** (read-only kalkulacja):
- Dania (najdroższy wariant): X zł
- Rabat: -Y zł
- Usługi: Z zł
- Dostawa: W zł
- **ŁĄCZNIE: TOTAL zł**
- Cena/os: TOTAL / people_count

**Sekcja 6 — Tekst powitalny** (edytowalne):
- Textarea z pre-filled `greeting_text` z kroku 1
- Przycisk "Wygeneruj z AI" (na przyszłość — disabled z tooltipem "Wkrótce")

**Sekcja 7 — Notatki**:
- Textarea "Notatki dla klienta" (`notes_client`)
- Textarea "Notatki wewnętrzne" (`notes_internal`) — widoczne tylko w admin

### Auto-save:
- Mutation UPDATE `offers` z `discount_percent`, `discount_value`, `delivery_cost`, `greeting_text`, `notes_client`, `notes_internal` na blur/change (debounced)
- Przelicz `total_dishes_value`, `total_services_value`, `total_value`, `price_per_person` i zapisz do `offers`

## Plik do zmodyfikowania

### `src/components/features/offers/offer-wizard.tsx`
- Import `StepCalculation`, render w `case 5`
- Props: `offerId`, `pricingMode`, `peopleCount`

## Szczegóły techniczne
- Najdroższy wariant do podsumowania: `Math.max(...variants.map(v => calculateVariantTotal(v)))`
- Formuła: `total = (dishes_total - discount) + services_total + delivery_cost`
- Rabat XOR: jeśli `discount_percent > 0` → `discount_value = 0` i odwrotnie
- `formatCurrency()` z `src/lib/calculations.ts` do wyświetlania kwot
- Brak zmian w bazie danych

