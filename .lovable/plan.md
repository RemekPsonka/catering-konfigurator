

# Naprawy wysokie — dish ID, race condition, walidacja rabatu

## Pliki do zmiany

### 1. `src/hooks/use-public-offer.ts` — linia 147

Zmiana fallbacku `?? itemId` na `?? null`:
```typescript
original_dish_id: variantItem?.dishes?.id ?? null,
```

### 2. `src/components/public/calculation-section.tsx` — linie 35, 69-78

**Linia 35:** Zabezpieczenie ref przed null:
```typescript
const prevValidCount = useRef(people_count ?? 1);
```

**Linie 69-78:** Zamiana useEffect — synchroniczne obliczanie totals zamiast polegania na useMemo:
```typescript
useEffect(() => {
  if (!min_offer_price || min_offer_price <= 0) return;
  if (debouncedCount === prevValidCount.current) return;

  const checkTotals = calculateOfferTotals(
    pricing_mode, debouncedCount, adjustedVariants, services,
    discount_percent ?? 0, discount_value ?? 0, delivery_cost ?? 0,
  );

  if (checkTotals.grandTotal < min_offer_price) {
    toast.error('Ta zmiana nie jest możliwa. Skontaktuj się z nami, aby omówić alternatywy.', { className: 'shake-toast' });
    setLocalPeopleCount(prevValidCount.current ?? people_count ?? 1);
  } else {
    prevValidCount.current = debouncedCount;
  }
}, [debouncedCount, pricing_mode, adjustedVariants, services, discount_percent, discount_value, delivery_cost, min_offer_price]);
```

### 3. `src/components/features/offers/steps/step-calculation.tsx` — linie 143, 165, ~451

**saveFinancials (linia 143):** Dodać walidację przed mutacją:
```typescript
const saveFinancials = () => {
  if (!offerId) return;
  const dp = discountType === 'percent' ? discountPercent : 0;
  const dv = discountType === 'value' ? discountValue : 0;

  if (dv > 0) {
    const maxTotal = Math.max(...totals.variantTotals.map(v => v.total), 0);
    if (dv > maxTotal) {
      toast.error(`Rabat (${dv} zł) nie może przekroczyć wartości dań (${maxTotal.toFixed(2)} zł)`);
      return;
    }
  }

  saveMutation.mutate({ ... });
};
```

**Input rabatu kwotowego (~linia 451):** Dodać warunkowy czerwony border gdy `discountValue > totals.maxDishesTotal`.

### 4. `src/lib/calculations.ts` — linia 58

Na początku `calculateOfferTotals`, wymuszenie minimum 1 osoby:
```typescript
const safePeopleCount = Math.max(1, Math.round(peopleCount));
```
Zamiana wszystkich `peopleCount` wewnątrz funkcji na `safePeopleCount` (linie 70, 81, 107).

### 5. `src/hooks/use-offer-wizard.ts` — linie 192-204

Dodać tracking nieudanych wariantów:
```typescript
const failedVariants: string[] = [];
// w pętli:
if (nvErr || !newVar) {
  console.error('Nie udało się skopiować wariantu:', v.name, nvErr?.message);
  failedVariants.push(v.name);
  continue;
}
// po pętli:
if (failedVariants.length > 0) {
  toast.warning(`Nie udało się skopiować wariantów: ${failedVariants.join(', ')}. Dodaj je ręcznie.`);
}
```

## Efekt
- Propozycje klienta zapisują poprawny dish ID lub null (nie item ID)
- Race condition przy zmianie gości wyeliminowany — synchroniczne obliczanie
- Admin widzi błąd przy za dużym rabacie + czerwony border
- peopleCount zawsze >= 1 w obliczeniach
- Nieudane kopiowanie wariantów z szablonu zgłaszane użytkownikowi

