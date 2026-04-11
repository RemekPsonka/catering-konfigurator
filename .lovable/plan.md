

## Plan: Rozbudowa kroku Menu — propozycje klienta + zmiany w imieniu klienta

Krok Menu (krok 2 wizarda) zostanie rozbudowany o dwie kluczowe funkcje:
1. **Widok propozycji klienta** — manager widzi inline przy każdym daniu, co klient zaproponował (zamiana, wariant, podział)
2. **Edycja w imieniu klienta** — manager może sam dokonać zamiany/wyboru wariantu bezpośrednio w tabeli dań, bez czekania na propozycję klienta

### Zakres zmian

**1. Nowy komponent: `ClientProposalsBanner`** (`src/components/features/offers/steps/client-proposals-banner.tsx`)
- Pobiera pending proposals (`useAdminProposals`) i wyświetla banner nad tabelą wariantu
- Pokazuje liczbę oczekujących propozycji z linkiem do strony diff (`/admin/offers/:id/proposals/:proposalId`)
- Jeśli brak propozycji — nie renderuje nic

**2. Rozbudowa `VariantItemsTable`** — inline widok zmian klienta
- Dodanie prop `pendingProposals` z danymi propozycji klienta
- Przy każdym daniu, które ma oczekującą propozycję, wyświetlenie kolorowego wiersza pod daniem:
  - Ikona typu zmiany (🔄 SWAP, 🎨 VARIANT, ✂️ SPLIT)
  - "Klient proponuje: [nazwa dania/wariantu]" z ceną różnicową
  - Szybkie przyciski ✓ Akceptuj / ✗ Odrzuć (inline, bez przechodzenia na osobną stronę)
- Badge na daniu "Propozycja klienta" w kolorze pomarańczowym gdy jest pending proposal

**3. Rozbudowa `VariantItemsTable`** — manager zmienia w imieniu klienta
- Przy daniach z `is_client_editable=true` i skonfigurowanymi zamiennikami, dodanie nowego przycisku "Zmień za klienta" (ikona UserCog) w kolumnie Akcje
- Kliknięcie otwiera `ModificationOverrideDialog` ale w trybie "apply" — zamiast zapisywania konfiguracji zamienników, bezpośrednio aplikuje zmianę do `variant_items`:
  - **SWAP**: zmienia `dish_id`, `custom_name`, `custom_price`
  - **VARIANT**: ustawia `selected_variant_option`, `custom_price`
  - Zapisuje bezpośrednio do bazy (nie tworzy `change_proposals`)

**4. Nowy dialog: `ManagerModificationDialog`** (`src/components/features/offers/steps/manager-modification-dialog.tsx`)
- Podobny do `DishEditPanel` z widoku klienta, ale w formie dialogu
- Parsuje `allowed_modifications` / `modifiable_items` dania
- Wyświetla opcje zamiany/wariantu/podziału z cenami
- Po wybraniu — bezpośrednio updateuje `variant_items` w bazie
- Toast: "Zmieniono danie w imieniu klienta"

**5. Aktualizacja `StepMenu`**
- Import i renderowanie `ClientProposalsBanner` nad tabelą każdego wariantu
- Przekazanie `pendingProposals` do `VariantItemsTable`
- Przeniesienie `ProposalHistoryPanel` wyżej — tuż pod tabelą wariantu (zamiast na dole pod kalkulacją)

### Szczegóły techniczne

**Pliki tworzone:**
- `src/components/features/offers/steps/client-proposals-banner.tsx` (~60 linii)
- `src/components/features/offers/steps/manager-modification-dialog.tsx` (~180 linii)

**Pliki modyfikowane:**
- `src/components/features/offers/steps/variant-items-table.tsx` — dodanie inline proposals + przycisk "Zmień za klienta"
- `src/components/features/offers/steps/step-menu.tsx` — podpięcie bannera, przekazanie danych propozycji
- `src/hooks/use-offer-corrections.ts` — dodanie hooka `useAdminPendingProposalItems` (mapowanie proposal_items → variant_item_id)

**Flow inline accept/reject:**
- Używa istniejących `useUpdateProposalItem` i `useResolveProposal` z `use-proposal-diff.ts`
- Po akceptacji/odrzuceniu wszystkich itemów w propozycji — auto-resolve propozycji
- Po akceptacji SWAP/VARIANT — automatyczna aktualizacja `variant_items` (logika już istnieje w `useResolveProposal`)

**Flow "zmień za klienta":**
- Manager klika przycisk → otwiera `ManagerModificationDialog`
- Wybiera zamianę/wariant → `supabase.from('variant_items').update(...)` bezpośrednio
- Invalidacja query `['offer-variants', offerId]`
- Nie tworzy rekordu w `change_proposals` — to jest bezpośrednia zmiana managera

