

# Proposal Diff Page — Premium z AnimatePresence

## Zakres
Zastąpienie placeholder `ProposalDiffPage` pełną stroną porównania propozycji zmian klienta. Manager widzi diff tabeli (oryginał vs propozycja), akceptuje/odrzuca per wiersz z flash animacjami, podsumowuje i zapisuje decyzje.

## Pliki do utworzenia/zmodyfikowania

### 1. `src/hooks/use-proposal-diff.ts` (nowy)
Hook do pobrania danych propozycji:
- `useProposalDetail(proposalId)` — query `change_proposals` + `proposal_items(*, dishes!proposal_items_original_dish_id_fkey(*), proposed_dish:dishes!proposal_items_proposed_dish_id_fkey(*))` + offer data
- `useUpdateProposalItem()` — mutation: UPDATE `proposal_items` SET `status`, `manager_note`, `decided_at`, `decided_by`
- `useResolveProposal()` — mutation: UPDATE `change_proposals` SET `status` (accepted/partially_accepted/rejected), `resolved_at`, `manager_notes`

### 2. `src/pages/admin/proposal-diff.tsx` (zastąpienie placeholder)
Pełna strona diff:
- `useParams()` → `id` (offerId), `proposalId`
- Nagłówek: nazwa klienta, data propozycji, status badge, wiadomość klienta
- Tabela diff z kolumnami: Pozycja | Oryginał | Propozycja | Wpływ cenowy | Status | Akcje
- Per wiersz: ikona change_type (🔄/🎨/✂️/👥), oryginalna nazwa+cena vs proponowana nazwa+cena
- Przyciski: ✅ Akceptuj / ❌ Odrzuć per wiersz
- Podsumowanie: łączny wpływ cenowy zaakceptowanych zmian
- Przycisk "Zatwierdź decyzje" — resolve proposal

### 3. Premium animacje w tabeli diff
- **AnimatePresence**: każdy wiersz opakowany w `motion.tr` z `initial/animate/exit` (fadeInUp/fadeOut)
- **Flash na akceptacji**: po kliknięciu ✅ → wiersz flashuje zielono (bg-green-100 → transparent, 200ms transition via `animate` z keyframes)
- **Flash na odrzuceniu**: po kliknięciu ❌ → wiersz flashuje czerwono (bg-red-100 → transparent, 200ms)
- Implementacja: `useState` per wiersz z `flashColor`, `useEffect` z 200ms timeout do reset
- `motion.tr` z `layout` prop dla smooth reorder gdy wiersze zmieniają status
- Badge statusu per wiersz: pending=gray, accepted=green (scaleIn), rejected=red (scaleIn)

## Szczegóły techniczne
- Typy z `Tables<'proposal_items'>` i `Tables<'change_proposals'>`
- `proposal_item_status`: pending | accepted | rejected | invalidated
- `proposal_status`: draft_client | pending | accepted | partially_accepted | rejected
- Resolve logic: jeśli wszystkie items accepted → proposal status = accepted; jeśli mix → partially_accepted; jeśli wszystkie rejected → rejected
- framer-motion `AnimatePresence` + `motion.tr` (wymaga `<tbody>` jako wrapper)
- Flash: `animate={{ backgroundColor: ['rgba(34,197,94,0.2)', 'rgba(34,197,94,0)'] }}` z `transition={{ duration: 0.4 }}`
- Brak zmian w bazie danych — tabele i policies już istnieją

