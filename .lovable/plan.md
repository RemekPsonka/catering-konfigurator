

# Naprawa: link oferty ze statusem "ready" nie działa

## Diagnoza
Oferta ma status `ready` (ustawiony przez "Zapisz i pokaż link"), ale:
1. **RLS policy `public_offer_read`** pozwala tylko na `sent, viewed, revision, accepted` — brak `ready`
2. **Hook `usePublicOffer`** filtruje `.in('status', ['sent', 'viewed', 'revision', 'accepted', 'won'])` — brak `ready`
3. **RLS na powiązanych tabelach** (`offer_variants`, `variant_items`, `offer_services`) — też brak `ready`

## Rozwiązanie
Dodać `ready` do wszystkich miejsc kontrolujących dostęp publiczny.

## Zmiany

### 1. Migracja — aktualizacja 5 RLS policies
- `public_offer_read` na `offers` — dodać `ready`
- `public_offer_accept` na `offers` — dodać `ready` do USING
- `public_variants_read` na `offer_variants` — dodać `ready`
- `public_items_read` na `variant_items` — dodać `ready`
- `public_services_read` na `offer_services` — dodać `ready`

### 2. `src/hooks/use-public-offer.ts`
- Linia z `.in('status', [...])` — dodać `'ready'` do tablicy

### 3. `src/pages/public/offer-find.tsx`
- Sprawdzić czy `ACCESSIBLE_STATUSES` zawiera `ready` — jeśli nie, dodać

## Brak zmian strukturalnych w bazie danych — tylko aktualizacja policies.

