

# Usunięcie podwójnego wyboru wariantu

## Co się zmieni

1. **`src/pages/public/offer.tsx`** — usuń `VariantComparisonSection` (linie 571-580) i jego import
2. **`src/components/public/menu-variants-section.tsx`** — wzbogać `VariantCard` o liczbę pozycji, liczbę do personalizacji i dynamiczną cenę/os.

## Szczegóły techniczne

### `offer.tsx`
- Usuń import `VariantComparisonSection`
- Usuń blok linii 571-580 (sekcja "Twoje warianty menu")

### `menu-variants-section.tsx` — VariantCard (linie 216-270)
Obecna karta pokazuje: nazwę, badge "Polecany", opis, "do personalizacji", cenę z DB.

Nowa karta — kompaktowa, jednowierszowa informacja:
- **Nazwa** · **badge Polecany** (jeśli is_recommended)
- Wiersz info: `{itemCount} pozycji` · `{editableCount} do personalizacji` · `{cena}/os.`
- Usuń opis (variant.description) — niepotrzebny przy tabach
- Cenę obliczać dynamicznie przez `calculateVariantDishesTotal` (import z calculations.ts) zamiast czytać `price_per_person` z DB (które może być 0)
- Zmniejszyć padding: `p-4` → `p-3`

Format w tabie: `Classic · 3 pozycji · 2 do personalizacji · 147,00 zł/os.`

### Pliki bez zmian
- `variant-comparison-section.tsx` — zostaje w repo, ale nie jest już importowany (dead code do późniejszego usunięcia)

