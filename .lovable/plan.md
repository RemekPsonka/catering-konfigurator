
# Bugfix: Propozycje wariantów — nazwa zamiast numeru

## Pliki do zmiany

### 1. `src/components/public/dish-edit-panel.tsx`
- Dodać `variantOptionLabel?: string` do interfejsu `DishModification` (linia 13)
- W `VariantPanel` onChange (linia 217-221) dodać `variantOptionLabel: opt.label`

### 2. `src/hooks/use-public-offer.ts`
- Linia 139: zmienić `mod.variantOptionIndex?.toString()` na `mod.variantOptionLabel ?? mod.variantOptionIndex?.toString()`

### 3. Brak zmian w `offer-messages.tsx`
- Wyświetlanie `proposedVariantOption` jako string już działa — teraz pokaże nazwę zamiast numeru

## Efekt
- Nowe propozycje zapisują "sos pieprzowy" zamiast "2"
- Stare propozycje w bazie nadal pokazują numer (backward compatible)
