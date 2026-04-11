

## Plan: Dodanie modelu bloków czasowych (PER_BLOCK) do usług

### Podsumowanie
Rozszerzenie systemu usług o nowy typ cenowy `PER_BLOCK` z degresywną stawką za kolejne bloki. Kolumny DB już istnieją (`block_duration_hours`, `block_unit_label`, `extra_block_price`, `extra_block_label`).

### Nowy helper — `src/lib/calculations.ts`

```ts
export const calculateBlockPrice = (
  price: number, extraPrice: number | null, quantity: number
): number => {
  if (quantity <= 0) return 0;
  return price + Math.max(0, quantity - 1) * (extraPrice ?? price);
};
```

Użyty w `calculateOfferTotals` — dla usług z `price_type === 'PER_BLOCK'` zamiast `price * qty` liczymy `calculateBlockPrice(price, extra_block_price, qty)`.

### Modyfikowane pliki (7)

**1. `src/lib/service-constants.ts`**
- Dodaj `PER_BLOCK: 'Za blok (np. 4h)'` do `PRICE_TYPE_LABELS`

**2. `src/components/features/services/service-dialog.tsx`**
- Dodaj `PER_BLOCK` do zod enum `price_type`
- Dodaj 4 pola warunkowe (widoczne gdy `price_type === 'PER_BLOCK'`):
  - `block_duration_hours` (number, min 1)
  - `block_unit_label` (string, np. "kelner")
  - `extra_block_price` (number, opcjonalne)
  - `extra_block_label` (string, opcjonalne)
- Reset wartości block_* w useEffect

**3. `src/lib/calculations.ts`**
- Dodaj `calculateBlockPrice()` helper (eksport)
- W `calculateOfferTotals` → `servicesTotalCalc`: dla `PER_BLOCK` użyj `calculateBlockPrice` zamiast `price * qty`
- Potrzebuje dostępu do `services.extra_block_price` — typ `OfferServiceWithService` już zawiera pełny `services` row

**4. `src/components/features/offers/steps/step-services.tsx` (wizard krok 3)**
- Dla `PER_BLOCK`: zmień label ilości na `"Liczba {block_unit_label || 'bloków'}"` 
- Pod ceną: pokaż info `"{block_duration_hours}h/blok, kolejny: {extra_block_price} zł"`
- W kalkulacji `total` na dole: użyj `calculateBlockPrice` dla PER_BLOCK

**5. `src/components/features/offers/steps/step-pricing.tsx` (wizard krok wycena)**
- Analogicznie jak step-services: w sekcji usług wyświetl czytelnie bloki
- Badge: `"Za blok ({block_duration_hours}h)"` zamiast ogólnego `PRICE_TYPE_LABELS`

**6. `src/components/public/services-logistics-section.tsx` (strona klienta)**
- Dla `PER_BLOCK`: zamiast `"{name} ×{qty}"` wyświetl:
  - `"{name} — {qty} × {block_unit_label} ({block_duration_hours}h)"`
- Opcjonalnie pod spodem: `"Pierwszy blok {price} zł, każdy kolejny {extra_block_price} zł"`
- Cena: `calculateBlockPrice(price, extra_block_price, qty)`

**7. `src/components/features/offers/steps/calculation/ServicesPanel.tsx`**
- Dla PER_BLOCK: badge `"blok {N}h"`, total = `calculateBlockPrice` zamiast `price * qty`

**8. `src/components/print/PrintServicesTable.tsx`**
- Dla PER_BLOCK: w kolumnie "Ilość" wyświetl `"{qty} × {block_unit_label}"`, total = `calculateBlockPrice`

### Backward compatibility
- Istniejące usługi PER_HOUR/PER_EVENT/PER_PIECE/PER_PERSON nie są dotknięte
- `calculateBlockPrice` wywoływany tylko gdy `price_type === 'PER_BLOCK'`
- Pola `block_*` nullable — brak wartości = fallback do standardowej kalkulacji

### Brak zmian DB
Kolumny i enum już istnieją w SQL.

