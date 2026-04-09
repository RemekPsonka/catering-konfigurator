

# Modul zarządzania daniami — lista + formularz

## Zakres
Zamiana placeholder stron `dishes-list`, `dish-new`, `dish-edit` na pełne implementacje: lista dań z filtrami/paginacją oraz formularz tworzenia/edycji dania w sekcjach.

## Pliki do utworzenia

### 1. `src/hooks/use-dishes.ts`
Hook React Query do obsługi dań:
- `useDishes(filters)` — lista z paginacją (20/stronę), filtrami (category_id, is_active, search debounced, diet_tags), JOIN na `dish_categories` dla nazwy kategorii
- `useDish(id)` — pojedyncze danie do edycji
- `useCreateDish` — INSERT, toast sukcesu z linkiem do edycji
- `useUpdateDish` — UPDATE po id, toast sukcesu
- Typ `DishWithCategory` rozszerzający `Tables<'dishes'>` o `category_name` i `category_icon`

### 2. `src/components/features/dishes/dish-filters.tsx`
Komponent filtrów nad tabelą:
- Tabs lub Select z kategoriami (z `useDishCategories`, opcja "Wszystkie")
- Toggle status: Aktywne / Wszystkie
- Input wyszukiwania z debounce 300ms (custom `useDebounce` hook lub inline)
- Multi-select chips dla tagów dietetycznych

### 3. `src/components/features/dishes/dish-form.tsx`
Formularz podzielony na 5 sekcji w Card:
- **Sekcja 1 — Podstawowe**: name, display_name, description_short (counter 200), description_sales (counter 500), category_id (Select z kategoriami), subcategory
- **Sekcja 2 — Cena i wycena**: unit_type (RadioGroup: PERSON/PIECE/KG/SET), dynamiczny label ceny, min_order_quantity, portion_weight_g, serves_people
- **Sekcja 3 — Tagi**: 4 grupy multi-select chips (diet_tags, event_tags, season_tags, serving_style) + alergeny — toggle chips z predefiniowanymi wartościami
- **Sekcja 4 — Wewnętrzne**: cost_per_unit, margin_percent, auto-kalkulacja wyświetlana jako read-only
- **Sekcja 5 — Status**: is_active Switch, is_modifiable Switch
- React Hook Form + Zod, tryb create/edit
- 3 przyciski: "Zapisz", "Zapisz i dodaj kolejne", "Anuluj"

### 4. `src/components/features/dishes/tag-chips-field.tsx`
Reużywalny komponent multi-select chips — tablica predefiniowanych opcji, toggle on/off, integracja z React Hook Form.

### 5. `src/lib/dish-constants.ts`
Stałe dla tagów (polskie etykiety):
- `DIET_TAGS`, `EVENT_TAGS`, `SEASON_TAGS`, `SERVING_STYLES`, `ALLERGENS`
- `UNIT_TYPE_LABELS`: PERSON→"Na osobę", PIECE→"Za sztukę", KG→"Za kg", SET→"Za zestaw"
- `UNIT_TYPE_PRICE_LABELS`: PERSON→"Cena/osobę", etc.

## Pliki do zmodyfikowania

### 6. `src/pages/admin/dishes-list.tsx`
Pełna strona zamiast placeholdera:
- Nagłówek "Baza potraw" + "Dodaj danie" (link do /admin/dishes/new)
- DishFilters + Table (miniaturka, nazwa, kategoria, unit_type label, cena wg unit_type, 🔄 ikona jeśli is_modifiable, StatusBadge, przycisk Edytuj)
- Klik w wiersz → navigate do /admin/dishes/:id/edit
- Paginacja shadcn Pagination (20/stronę)

### 7. `src/pages/admin/dish-new.tsx`
Nagłówek "Nowe danie" + DishForm w trybie create. Po zapisie → navigate do /admin/dishes lub toast z linkiem.

### 8. `src/pages/admin/dish-edit.tsx`
Pobiera danie po `useParams().id`, loader/error state, DishForm w trybie edit z pre-filled danymi. Po zapisie → toast sukcesu.

## Szczegoly techniczne

- Cena wyswietlana w tabeli: `price_per_person ?? price_per_piece ?? price_per_kg ?? price_per_set` zaleznie od `unit_type`
- Formularz dynamicznie pokazuje jedno pole ceny na podstawie wybranego `unit_type`
- Auto-kalkulacja marzy: jesli podano cost_per_unit i margin_percent, wyswietl `cost * (1 + margin/100)` jako "Cena katalogowa"
- Debounce search: `useState` + `useEffect` z `setTimeout` 300ms
- Paginacja: query `.range(from, to)` w Supabase, zliczanie `.count()` dla total

