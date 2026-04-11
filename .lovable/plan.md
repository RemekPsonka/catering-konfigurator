

## Plan: Napraw znikające oferty — disambiguacja FK `variant_items` [CS-037c-fix]

### Diagnoza

Migracja CS-037c dodała kolumnę `split_parent_id uuid REFERENCES variant_items(id)` — self-referential FK. PostgREST widzi teraz **dwie** relacje między `offer_variants` a `variant_items` (przez `variant_id` i przez `split_parent_id`) i zwraca błąd 300 (Multiple Choices) lub pusty wynik. Dlatego wszystkie zapytania z `variant_items(...)` jako embed przestały działać — oferty "zniknęły".

### Rozwiązanie

Dodać explicit FK hint `variant_items!variant_items_variant_id_fkey(...)` we wszystkich zapytaniach PostgREST, które embeddują `variant_items` z `offer_variants`.

### Pliki do zmiany (5 plików, 1 linia w każdym)

1. **`src/hooks/use-offer-variants.ts`** linia 47
   - `variant_items(` → `variant_items!variant_items_variant_id_fkey(`

2. **`src/hooks/use-public-offer.ts`** linia 36
   - `variant_items(` → `variant_items!variant_items_variant_id_fkey(`

3. **`src/hooks/use-offer-templates.ts`** linia 91
   - `variant_items(*)` → `variant_items!variant_items_variant_id_fkey(*)`

4. **`src/components/features/offers/steps/step-preview-send.tsx`** linia 126
   - `variant_items(` → `variant_items!variant_items_variant_id_fkey(`

5. **`src/components/features/offers/steps/step-preview.tsx`** linia 81
   - `variant_items(` → `variant_items!variant_items_variant_id_fkey(`

### Nie ruszam
- Migracji (kolumny `split_parent_id`/`split_percent` są poprawne)
- Zapytań bezpośrednich do `variant_items` (bez embed — nie mają problemu)
- RLS policies
