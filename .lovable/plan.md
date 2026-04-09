

# Kreator oferty — Wizard 7 kroków (Krok 1: Dane podstawowe)

## Zakres
Zbudowanie szkieletu wizarda 7-krokowego z pełną implementacją Kroku 1 (Dane podstawowe). Kroki 2-7 jako placeholdery z nagłówkami. Strony `/admin/offers/new` i `/admin/offers/:id/edit` współdzielą ten sam komponent wizarda.

## Pliki do utworzenia

### 1. `src/components/features/offers/offer-wizard.tsx`
Główny komponent wizarda:
- Stepper na górze: 7 kroków (1. Dane | 2. Menu | 3. Usługi | 4. Ustawienia | 5. Kalkulacja | 6. Motyw | 7. Podgląd) — aktywny krok podświetlony, ukończone z checkmarkiem
- Stan wizarda w `useReducer` — obiekt `WizardState` przechowujący dane wszystkich kroków
- Nawigacja: "← Wstecz" / "Dalej →" z walidacją per krok
- W trybie edycji: ładuje dane oferty z Supabase i pre-filluje state
- Renderuje aktualny krok jako child komponent

### 2. `src/components/features/offers/wizard-stepper.tsx`
Komponent steppera:
- 7 kroków w rzędzie, ikony + tekst, połączone linią
- Stany: completed (zielony check), active (primary color), upcoming (szary)
- Responsywny: na mobile tylko ikony + numer kroku

### 3. `src/components/features/offers/steps/step-event-data.tsx`
Krok 1 — Dane podstawowe (React Hook Form + Zod):
- **Rodzaj imprezy**: Select z 12 typów + emoji (KOM 🙏 Komunia, WES 💒 Wesele, etc.)
- **Data wydarzenia**: DatePicker (shadcn Calendar w Popover, `pointer-events-auto`)
- **Godziny**: dwa Input type="time" (od-do)
- **Liczba osób**: Input number (min 1, wymagane)
- **Lokalizacja**: Input text
- **Forma dostawy**: RadioGroup (Zimna / Podgrzewana / Full service) → COLD/HEATED/FULL_SERVICE enum
- **Tryb kalkulacji**: RadioGroup z opisami — PER_PERSON vs FIXED_QUANTITY
- **Klient**: Client autocomplete (Combobox z query `clients` debounced) + przycisk "Dodaj nowego" → otwiera `ClientDialog` inline
- **Treść zapytania**: Textarea (opcjonalne)
- Auto-fill `greeting_text` po wyborze `event_type` (domyślne teksty per typ)
- Walidacja: event_type, client_id, people_count, delivery_type wymagane

### 4. `src/components/features/offers/client-autocomplete.tsx`
Autocomplete klienta (wzorowany na `DishAutocomplete`):
- Combobox z `Command` + `Popover`
- Szukaj po nazwie/email (debounce 300ms)
- Wyświetla: nazwa + email/firma
- Przycisk "Dodaj nowego klienta" na końcu listy → callback otwierający `ClientDialog`

### 5. `src/hooks/use-offer-wizard.ts`
Hook do zarządzania stanem wizarda:
- `useReducer` z akcjami: SET_STEP_DATA, SET_STEP, LOAD_OFFER
- `useOffer(id)` — query pojedynczej oferty z Supabase (do trybu edycji)
- `useSaveOffer` — mutation INSERT/UPDATE oferty (na Kroku 7 lub "Zapisz szkic" w dowolnym momencie)

### 6. `src/lib/offer-constants.ts`
Stałe wizarda:
- `EVENT_TYPE_OPTIONS`: tablica `{ value, label, emoji }` dla 12 typów
- `DELIVERY_TYPE_LABELS`: COLD→"Zimna dostawa", HEATED→"Podgrzewana", FULL_SERVICE→"Full service"
- `DEFAULT_GREETINGS`: Record<EventType, string> — domyślne teksty powitalne per typ eventu
- `PRICING_MODE_OPTIONS`: tablica z opisami dwóch trybów

### 7. `src/components/features/offers/steps/step-placeholder.tsx`
Placeholder dla kroków 2-7: Card z tytułem kroku i "W budowie"

## Pliki do zmodyfikowania

### 8. `src/pages/admin/offer-new.tsx`
Zamiana placeholdera na `<OfferWizard />` (tryb: create)

### 9. `src/pages/admin/offer-edit.tsx`
Zamiana placeholdera na `<OfferWizard offerId={id} />` (tryb: edit, ładuje dane z Supabase)

## Szczegóły techniczne
- Offers INSERT required fields: `client_id`, `created_by` (auth.uid()), `event_type`, `delivery_type`, `people_count`
- Greeting auto-fill: np. KOM → "Szanowni Państwo, z przyjemnością prezentujemy ofertę cateringową na Państwa komunię."
- Client autocomplete: `supabase.from('clients').select('id, name, email, company').or('name.ilike.%q%,email.ilike.%q%').limit(10)`
- Stepper klikable tylko dla ukończonych kroków (nie można przeskoczyć do przodu)
- Brak zmian w bazie danych

