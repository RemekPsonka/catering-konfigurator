

## Plan: Fix — oferty pokazują wartość 0 zł

### Problem
`total_value` w bazie jest aktualizowane TYLKO gdy manager odwiedza krok 3 (Wycena) w kreatorze. Jeśli manager doda dania ale nie wejdzie na krok wyceny — wartość zostaje 0,00 zł.

Oferta CS-2026-0004 ma 1 danie (custom_price=70 zł, 70 osób) ale total_value=0 bo krok wyceny nigdy nie był otwarty.

### Rozwiązanie — przelicz total_value przy każdym zapisie draftu i zmianie statusu

**Plik: `src/hooks/use-offer-wizard.ts`** — w `saveDraftMutation`, po zapisie/aktualizacji oferty, oblicz wartość na podstawie wariantów i usług:

1. Po `supabase.from('offers').update/insert(...)`, jeśli `state.offerId` istnieje:
   - Pobierz `offer_variants` z `variant_items(*, dishes(*))` i `offer_services(*, services(*))`
   - Użyj `calculateOfferTotals()` z `src/lib/calculations.ts`
   - Zaktualizuj `offers` z obliczonymi `total_value`, `total_dishes_value`, `total_services_value`, `price_per_person`

2. Dodaj tę samą logikę do `handleSaveDraft` w `step-preview-send.tsx` (już tam jest częściowo przez `statusMutation`)

**Plik: `src/hooks/use-offer-variants.ts`** — po dodaniu/usunięciu dania z wariantu (`useAddVariantItem`, `useRemoveVariantItem`), przelicz i zapisz total_value:

1. W `onSuccess` każdej mutacji, pobierz aktualne warianty+usługi, oblicz totals, zapisz do offers

**Plik: `src/hooks/use-offer-services.ts`** — po dodaniu/usunięciu usługi, analogicznie przelicz i zapisz total_value

### Implementacja — helper do przeliczania

Nowy helper w `src/lib/calculations.ts` (lub osobny plik):

```typescript
export const recalculateOfferTotals = async (offerId: string) => {
  // 1. Pobierz ofertę (pricing_mode, people_count, discount_*, delivery_cost)
  // 2. Pobierz warianty z daniami
  // 3. Pobierz usługi
  // 4. calculateOfferTotals(...)
  // 5. UPDATE offers SET total_value, total_dishes_value, total_services_value, price_per_person
};
```

Wywołaj w `onSuccess` mutacji: `useAddVariantItem`, `useRemoveVariantItem`, `useUpdateVariantItem`, `useAddOfferService`, `useRemoveOfferService`, `useUpdateOfferService`.

### Pliki modyfikowane (3-4)
1. `src/lib/calculations.ts` — nowy helper `recalculateOfferTotals`
2. `src/hooks/use-offer-variants.ts` — wywołaj recalculate w onSuccess mutacji
3. `src/hooks/use-offer-services.ts` — wywołaj recalculate w onSuccess mutacji
4. `src/hooks/use-calculation-state.ts` — nadal działa jak dotąd (saveFinancials przy zmianie rabatu/dostawy)

### Bez zmian
- `offers-list.tsx` — już czyta `total_value` z DB, po fix będzie poprawna
- `calculations.ts` (logika obliczeniowa) — bez zmian, tylko dodanie helpera
- `use-offer-wizard.ts` — nie trzeba, bo recalculate odpali się z hooków wariantów/usług

