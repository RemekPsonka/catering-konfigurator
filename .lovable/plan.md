

## Plan: Fix PER_PERSON service quantity bug

### Problem
When adding a PER_PERSON service, `quantity` is always set to `1` in the database. The useEffect that syncs quantity only fires when `peopleCount` changes, not when a new service is added.

### Zmiany (3 pliki)

**1. `src/hooks/use-offer-services.ts`** — dodaj opcjonalny `quantity` do `useAddOfferService`:
- Parametr: `quantity?: number`
- Insert: `quantity: quantity ?? 1`

**2. `src/components/features/offers/steps/step-pricing.tsx`** — 2 zmiany:
- `handleServiceToggle`: przy `checked=true` oblicz `qty = service.price_type === 'PER_PERSON' && peopleCount > 0 ? peopleCount : 1` i przekaż do `addService.mutate`
- `useEffect` (linia 73): dodaj `offerServices` do dependency array

**3. `src/components/features/offers/steps/step-services.tsx`** — ten sam bug:
- `handleToggle` (linia 81): dodaj obliczenie `qty` jak wyżej
- `useEffect` (linia 64): dodaj `offerServices` do dependency array

### Bez zmian
- `src/lib/calculations.ts` — kalkulacja `price × quantity` jest poprawna
- `ServicesPanel.tsx`, widok publiczny — wyświetlanie oparte na `quantity` z DB, zadziała po fix

