

# Krok 2 wizarda — Warianty i dania

## Zakres
Implementacja kroku 2 kreatora ofert: zarządzanie wariantami (Classic/Premium/De Luxe), dodawanie dań z autocomplete, konfiguracja ilości/cen/zamienników, live kalkulacja, drag & drop sortowanie.

## Pliki do utworzenia

### 1. `src/hooks/use-offer-variants.ts`
Hook React Query do CRUD wariantów i pozycji:
- `useOfferVariants(offerId)` — query `offer_variants` + `variant_items` z joinem na `dishes` (display_name, photo_url, unit_type, prices, is_modifiable, modifiable_items) dla danego offerId
- `useCreateVariant()` — INSERT do `offer_variants` (name, offer_id, sort_order)
- `useUpdateVariant()` — UPDATE nazwy, opisu, is_recommended
- `useDeleteVariant()` — DELETE wariantu (i kaskadowo variant_items)
- `useAddVariantItem()` — INSERT do `variant_items` (variant_id, dish_id, quantity=1, sort_order)
- `useUpdateVariantItem()` — UPDATE quantity, custom_price, is_client_editable, allowed_modifications, sort_order
- `useRemoveVariantItem()` — DELETE z variant_items
- `useDuplicateVariant()` — kopiuje wariant z pozycjami do nowego
- `useReorderVariantItems()` — batch UPDATE sort_order

### 2. `src/components/features/offers/steps/step-menu.tsx`
Główny komponent kroku 2:
- **Tabs** na górze: warianty (max 3) + przycisk [+ Dodaj wariant]
- Nazwy tabów edytowalne (klik → inline input)
- Per tab: checkbox "Polecany" (is_recommended, max 1 — wyłącz inne przy zaznaczeniu)
- Przycisk "Duplikuj wariant" w nagłówku taba
- Renderuje `VariantItemsTable` per wariant
- **Live kalkulacja** na dole: 
  - PER_PERSON: `Σ cen × ilości = X/osobę × N osób = TOTAL zł`
  - FIXED_QUANTITY: `Σ (cena × ilość) = TOTAL zł`
- Wymaga `offerId` — jeśli brak (nowa oferta), wymusza zapis szkicu przed wejściem na krok 2

### 3. `src/components/features/offers/steps/variant-items-table.tsx`
Tabela pozycji wariantu:
- Kolumny: [Drag] | Miniaturka | Nazwa | Cena | Ilość | Suma | Edytowalne? | Akcje
- Drag & drop sortowanie via `@dnd-kit`
- Per pozycja:
  - Ilość: inline number input (min 1)
  - Cena: wyświetla dish price, klik → input `custom_price` (nadpisanie)
  - Toggle `is_client_editable`
  - Jeśli edytowalne + dish.is_modifiable: badge "🔄 SWAP/VARIANT/SPLIT", przycisk "Edytuj zamienniki" → modal
  - Przycisk usuwania pozycji
- Przycisk "Dodaj dania" → otwiera `DishPickerSheet`

### 4. `src/components/features/offers/steps/dish-picker-sheet.tsx`
Sheet (panel boczny) do wyboru dań:
- Filtry: tabs z 14 kategorii (z `useDishCategories`), wyszukiwarka debounced
- Lista dań: miniaturka + nazwa + cena + unit_type
- Klik na danie → dodaje do aktywnego wariantu (quantity=1), toast potwierdzenia
- Wyklucza dania już dodane do wariantu (excludeIds)

### 5. `src/components/features/offers/steps/modification-override-dialog.tsx`
Dialog do nadpisania zamienników per offer:
- Ładuje `dishes.modifiable_items` jako bazę
- Manager może: dodać/usunąć zamienniki, zmienić typ modyfikacji
- Zapisuje do `variant_items.allowed_modifications` (JSONB override)
- UI wzorowany na `ModifiableItemsSection` ale uproszczony (bez podglądu klienta)

## Pliki do zmodyfikowania

### 6. `src/hooks/use-offer-wizard.ts`
- Dodać `offerId` do state po udanym zapisie szkicu (potrzebne dla kroku 2)
- Mutation `saveDraftMutation` → onSuccess ustawia `offerId` w state

### 7. `src/components/features/offers/offer-wizard.tsx`
- Import `StepMenu` i renderowanie w `case 2`
- Przekazanie `offerId` i `pricingMode` do `StepMenu`
- Przed wejściem na krok 2: jeśli brak offerId, auto-save draft

## Szczegóły techniczne
- Warianty query: `supabase.from('offer_variants').select('*, variant_items(*, dishes(id, display_name, photo_url, unit_type, price_per_person, price_per_piece, price_per_kg, price_per_set, is_modifiable, modifiable_items))').eq('offer_id', id).order('sort_order')`
- Cena pozycji: `custom_price ?? dish[price_field_for_unit_type]`
- Kalkulacja PER_PERSON: `Σ(item_price × quantity) × people_count`
- Kalkulacja FIXED_QUANTITY: `Σ(item_price × quantity)`
- Max 3 warianty — ukryj przycisk dodawania gdy osiągnięto limit
- Drag & drop: `@dnd-kit/core` + `@dnd-kit/sortable` (już zainstalowane)
- Brak zmian w bazie danych — tabele `offer_variants` i `variant_items` już istnieją

