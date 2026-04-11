

## Plan: Wyświetlanie szczegółów podziału (SPLIT) w panelu managera [CS-037b]

### Problem
Propozycje typu SPLIT zapisują dane w kolumnie `split_details` JSONB (`{ percent: 60, splitDishId: "...", splitDishName: "Polędwica wołowa sous-vide" }`), ale panel managera tego nie czyta — pokazuje tylko "Podział → —".

### Zmiany

**1. `src/hooks/use-admin-pending-proposals.ts` — dodaj `splitDetails` do `PendingProposalItem`**

- Dodaj pole `splitDetails: { percent: number; splitDishId: string; splitDishName: string } | null` do interfejsu
- W query: dodaj `split_details` do SELECT z `proposal_items`
- W mapowaniu: przypisz `splitDetails: item.split_details`

**2. `src/components/features/offers/steps/variant-items-table.tsx` — opis SPLIT w wierszu propozycji**

Zmiana w bloku `descriptionNode` (linia ~207), dodaj case dla SPLIT:
```tsx
if (pi.changeType === 'SPLIT' && pi.splitDetails) {
  return <>Podział: <strong>{pi.splitDetails.percent}%</strong> oryginał + <strong>{100 - pi.splitDetails.percent}%</strong> {pi.splitDetails.splitDishName}</>;
}
```

Efekt w UI: `Podział → Podział: 60% oryginał + 40% Polędwica wołowa sous-vide`

**3. `src/pages/admin/proposal-diff.tsx` — opis SPLIT na stronie diff**

Analogiczna zmiana w `DiffCard` — wyświetl szczegóły podziału zamiast "—".

### Pliki modyfikowane
1. `src/hooks/use-admin-pending-proposals.ts` — interface + query + mapping
2. `src/components/features/offers/steps/variant-items-table.tsx` — opis SPLIT
3. `src/pages/admin/proposal-diff.tsx` — opis SPLIT w widoku diff

### Nie ruszam
- `changes-panel.tsx`, `use-public-offer.ts`, `use-proposal-diff.ts`
