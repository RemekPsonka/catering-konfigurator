

# Trzy CRUD-y: Usługi, Klienci, Konta

## Zakres
Zamiana placeholderów na pełne strony CRUD dla usług dodatkowych, klientów oraz dodanie podstrony zarządzania kontami w ustawieniach.

## Pliki do utworzenia

### 1. `src/hooks/use-services.ts`
Hook React Query dla tabeli `services`:
- `useServices(filterType?)` — lista usług z opcjonalnym filtrem `type` (STAFF/EQUIPMENT/LOGISTICS)
- `useCreateService` — INSERT + toast
- `useUpdateService` — UPDATE + toast
- `useToggleServiceActive` — toggle `is_active`

### 2. `src/hooks/use-clients.ts`
Hook React Query dla tabeli `clients`:
- `useClients(search?)` — lista klientów z debounced search (name, email, company via `.or()`) + count ofert per klient (osobny query na `offers` grouped by `client_id`)
- `useCreateClient` — INSERT + toast
- `useUpdateClient` — UPDATE + toast

### 3. `src/components/features/services/service-dialog.tsx`
Modal dodawania/edycji usługi (wzór: `category-dialog.tsx`):
- Pola: nazwa (wymagana), opis, typ (Select: STAFF/EQUIPMENT/LOGISTICS), typ ceny (Select: PER_HOUR/PER_EVENT/PER_PIECE/PER_PERSON), cena (number), aktywna (Switch)
- Zod walidacja, React Hook Form

### 4. `src/components/features/services/services-page.tsx`
Strona z tabelą usług:
- Tabs filtrujące: Wszystkie / Obsługa / Sprzęt / Logistyka
- Tabela: Nazwa | Typ | Typ ceny | Cena | Status (Badge) | Akcje (Edytuj)
- Przycisk "Dodaj usługę" otwiera modal
- Toggle aktywności bezpośrednio w tabeli

### 5. `src/components/features/clients/client-dialog.tsx`
Modal dodawania/edycji klienta:
- Pola: nazwa (wymagana), email, telefon, firma, typ klienta (Select: Prywatny/Firma/Instytucja/Agencja/Powracający → PRIVATE/BUSINESS/INSTITUTION/AGENCY/RETURNING), notatki (Textarea), powracający (Switch)
- Zod walidacja

### 6. `src/components/features/clients/clients-page.tsx`
Strona z tabelą klientów:
- Wyszukiwarka debounced (300ms)
- Tabela: Nazwa | Email | Telefon | Firma | Typ (Badge) | Powracający (✓/—) | Oferty (count) | Akcje (Edytuj)
- Przycisk "Dodaj klienta"

### 7. `src/components/features/settings/accounts-page.tsx`
Podstrona zarządzania kontami:
- Lista kont z Supabase Auth (via edge function — frontend nie ma dostępu do `auth.users`)
- Tabela: Email | Rola | Ostatnie logowanie
- Na MVP: rola z `user_metadata.role` (admin/manager)
- Przycisk "Wyślij reset hasła" → `supabase.auth.resetPasswordForEmail(email)`
- Formularz dodawania konta: email + hasło + rola (dialog)

### 8. `supabase/functions/list-users/index.ts`
Edge function do listowania użytkowników (wymaga service_role):
- GET → zwraca listę users z `supabase.auth.admin.listUsers()`
- POST (create) → `supabase.auth.admin.createUser({ email, password, user_metadata: { role } })`

### 9. `src/lib/service-constants.ts`
Stałe z polskimi etykietami:
- `SERVICE_TYPE_LABELS`: STAFF→"Obsługa", EQUIPMENT→"Sprzęt", LOGISTICS→"Logistyka"
- `PRICE_TYPE_LABELS`: PER_HOUR→"Za godzinę", PER_EVENT→"Za event", PER_PIECE→"Za sztukę", PER_PERSON→"Za osobę"
- `CLIENT_TYPE_LABELS`: PRIVATE→"Prywatny", BUSINESS→"Firma", INSTITUTION→"Instytucja", AGENCY→"Agencja", RETURNING→"Powracający"

## Pliki do zmodyfikowania

### 10. `src/pages/admin/clients-list.tsx`
Zamiana placeholdera na `<ClientsPage />`

### 11. `src/pages/admin/settings.tsx`
Zamiana placeholdera na stronę z Tabs: "Konta" (jedyny tab na MVP), renderujący `<AccountsPage />`

### 12. `src/App.tsx`
Dodanie importu i routingu dla nowej strony usług:
- `<Route path="services" element={<ServicesPage />} />`

### 13. `src/components/layout/admin-layout.tsx`
Dodanie wpisu nawigacji "Usługi" w sidebar (ikona `Wrench` lub `HandCoins`, url: `/admin/services`)

## Szczegóły techniczne
- Enums z bazy: `service_type` (STAFF/EQUIPMENT/LOGISTICS), `price_type` (PER_HOUR/PER_EVENT/PER_PIECE/PER_PERSON), `client_type` (PRIVATE/BUSINESS/INSTITUTION/AGENCY/RETURNING)
- Liczba ofert klienta: `supabase.from('offers').select('client_id').then(...)` → count per client_id w JS
- Edge function `list-users`: `verify_jwt = true`, sprawdza czy caller jest authenticated
- Reset hasła: `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`
- Brak zmian w schemacie bazy danych — wszystkie tabele i enumy już istnieją

