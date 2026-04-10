

# Bugfix: Zapis liczby gości do bazy po zmianie na stronie publicznej

## Plik do zmiany

### `src/components/public/calculation-section.tsx`

**1. Dodać import supabase (linia 8):**
```typescript
import { supabase } from '@/integrations/supabase/client';
```

**2. Zamienić useEffect (linie 69-84) na wersję z zapisem do bazy:**

Logika:
- Jeśli brak `min_offer_price` — zapisz każdą zmianę (gdy `is_people_count_editable` i `debouncedCount !== people_count`)
- Jeśli jest `min_offer_price` — zapisz tylko po walidacji (gdy total >= min)
- Zapis: `supabase.from('offers').update({ people_count }).eq('id', offer.id)`
- Warunek `is_people_count_editable` opakowuje oba zapisy

```typescript
useEffect(() => {
  if (!is_people_count_editable || debouncedCount === people_count || debouncedCount < 1) return;

  const persistCount = () => {
    supabase
      .from('offers')
      .update({ people_count: debouncedCount })
      .eq('id', offer.id)
      .then(({ error }) => {
        if (error) console.error('Failed to save people count:', error);
      });
  };

  if (!min_offer_price || min_offer_price <= 0) {
    prevValidCount.current = debouncedCount;
    persistCount();
    return;
  }

  if (debouncedCount === prevValidCount.current) return;

  const checkTotals = calculateOfferTotals(...);

  if (checkTotals.grandTotal < min_offer_price) {
    toast.error('...');
    setLocalPeopleCount(prevValidCount.current ?? people_count ?? 1);
  } else {
    prevValidCount.current = debouncedCount;
    persistCount();
  }
}, [debouncedCount, ...deps, is_people_count_editable, people_count, offer.id]);
```

## Efekt
- Zmiana liczby gości na stronie publicznej zapisuje się do bazy
- Po odświeżeniu strony — nowa wartość się zachowuje
- Zapis tylko gdy `is_people_count_editable === true`
- Walidacja `min_offer_price` nadal działa

