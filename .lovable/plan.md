

# Naprawy krytyczne — obliczenia, null safety, type safety

## Pliki do zmiany

### 1. `src/lib/calculations.ts` — 4 zmiany

**Zmiana 1a: Quantity validation (linia 45)**
```
const qty = item.quantity ?? 1;
→ const qty = Math.max(0, Number(item.quantity) || 1);
```

**Zmiana 1b: Null-safe services.price (linia 64)**
```
os.services.price
→ (os.services?.price ?? 0)
```

**Zmiana 1c: Clamp variant discount + ujemna ochrona (linie 72-79)**
Po obliczeniu `variantDiscount` (linia 77), dodać:
```typescript
variantDiscount = Math.min(variantDiscount, total);
```
Linia 79:
```typescript
const variantGrandTotal = Math.max(0, total - variantDiscount) + servicesTotalCalc + deliveryCost;
```

**Zmiana 1d: Clamp global discount + ujemna ochrona (linie 97-104)**
Po obliczeniu `discountAmount` (linia 102), dodać:
```typescript
discountAmount = Math.min(discountAmount, maxDishesTotal);
```
Linia 104:
```typescript
const dishesAfterDiscount = Math.max(0, maxDishesTotal - discountAmount);
```

### 2. `src/components/features/offers/steps/variant-items-table.tsx` — 1 zmiana

**Linia 60:** `item.dishes.modifiable_items` → `item.dishes?.modifiable_items`

### 3. `src/components/public/calculation-section.tsx` — 2 zmiany

**Linie 38-39:** Dodać fallback `?? []`:
```typescript
const variants = (offer_variants ?? []) as unknown as VariantWithItems[];
const services = (offer_services ?? []) as unknown as OfferServiceWithService[];
```

**Po linii 39:** Dodać early return:
```typescript
if (!offer_variants || offer_variants.length === 0) return null;
```

### 4. `src/components/public/menu-variants-section.tsx` — 1 zmiana

**Linia 27-39:** Dodać filtr null dishes + optional chaining:
```typescript
const groupByCategory = (items: Variant['variant_items']) => {
  const validItems = items.filter(item => item.dishes != null);
  const groups = new Map<string, { name: string; icon: string | null; items: typeof items }>();
  for (const item of validItems) {
    const cat = item.dishes?.dish_categories;
    // reszta bez zmian
  }
  return Array.from(groups.values());
};
```

## Efekt
- Kwoty nigdy ujemne (rabat ograniczony do wartości dań)
- Brak crash przy null dishes / null services
- Bezpieczne castowanie z fallback na puste tablice

