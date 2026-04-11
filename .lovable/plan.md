

## Plan: Fix frozenPrice bug + refactor getDishPrice/getItemPrice

### 1. Bug fix — default case w useAddVariantItem
W `src/hooks/use-offer-variants.ts` linia 132: dodaj `default: frozenPrice = dish.price_per_person ?? 0; break;`

### 2. Refaktor — przeniesienie typów i funkcji do calculations.ts

**`src/lib/calculations.ts`** — na początek pliku:
- Przenieś interfejsy `VariantItemWithDish` i `VariantWithItems` (z importem `Tables`, `Json`)
- Przenieś funkcje `getDishPrice` i `getItemPrice`
- Usuń import `from '@/hooks/use-offer-variants'`

**`src/hooks/use-offer-variants.ts`** — zamień definicje na re-export:
```typescript
export { getDishPrice, getItemPrice } from '@/lib/calculations';
export type { VariantItemWithDish, VariantWithItems } from '@/lib/calculations';
```
To zachowa backward compat — żaden istniejący import nie złamie się.

### 3. Aktualizacja importów w 10 plikach

Pliki importujące **tylko typy/funkcje cenowe** (nie hooki) — zmienię import na `from '@/lib/calculations'`:

| Plik | Import zmieniony |
|------|-----------------|
| `steps/step-preview-send.tsx` | `getDishPrice` |
| `steps/calculation/VariantsPanel.tsx` | `VariantWithItems`, `getItemPrice` |
| `steps/variant-items-table.tsx` | `VariantItemWithDish`, `getItemPrice` |
| `steps/manager-modification-dialog.tsx` | `VariantItemWithDish` |
| `public/variant-comparison-section.tsx` | `VariantWithItems` |
| `public/menu-variants-section.tsx` | `VariantWithItems` |
| `public/acceptance-section.tsx` | `VariantWithItems` |
| `public/calculation-section.tsx` | `getItemPrice`, `VariantWithItems` |
| `pages/public/offer.tsx` | `getItemPrice`, `VariantWithItems` |

Pliki importujące **hooki + typy** — zostawiam podwójny import (hook z hooka, typy z calculations):
- `steps/step-menu.tsx` — `useOfferVariants` z hooka, `getItemPrice`+`VariantWithItems` z calculations
- `hooks/use-calculation-state.ts` — `useOfferVariants` z hooka, `getItemPrice` z calculations
- `steps/step-pricing.tsx` — `useOfferVariants` z hooka (bez zmian, nie importuje typów/funkcji cenowych)

### Pliki modyfikowane (12)
1. `src/lib/calculations.ts` — dodaj typy + funkcje, usuń import z hooka
2. `src/hooks/use-offer-variants.ts` — re-export + bug fix default case
3-12. 10 plików z aktualizacją importów

### Brak circular dependency
`calculations.ts` → importuje z `supabase/types` i `service-constants` (nie z hooków)
`use-offer-variants.ts` → re-exportuje z `calculations.ts` (jednokierunkowy)

