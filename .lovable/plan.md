

## Plan: Naprawa systemu cenowego wariantów dań [CS-032b]

### Diagnoza problemu

**Root cause potwierdzona w danych:**

```
variant_items: custom_price = 0.00, selected_variant_option = "Medium rare"
dishes: price_per_person = 65.00
```

Pole `custom_price` pełni **podwójną rolę**: zamrożona cena bazowa dania + cena po zmianie wariantu. Gdy wariant ma `price_modifier = 0` (np. "Medium rare" bez dopłaty), a `custom_price` było `null` przed propozycją, system oblicza:

```
originalPrice = variantItem.custom_price ?? 0  → 0 (bo null)
proposedPrice = 0 + price_modifier(0) = 0
```

Po zaakceptowaniu propozycji: `custom_price = 0` → cena dania znika.

### Rozwiązanie: Rozdzielenie ceny bazowej od modyfikatora

Dodaj kolumnę `variant_price_modifier` do `variant_items`. Dzięki temu:

- `custom_price` = zamrożona cena bazowa dania (ustawiana przy dodawaniu do oferty, NIGDY nadpisywana przez warianty)
- `variant_price_modifier` = dodatkowa kwota za wybrany wariant (+10 zł za roladę, 0 zł za "medium rare", -5 zł za tańszą opcję)
- Efektywna cena = `custom_price + (variant_price_modifier ?? 0)`

### Zmiany

**1. Migracja bazy danych**

```sql
ALTER TABLE variant_items ADD COLUMN variant_price_modifier numeric DEFAULT NULL;
```

Napraw istniejące dane — przywróć cenę polędwicy:
```sql
UPDATE variant_items SET custom_price = 65.00, variant_price_modifier = 0
WHERE id = 'd76398c8-20c5-4640-8650-9d1c298a6e6b';
```

**2. `src/hooks/use-offer-variants.ts` — `getItemPrice`**

Zmiana z:
```ts
return item.custom_price != null ? Number(item.custom_price) : getDishPrice(item.dishes);
```
Na:
```ts
const base = item.custom_price != null ? Number(item.custom_price) : getDishPrice(item.dishes);
return base + (Number(item.variant_price_modifier) || 0);
```

**3. `src/components/features/offers/steps/manager-modification-dialog.tsx` — `handleApply`**

Zmiana — przy wyborze wariantu NIE nadpisuj `custom_price`, ustaw `variant_price_modifier`:
```ts
applyMutation.mutate({
  selected_variant_option: opt.label,
  variant_price_modifier: opt.price_modifier,  // NOWA kolumna
  // NIE zmieniaj custom_price!
});
```

**4. `src/hooks/use-proposal-diff.ts` — akceptacja propozycji VARIANT_CHANGE**

Zmiana z `updateData.custom_price = item.proposed_price` na:
```ts
// Oblicz modifier: proposed_price - original_price
updateData.variant_price_modifier = (item.proposed_price ?? 0) - (item.original_price ?? 0);
// NIE zmieniaj custom_price
```

**5. `src/hooks/use-public-offer.ts` — tworzenie propozycji**

Poprawka `originalPrice` — czytaj cenę bazową z dania, nie z custom_price:
```ts
const dishPrice = getDishPriceFromUnit(variantItem?.dishes);
const originalPrice = variantItem?.custom_price ?? dishPrice ?? 0;
```

**6. `src/components/public/dish-card.tsx` — wyświetlanie ceny**

Zmiana logiki `effectivePrice`:
```ts
const basePrice = item.custom_price != null ? Number(item.custom_price) : getPrice(dish);
const variantMod = Number(item.variant_price_modifier) || 0;
let effectivePrice = basePrice + variantMod;
// Modyfikacje klienta (tymczasowe) — dodatkowe, NIE nadpisują
if (modification?.type === 'swap') effectivePrice = basePrice + (modification.swapPriceDiff ?? 0);
else if (modification?.type === 'variant') effectivePrice = basePrice + (modification.variantPriceModifier ?? 0);
```

**7. `src/components/public/calculation-section.tsx` — adjustedVariants**

Analogiczna poprawka — uwzględnij `variant_price_modifier` w bazowej cenie przed aplikowaniem tymczasowych modyfikacji klienta.

**8. `src/components/features/offers/steps/calculation/VariantsPanel.tsx` — wyświetlanie w wizardzie**

Upewnij się że `getItemPrice` (zmienione w punkcie 2) jest używane — powinno działać automatycznie.

### Scenariusze po zmianie

| Przypadek | custom_price | variant_price_modifier | Efektywna cena |
|---|---|---|---|
| Polędwica dodana do oferty | 65.00 | null | 65.00 |
| Medium rare (bez dopłaty) | 65.00 | 0 | 65.00 ✅ |
| Z sosem pieprzowym (+8 zł) | 65.00 | 8 | 73.00 ✅ |
| Zamiana na kotleta (swap) | *nowy dish_id* | null | cena kotleta |
| Tańsza opcja (-5 zł) | 65.00 | -5 | 60.00 ✅ |

### Pliki modyfikowane
1. Migracja: nowa kolumna `variant_price_modifier` + naprawa danych
2. `src/hooks/use-offer-variants.ts` — `getItemPrice`
3. `src/components/features/offers/steps/manager-modification-dialog.tsx`
4. `src/hooks/use-proposal-diff.ts`
5. `src/hooks/use-public-offer.ts`
6. `src/components/public/dish-card.tsx`
7. `src/components/public/calculation-section.tsx`

### Nie ruszam
- `src/lib/calculations.ts` (korzysta z `getItemPrice` — zmiana propaguje automatycznie)
- `dish-form.tsx`, `modifiable-items-section.tsx` (konfiguracja zamienników — bez zmian)
- `changes-panel.tsx` (panel zmian klienta)

