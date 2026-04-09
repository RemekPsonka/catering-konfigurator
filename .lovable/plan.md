

# Lista ofert — /admin/offers

## Zakres
Zamiana placeholdera `offers-list.tsx` na pełną stronę listy ofert z tabelą, filtrami, paginacją, menu kontekstowym i duplikacją.

## Wymagane zmiany w typach i stałych

### 1. `src/types/database.ts`
Zaktualizować typ `OfferStatus` z 6 do 8 wartości (dodać `ready`, `revision`, `won`, `lost`; usunąć `rejected`, `expired` — nie istnieją w DB enum).

### 2. `src/lib/constants.ts`
- Zaktualizować `OFFER_STATUS_LABELS` i `OFFER_STATUS_COLORS` do 8 statusów z poprawnymi kolorami:
  - draft: szary, ready: niebieski, sent: indygo, viewed: fioletowy, revision: pomarańczowy, accepted: zielony, won: ciemno-zielony bold, lost: czerwony
- Dodać `EVENT_TYPE_LABELS_FULL` z 12 typami eventów (KOM→Komunia, WES→Wesele, FIR→Firmowy, KON→Konferencja, PRY→Przyjęcie prywatne, GAL→Gala, STY→Stypa, GRI→Grill, B2B→Spotkanie B2B, BOX→Catering pudełkowy, KAW→Przerwa kawowa, SPE→Specjalny)

## Pliki do utworzenia

### 3. `src/hooks/use-offers.ts`
Hook React Query:
- `useOffers({ status?, eventType?, search?, page })` — query `offers` z LEFT JOIN na `clients` (nazwa klienta), sortowanie `created_at DESC`, paginacja 20/stronę, filtr statusu/event_type, search po `offer_number` i `client.name` via `.or()`
- `useDuplicateOffer()` — mutation: pobiera ofertę + warianty + variant_items + offer_services, tworzy kopię z: status=draft, wyczyszczony client_id, event_date, sent_at, viewed_at, accepted_at, nowy public_token (trigger)

### 4. `src/pages/admin/offers-list.tsx`
Pełna strona listy ofert:

**Filtry:**
- Status tabs: Wszystkie + 8 statusów
- Wyszukiwarka debounced 300ms (po numerze oferty, nazwie klienta)
- Dropdown typ eventu (12 typów + "Wszystkie")

**Tabela:**
- Kolumny: Numer | Klient | Typ eventu | Data | Wartość | Status | Utworzono | Akcje
- Klik w wiersz → `/admin/offers/:id/edit`
- Formatowanie: data DD.MM.YYYY, wartość w zł, StatusBadge

**Menu kontekstowe (DropdownMenu per wiersz):**
- Edytuj → navigate
- Duplikuj → `useDuplicateOffer` + toast + navigate do nowej oferty
- Podgląd klienta → `window.open(/offer/:publicToken)` w nowej karcie

**Paginacja:** 20/stronę, wzorowana na dishes-list

**Przycisk:** "Nowa oferta" → `/admin/offers/new`

## Szczegóły techniczne
- Join klienta: `supabase.from('offers').select('*, clients!client_id(name)')` — Supabase embedded select
- Duplikacja: INSERT offer (bez client_id, event_date, timestamps) → dla każdego wariantu INSERT variant → bulk INSERT variant_items → bulk INSERT offer_services. Wszystko w jednym mutation.
- Search: `.or('offer_number.ilike.%${search}%,clients.name.ilike.%${search}%')` — jeśli cross-table or nie działa, fallback do filtrowania offer_number w query + client name w JS
- Brak zmian w bazie danych

