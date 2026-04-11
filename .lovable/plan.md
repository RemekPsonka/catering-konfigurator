

## Plan: Poprawka inline propozycji — czytelne etykiety + pełna propagacja zmian

### Problemy zidentyfikowane w audycie

1. **Inline row pokazuje "Wariant → 0"** zamiast "Wariant → Medium rare" — brak rozwiązania indeksu na etykietę
2. **Akceptacja zapisałaby `selected_variant_option = "0"`** do `variant_items` — zamiast prawdziwej nazwy wariantu
3. **Po akceptacji tabela menu się nie odświeża** — brak invalidacji `offer-variants` w `useResolveProposal`
4. **Banner/inline rows nie znikają po decyzji** — brak invalidacji `admin-pending-proposals`

### Zmiany

**1. `src/hooks/use-admin-pending-proposals.ts`** — rozwiązanie nazw wariantów

Rozszerzenie query o join do `variant_items` z `dishes(modifiable_items)`. W mapowaniu: jeśli `changeType === 'VARIANT_CHANGE'` i `proposed_variant_option` to cyfra, rozwiąż na etykietę z `modifiable_items.options[index].label`. Dodanie pola `resolvedProposedLabel` do `PendingProposalItem`.

**2. `src/components/features/offers/steps/variant-items-table.tsx`** — lepszy opis inline

Zamiast `{pi.proposedDishName ?? pi.proposedVariantOption ?? '—'}` użyj:
- SWAP: "Zamiana na: **[nazwa dania]**"
- VARIANT_CHANGE: "Zmiana wariantu na: **[etykieta]**" + różnica cenowa
- QUANTITY_CHANGE: "Zmiana ilości na: **X szt.**"

Pełniejszy opis w wierszu zamiast suchych wartości.

**3. `src/hooks/use-proposal-diff.ts` — `useResolveProposal`**

- Przy `VARIANT_CHANGE`: rozwiąż `proposed_variant_option` na etykietę z `modifiable_items` PRZED zapisem do `variant_items.selected_variant_option`
- Dodanie invalidacji `offer-variants` i `admin-pending-proposals` w `onSuccess`

**4. `src/components/features/offers/steps/step-menu.tsx` — `checkAndAutoResolve`**

Dodanie invalidacji `admin-pending-proposals` po auto-resolve, żeby banner i inline rows znikały natychmiast.

### Pliki modyfikowane
- `src/hooks/use-admin-pending-proposals.ts` — rozszerzenie query + label resolution
- `src/components/features/offers/steps/variant-items-table.tsx` — lepsze opisy inline
- `src/hooks/use-proposal-diff.ts` — fix variant label przy apply + dodatkowe invalidacje
- `src/components/features/offers/steps/step-menu.tsx` — invalidacja po decyzji

