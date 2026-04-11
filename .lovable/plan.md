

## Plan: Aplikowanie zaakceptowanego SPLIT do variant_items [CS-037c]

### Problem
W `useResolveProposal` (`use-proposal-diff.ts`) brakuje obsługi `change_type === 'SPLIT'`. Po zaakceptowaniu propozycji podziału przez managera nic się nie dzieje — `variant_items` nie jest aktualizowane, klient nie widzi zmiany.

### Rozwiązanie: Dodanie kolumn split do variant_items + obsługa w logice aplikowania

SPLIT to podział ilości jednego dania na dwa (np. 100% rosołu → 60% rosołu + 40% pomidorowej). Aby to wyświetlać po akceptacji, potrzebujemy zapisać informację o podziale na pozycji w `variant_items`.

**Podejście**: Dodaj 3 kolumny do `variant_items`:
- `split_parent_id` (uuid, FK do variant_items) — wskazuje na pozycję-rodzica (oryginalne danie)
- `split_percent` (numeric) — procent ilości dla tej pozycji (np. 60 dla oryginału, 40 dla nowego dania)

Przy akceptacji SPLIT:
1. Zaktualizuj oryginalną pozycję: ustaw `split_percent = percent` (np. 60)
2. Wstaw nową pozycję `variant_items` z `dish_id = splitDishId`, `split_parent_id = originalItemId`, `split_percent = 100 - percent` (np. 40), skopiuj `custom_price` z dania, `sort_order` = oryginał + 1

Na stronie klienta: pozycje z `split_parent_id` wyświetlane jako powiązana grupa.

### Zmiany

**1. Migracja bazy danych**
```sql
ALTER TABLE variant_items 
  ADD COLUMN split_parent_id uuid REFERENCES variant_items(id) ON DELETE SET NULL,
  ADD COLUMN split_percent numeric DEFAULT NULL;
```

**2. `src/hooks/use-proposal-diff.ts` — dodaj case SPLIT w sekcji aplikowania**

Po bloku `QUANTITY_CHANGE` (linia ~187), dodaj:
```ts
} else if (item.change_type === 'SPLIT') {
  const splitData = item.split_details as { percent: number; splitDishId: string; splitDishName: string } | null;
  if (splitData) {
    // 1. Update original: set split_percent
    updateData.split_percent = splitData.percent;
    
    // 2. Fetch split dish price
    const { data: splitDish } = await supabase
      .from('dishes')
      .select('price_per_person, price_per_piece, price_per_kg, price_per_set, unit_type')
      .eq('id', splitData.splitDishId)
      .single();
    
    // 3. Insert new variant_item for split dish
    const originalItem = await supabase
      .from('variant_items')
      .select('variant_id, sort_order, quantity')
      .eq('id', item.variant_item_id)
      .single();
    
    if (originalItem.data) {
      await supabase.from('variant_items').insert({
        variant_id: originalItem.data.variant_id,
        dish_id: splitData.splitDishId,
        custom_name: splitData.splitDishName,
        custom_price: splitDish ? getDishPriceFromUnit(splitDish) : item.proposed_price,
        split_parent_id: item.variant_item_id,
        split_percent: 100 - splitData.percent,
        sort_order: (originalItem.data.sort_order ?? 0) + 1,
        quantity: originalItem.data.quantity,
      });
    }
  }
}
```

**3. `src/components/public/dish-card.tsx` — wyświetlanie split_percent**

Gdy `item.split_percent` jest ustawiony, pokaż badge z procentem (np. "60%") obok nazwy dania. Pozycje-dzieci (`split_parent_id != null`) wyświetlane z ikoną łączenia.

**4. `src/components/public/menu-variants-section.tsx` — grupowanie pozycji split**

Pozycje z `split_parent_id` wyświetlane tuż po rodzicu, z wizualnym wcięciem i łącznikiem "+" wskazującym podział.

**5. `src/lib/calculations.ts` — uwzględnienie split_percent w kalkulacji**

Jeśli `split_percent` jest ustawione, mnóż ilość przez `split_percent / 100`:
```ts
const qty = (item.quantity ?? 1) * ((item.split_percent ?? 100) / 100);
```

### Pliki modyfikowane
1. Migracja: nowe kolumny `split_parent_id`, `split_percent` w `variant_items`
2. `src/hooks/use-proposal-diff.ts` — case SPLIT w aplikowaniu
3. `src/components/public/dish-card.tsx` — badge z procentem
4. `src/components/public/menu-variants-section.tsx` — grupowanie split
5. `src/lib/calculations.ts` — kalkulacja z uwzględnieniem procentów
6. `src/hooks/use-offer-variants.ts` — typ `VariantItemWithDish` rozszerzony o nowe kolumny

### Nie ruszam
- `changes-panel.tsx`, `use-public-offer.ts` (odczyt danych)
- `dish-edit-panel.tsx` (konfiguracja split — działa poprawnie)
- `use-admin-pending-proposals.ts` (już obsłużone w CS-037b)

