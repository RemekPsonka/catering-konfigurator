

# Duplikacja oferty — poprawki

## Stan obecny
Duplikacja już istnieje w `useDuplicateOffer` (hook) + przycisk w menu kontekstowym na liście ofert. Redirect do edycji działa.

Większość logiki jest poprawna: daty (`event_date`, `sent_at`, `viewed_at`, `accepted_at`) nie są kopiowane (auto-cleared), `lead_id` nie jest kopiowany, `status = 'draft'`, `offer_number`/`public_token`/`valid_until` generowane przez triggery.

## Co wymaga poprawki

### `src/hooks/use-offers.ts` — `useDuplicateOffer`
1. Usunąć kopiowanie pól kalkulacyjnych (powinny być 0, przeliczone po edycji):
   - `total_dishes_value`, `total_services_value`, `total_value`, `price_per_person` → nie kopiować (DB defaults = 0)
2. Usunąć `notes_internal` z kopii (notatki wewnętrzne dotyczą oryginalnej oferty)
3. Usunąć `inquiry_text` z kopii (treść zapytania dotyczy oryginalnego klienta)
4. Zmienić toast na: `"Oferta zduplikowana! Uzupełnij klienta i daty."`
5. Zachować `client_id` (NOT NULL constraint) — klient widoczny w kroku 1, manager może go zmienić

### Brak zmian w bazie danych
Brak zmian w pozostałych plikach — redirect i przycisk już działają poprawnie.
