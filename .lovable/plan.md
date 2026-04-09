

# Dodanie opcji "Usuń" do listy ofert

## Zakres
Dodanie przycisku "Usuń" w dropdown menu na liście ofert z potwierdzeniem (ConfirmDialog). Soft-delete: ustawienie `deleted_at = now()` zamiast fizycznego usunięcia.

## Pliki do zmodyfikowania

### 1. `src/hooks/use-offers.ts`
- Nowy hook `useDeleteOffer` — mutation: `supabase.from('offers').update({ deleted_at: new Date().toISOString() }).eq('id', offerId)`
- Toast sukcesu: "Oferta usunięta"
- Invalidate `['offers']`

### 2. `src/pages/admin/offers-list.tsx`
- Import `Trash2` z lucide-react, `ConfirmDialog` z common
- State: `deleteOfferId: string | null`
- Nowy `DropdownMenuItem` "Usuń" (czerwony tekst, ikona Trash2) — ustawia `deleteOfferId`
- `ConfirmDialog` na dole: "Czy na pewno chcesz usunąć tę ofertę? Tej operacji nie można cofnąć."
- Po potwierdzeniu: wywołaj `deleteOffer.mutate(deleteOfferId)`

### 3. `src/hooks/use-offers.ts` (query)
- Dodać `.is('deleted_at', null)` do query w `useOffers` żeby nie pokazywać usuniętych ofert

## Uwaga
Tabela `offers` powinna mieć kolumnę `deleted_at` — jeśli nie istnieje, trzeba dodać migrację. Sprawdzę to w implementacji i w razie potrzeby utworzę migrację.

## Brak zmian w RLS — istniejące policies pozwalają na UPDATE własnych ofert.

