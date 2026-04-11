

## Plan: Wyświetlanie wybranego wariantu klienta [CS-037]

### Problem
Gdy klient akceptuje ofertę, jego wybór wariantu zapisywany jest w `offers.accepted_variant_id` — ale nigdzie w portalu managera ani na stronie klienta (po akceptacji) ta informacja nie jest widoczna.

### Zmiany

**1. `src/components/features/offers/steps/step-menu.tsx` — Badge "Wybrany przez klienta" na tabie wariantu**

- Dodaj prop `acceptedVariantId?: string | null` do `StepMenuProps`
- Na `TabsTrigger` wariantu, gdy `v.id === acceptedVariantId`, dodaj badge:
  ```
  {v.id === acceptedVariantId && (
    <Badge className="bg-green-100 text-green-800 text-[10px]">✓ Wybrany</Badge>
  )}
  ```
- W nagłówku karty wariantu (linia ~260), analogiczny badge "Klient wybrał ten wariant"

**2. `src/components/features/offers/offer-wizard.tsx` — przekazanie `acceptedVariantId`**

- `offerQuery.data` już zawiera `accepted_variant_id` (bo pobiera `*` z tabeli `offers`)
- Przekaż do `StepMenu`:
  ```tsx
  <StepMenu offerId={...} acceptedVariantId={offerQuery.data?.accepted_variant_id} ... />
  ```

**3. `src/pages/admin/offers-list.tsx` — kolumna/badge "Wybrany wariant" na liście ofert**

- Dla ofert ze statusem `accepted`/`won`: pokaż badge z nazwą wybranego wariantu
- Wymaga dociągnięcia `offer_variants(id, name)` w query `useOffers`
- Badge pod statusem: "Wariant: Premium" (zielony)

**4. `src/components/public/variant-comparison-section.tsx` — wyróżnienie wybranego wariantu po akceptacji**

- Dodaj prop `acceptedVariantId?: string | null`
- Gdy oferta zaakceptowana i wariant === accepted: zielona ramka + badge "Twój wybór ✓"
- Pozostałe warianty wyszarzone (opacity-50)

**5. `src/pages/public/offer.tsx` — przekazanie `accepted_variant_id` do sekcji wariantów**

- `offer.accepted_variant_id` jest już dostępne z hooka `usePublicOffer`
- Przekaż do `VariantComparisonSection` i `MenuVariantsSection`

### Pliki modyfikowane
1. `src/components/features/offers/steps/step-menu.tsx` — badge na tabie i karcie
2. `src/components/features/offers/offer-wizard.tsx` — przekazanie prop
3. `src/hooks/use-offers.ts` — dociągnięcie `offer_variants(id,name)` + `accepted_variant_id`
4. `src/pages/admin/offers-list.tsx` — badge z nazwą wariantu
5. `src/components/public/variant-comparison-section.tsx` — wizualne wyróżnienie
6. `src/pages/public/offer.tsx` — przekazanie prop

### Nie ruszam
- `acceptance-section.tsx` (logika akceptacji działa poprawnie)
- `use-public-offer.ts` (dane są już pobierane)
- `changes-panel.tsx`

