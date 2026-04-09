

# Sekcja zamienników (modifiable_items) w formularzu dania

## Zakres
Dodanie sekcji konfiguracji zamienników widocznej gdy `is_modifiable = true`. Trzy typy modyfikacji (SWAP, VARIANT, SPLIT) z podglądem klienckim. Dane zapisywane jako JSONB w `dishes.modifiable_items`.

## Pliki do utworzenia

### 1. `src/components/features/dishes/modifiable-items-section.tsx`
Główny komponent sekcji, renderowany warunkowo gdy `is_modifiable` jest ON:

- **RadioGroup** z 3 typami: SWAP / VARIANT / SPLIT
- **Panel SWAP**: autocomplete input (Command/Popover z dań z bazy, szukanie po nazwie, debounce), lista wybranych alternatyw z chipami i X do usunięcia. Dane: `{type: "swap", alternatives: [{dish_id, label}]}`
- **Panel VARIANT**: dynamiczna lista wierszy `[nazwa] + [modyfikator ceny ±zł] + [usuń]`, przycisk "Dodaj wariant". Dane: `{type: "variant", options: [{label, price_modifier}]}`
- **Panel SPLIT**: autocomplete jak SWAP + pole "Min. % podziału" (number, default 25). Dane: `{type: "split", can_split_with: [{dish_id, label}], min_split_percent: 25}`
- **Podgląd kliencki**: pod konfiguracją, symulacja UI (SWAP → dropdown, VARIANT → radio buttons z ceną, SPLIT → slider z etykietami)

Komponent przyjmuje `value: Record<string, unknown> | null` i `onChange: (val) => void` — integracja z React Hook Form.

### 2. `src/components/features/dishes/dish-autocomplete.tsx`
Reużywalny autocomplete do wyszukiwania dań:
- Popover + Command (shadcn) z debounced search
- Query do `dishes` tabeli (name, display_name, id) z `.ilike`
- Wykluczenie aktualnie edytowanego dania (`excludeId`)
- Emituje `onSelect(dish: {dish_id, label})`

## Pliki do zmodyfikowania

### 3. `src/components/features/dishes/dish-form.tsx`
- Dodać pole `modifiable_items` do `dishSchema` (z.any().nullable().optional())
- Dodać do `defaultValues`: parsowanie `dish.modifiable_items`
- Dodać do `buildPayload`: `modifiable_items: values.modifiable_items`
- Wstawić nową sekcję Card "Modyfikacje dostępne" po sekcji Status (po `is_modifiable` toggle), renderowaną warunkowo: `{isModifiable && <ModifiableItemsSection ... />}`
- Watch `is_modifiable` — gdy wyłączone, sekcja znika (dane zachowane w formie)

## Szczegoly techniczne
- Autocomplete: `supabase.from('dishes').select('id, display_name').ilike('display_name', `%${search}%`).eq('is_active', true).limit(10)`
- Podgląd SWAP: Select dropdown z alternatywami
- Podgląd VARIANT: RadioGroup z opcjami i ceną (+X zł / -X zł)
- Podgląd SPLIT: Slider 0-100% z etykietami dwóch dań
- Brak zmian w bazie danych — `modifiable_items` JSONB już istnieje w tabeli `dishes`

