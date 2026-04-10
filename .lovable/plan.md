

# Inline akceptacja propozycji zmian w widoku komunikacji

## Problem
1. Powiadomienie o propozycji zmian kieruje do `/admin/offers/:id/edit` — manager widzi konfigurator, nie widzi co się zmieniło
2. Na stronie komunikacji propozycja pokazuje listę zmian, ale akceptacja wymaga przejścia na osobną stronę diff
3. Manager chce: zobaczyć co klient zmienił → kliknąć akceptuj/odrzuć → gotowe

## Rozwiązanie

### 1. Naprawić link w powiadomieniu (`src/components/public/changes-panel.tsx`)
Zmienić `link` w `fireNotification` z:
```
/admin/offers/${offer.id}/edit
```
na:
```
/admin/offers/${offer.id}/messages
```

### 2. Dodać inline akceptację w `ProposalBubble` (`src/pages/admin/offer-messages.tsx`)
- Przy każdej pozycji propozycji (SWAP, VARIANT, SPLIT, QUANTITY) dodać przyciski ✅ / ❌ (jak na stronie diff)
- Użyć istniejących hooków `useUpdateProposalItem` i `useResolveProposal` z `use-proposal-diff.ts`
- Po zaakceptowaniu/odrzuceniu wszystkich pozycji → pojawia się przycisk "Zatwierdź decyzje" z opcjonalną notatką
- Po zatwierdzeniu → automatyczne rozpatrzenie propozycji (accepted / partially_accepted / rejected)
- Dodać flash animację (zielony/czerwony) przy kliknięciu, jak na stronie diff
- Pokazać wpływ cenowy per pozycja (oryginalna cena → proponowana)

### 3. Wzbogacić dane w `useAdminProposals` (`src/hooks/use-offer-corrections.ts`)
- Dodać pola `original_price`, `proposed_price`, `original_quantity`, `proposed_quantity` do query, żeby wyświetlać wpływ cenowy inline

### 4. Invalidacja query
- Po aktualizacji proposal item → invalidować `['admin-proposals']` oprócz `['proposal-detail']`
- Dodać w `useUpdateProposalItem` i `useResolveProposal`

## Efekt końcowy
Manager klika powiadomienie → trafia do widoku komunikacji → widzi co klient chce zmienić z cenami → klika akceptuj/odrzuć per pozycja → zatwierdza → koniec. Bez przechodzenia na osobną stronę.

Strona diff (`/proposals/:proposalId`) zostaje jako backup dla skomplikowanych przypadków.

## Pliki do zmiany
- `src/components/public/changes-panel.tsx` — fix notification link
- `src/pages/admin/offer-messages.tsx` — inline accept/reject w ProposalBubble
- `src/hooks/use-offer-corrections.ts` — rozszerzyć query o ceny
- `src/hooks/use-proposal-diff.ts` — dodać invalidację `admin-proposals`

