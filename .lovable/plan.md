

# Propozycje klienta — aplikowanie zmian + wyświetlanie wariantów

## Status

**ZMIANA 1 (nazwy wariantów zamiast indeksów) — JUŻ ZROBIONA.** `variantOptionLabel` istnieje w interfejsie, jest zapisywane w onChange i użyte w `use-public-offer.ts`. Nie wymaga zmian.

**ZMIANA 4 (custom_name przy swapie) — JUŻ ZROBIONA.** `dish-card.tsx` linia 78 już używa `item.custom_name ?? dish.display_name`.

## Pliki do zmiany

### 1. `src/hooks/use-proposal-diff.ts` — aplikuj zaakceptowane zmiany do variant_items

Rozszerz `useResolveProposal`:
- Po zapisaniu statusu propozycji, pobierz `proposal_items` ze statusem `accepted` (z relacją `proposed_dish`)
- Dla każdego zaakceptowanego itemu zaktualizuj `variant_items`:
  - **SWAP**: `dish_id` → nowe danie, `custom_price`, `custom_name` z `proposed_dish.display_name`
  - **VARIANT_CHANGE**: `selected_variant_option`, `custom_price`
  - **QUANTITY_CHANGE**: `quantity`, `custom_price`
- Dodaj invalidację `['public-offer']` i `['offer']` w `onSuccess`

### 2. `src/components/public/dish-card.tsx` — wyświetl wybrany wariant

Po nazwie dania (linia ~168), jeśli `item.selected_variant_option` istnieje, dodaj badge/podpis:
```tsx
{item.selected_variant_option && (
  <span className="text-xs opacity-60 ml-1">
    ({item.selected_variant_option})
  </span>
)}
```

## Nie zmieniam
- `dish-edit-panel.tsx` — `variantOptionLabel` już dodane
- `use-public-offer.ts` — już używa `variantOptionLabel`
- `calculation-section.tsx` — `custom_name` już obsługiwane

## Flow po zmianach
Klient wybiera wariant → propozycja z nazwą → manager akceptuje → `variant_items` zaktualizowane → klient widzi zmianę po odświeżeniu

