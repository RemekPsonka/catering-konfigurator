

# Zarządzanie kategoriami dań — /admin/dishes/categories

## Zakres
Pełna strona CRUD dla kategorii dań z tabelą, modalnymi formularzami, toggle aktywności i drag & drop sortowaniem.

## Pliki do utworzenia

### 1. `src/hooks/use-dish-categories.ts`
Custom hook z React Query do obsługi kategorii:
- `useQuery` — pobieranie listy kategorii z liczbą powiązanych dań (LEFT JOIN na dishes, GROUP BY)
- `useCreateCategory` — INSERT z walidacją unikalności kodu
- `useUpdateCategory` — UPDATE po id
- `useUpdateCategoryOrder` — batch UPDATE sort_order po drag & drop
- Wszystkie mutacje z `onSuccess` → invalidate query + toast sukcesu, `onError` → toast błędu

### 2. `src/components/features/dishes/category-dialog.tsx`
Modal (shadcn Dialog) do dodawania/edycji kategorii:
- Pola: nazwa (wymagana), kod (auto-gen z nazwy: uppercase + underscory, edytowalny), ikona (emoji input), opis (textarea), aktywna (Switch)
- React Hook Form + Zod walidacja
- Tryb "add" vs "edit" (pre-fill danych)

### 3. `src/pages/admin/dish-categories.tsx`
Strona z:
- Nagłówek "Kategorie dań" + przycisk "Dodaj kategorię"
- Tabela shadcn: Ikona | Nazwa | Kod | Liczba dań | Aktywna (Switch toggle) | Akcje (Edytuj button)
- Drag & drop na wierszach tabeli (użyję `@dnd-kit/core` + `@dnd-kit/sortable`) do zmiany kolejności
- Loading spinner, empty state
- CategoryDialog otwierany dla add/edit

### 4. Zmiany w istniejących plikach
- **`src/App.tsx`**: dodać route `dishes/categories` → `DishCategoriesPage`
- **`src/components/layout/admin-layout.tsx`**: opcjonalnie dodać sub-link "Kategorie" w nawigacji (lub dostęp z poziomu Baza potraw)

## Zależności
- Zainstalować `@dnd-kit/core` i `@dnd-kit/sortable` dla drag & drop

## Szczegóły techniczne
- Liczba dań: query `SELECT dc.*, COUNT(d.id) as dish_count FROM dish_categories dc LEFT JOIN dishes d ON d.category_id = dc.id AND d.is_active = true GROUP BY dc.id ORDER BY dc.sort_order`
- Auto-generowanie kodu: `name.trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')`
- Drag & drop: po zakończeniu przeciągania — batch update sort_order dla wszystkich zmienionych pozycji
- Toggle aktywności: bezpośredni UPDATE `is_active` z tabeli (bez otwierania modala)

