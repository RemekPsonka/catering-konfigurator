

# Naprawy utrzymywalności — duplikacje, stałe, debounce

## Pliki do zmiany

### 1. `src/pages/admin/offer-messages.tsx` — usunięcie `formatPLN`
- Usunąć linie 100-101 (`const formatPLN = ...`)
- Dodać `import { formatCurrency } from '@/lib/calculations';`
- Zamienić 3 wystąpienia `formatPLN(` na `formatCurrency(`

### 2. `src/pages/admin/proposal-diff.tsx` — usunięcie `formatPLN`
- Usunąć linie 46-47 (`const formatPLN = ...`)
- Dodać `import { formatCurrency } from '@/lib/calculations';`
- Zamienić 4 wystąpienia `formatPLN(` na `formatCurrency(`

### 3. Nowy plik `src/lib/app-limits.ts`
Centralne stałe:
```typescript
export const MAX_DISH_PHOTOS = 5;
export const MAX_EVENT_PHOTOS = 15;
export const MAX_PHOTO_SIZE_MB = 10;
export const DEBOUNCE_SAVE_MS = 800;
export const DEBOUNCE_SEARCH_MS = 300;
export const GREETING_WORD_LIMIT = 40;
export const SEARCH_COOLDOWN_MS = 3000;
```

### 4. Aktualizacja importów stałych
- `src/hooks/use-event-profiles.ts`: `MAX_PHOTOS` → `MAX_EVENT_PHOTOS` z app-limits
- `src/pages/public/offer.tsx`: `GREETING_WORD_LIMIT = 40` → import z app-limits

### 5. `src/components/features/offers/steps/step-calculation.tsx` — konsolidacja debounce
Zamienić 4 osobne `useDebounce` + 4 `useEffect` (linie 117-140) na jeden połączony obiekt:
```typescript
const textFields = useMemo(() => ({
  greeting_text: greetingText || null,
  ai_summary: aiSummary || null,
  notes_client: notesClient || null,
  notes_internal: notesInternal || null,
}), [greetingText, aiSummary, notesClient, notesInternal]);

const debouncedTextFields = useDebounce(textFields, 800);
const prevTextRef = useRef(debouncedTextFields);

useEffect(() => {
  if (!loaded || !offerId) return;
  if (prevTextRef.current === debouncedTextFields) return;
  prevTextRef.current = debouncedTextFields;
  saveMutation.mutate(debouncedTextFields);
}, [debouncedTextFields]);
```

### 6. `src/hooks/use-event-profiles.ts` — optymalizacja zapytania
Zamienić dwa zapytania (profiles + all photos) na jedno z `select('*, event_type_photos(count)')`, usunąć drugie query i `countMap`.

## Nie zmieniam
- `ITEMS_PER_PAGE` w `constants.ts` — re-export dodałby łamania importów bez zysku
- `dish-photos-section.tsx` — tam limit 5 jest w hooku `use-dish-photos.ts`, nie w tym pliku bezpośrednio

## Efekt
- 2 duplikacje `formatPLN` usunięte
- Magic numbers scentralizowane
- 4 requesty debounce → 1 request
- 2 zapytania SQL → 1 zapytanie (event profiles)

