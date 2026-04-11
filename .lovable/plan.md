

## Plan: Uporządkowanie RLS policies z zachowaniem dostępu klienta

### Analiza stanu obecnego

Wiele tabel **już ma** poprawne policies. Porównanie wykazało, które wymagają zmian:

**Już OK (nie ruszamy):**
- `dish_photos`, `offer_faq`, `event_type_photos`, `testimonials`, `company_stats`, `company_info`, `offer_themes` — mają public SELECT z `USING (true)`
- `leads`, `notifications`, `offer_follow_ups`, `offer_templates`, `offer_versions` — mają auth-only ALL
- `offers`, `clients`, `offer_variants`, `variant_items`, `offer_services`, `offer_corrections`, `survey_responses` — per request, nie ruszamy

**Wymagają zmian (is_active=true → true):**
- `dishes` — obecnie `USING (is_active = true)` → `USING (true)` (bo variant_items mogą referencjonować nieaktywne dania)
- `dish_categories` — jw.
- `services` — jw.
- `offer_terms` — jw.
- `event_type_profiles` — jw.

**Wymagają zmian (zbyt restrykcyjne INSERT):**
- `offer_events` — INSERT wymaga offer JOIN → uproszczenie do `WITH CHECK (true)`
- `change_proposals` — policy wymaga offer JOIN → uproszczenie
- `proposal_items` — policy wymaga offer JOIN → uproszczenie

**Tabela `internal_notes` — NIE ISTNIEJE w schemacie, pomijamy.**

### Uwaga bezpieczeństwa
Otwarcie `change_proposals` na DELETE dla anon to ryzyko — ktoś mógłby usunąć cudze propozycje znając UUID. Ale per request, implementuję jak podano. Alternatywa: ograniczyć DELETE do `status = 'draft_client'`.

Usunięcie `is_active = true` z public SELECT na dishes/services/categories oznacza że nieaktywne pozycje będą widoczne publicznie. To potrzebne bo variant_items mogą wskazywać na zarchiwizowane dania.

### Migracja SQL (1 plik)

Dla każdej tabeli: `DROP POLICY IF EXISTS` starych → `CREATE POLICY` nowych. Nie tworzymy `ENABLE ROW LEVEL SECURITY` jeśli RLS jest już włączone (a jest na wszystkich).

**Zmieniane policies (5 tabel — zmiana filtra):**
1. `dishes` — drop `public_dishes_read` + `auth_full_access`, create z USING(true)
2. `dish_categories` — jw.
3. `services` — drop `public_services_read` + `auth_full_access`, create nowe
4. `offer_terms` — drop `public_read_terms` + `auth_full_access`, create nowe
5. `event_type_profiles` — drop `public_read_profiles` + `auth_full_access` + `dev_full_access`, create nowe

**Zmieniane policies (3 tabeli — uproszczenie INSERT/CRUD):**
6. `offer_events` — drop stare, create INSERT WITH CHECK(true) + auth ALL
7. `change_proposals` — drop stare 4 policies, create open SELECT/INSERT/UPDATE/DELETE + auth ALL
8. `proposal_items` — drop stare 2 policies, create open SELECT/INSERT + auth ALL

**Cleanup (2 tabele — usunięcie dev_full_access):**
9. `event_type_photos` — drop `dev_full_access` (policy "public_read_photos" i "auth_full_access" wystarczą)
10. `event_type_profiles` — already handled above

### Pliki modyfikowane
1. Nowa migracja SQL (jedyny plik)

### Brak zmian w kodzie
Frontend nie wymaga żadnych modyfikacji — queries pozostają takie same.

