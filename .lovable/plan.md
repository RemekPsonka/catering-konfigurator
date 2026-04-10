
# Naprawa kalkulacji w panelu "Moje zmiany"

## Zmiany w `src/components/public/changes-panel.tsx`

### 1. Wyciągnięcie danych do przeliczenia
- `offer.pricing_mode` → decyduje czy "os." czy "szt."
- `offer.people_count` → mnożnik
- Dla każdej pozycji: pobrać `quantity` z `variant_items` (potrzebne w FIXED_QUANTITY)

### 2. Każda pozycja na liście zmian — rozbudowa wyświetlania
Obecny format: `Tarta cytrynowa z bezą  +4,00 zł`

Nowy format:
- Jeśli `priceDiff !== 0` i tryb `PER_PERSON`: `+4,00 zł/os. × 90 os. = +360,00 zł`
- Jeśli `priceDiff !== 0` i tryb `FIXED_QUANTITY`: `+4,00 zł/szt. × 5 szt. = +20,00 zł`
- Jeśli `priceDiff === 0`: `+0,00 zł/os.` (bez mnożenia)

Logika: oblicz `unitDiff` (swapPriceDiff lub variantPriceModifier), `multiplier` (people_count w PER_PERSON, quantity w FIXED_QUANTITY), `totalDiff = unitDiff × multiplier`.

### 3. Wiersz "Łączny wpływ" — dodanie kontekstu
Obecny: `Łączny wpływ:`
Nowy: `Łączny wpływ na cenę (przy {people_count} os.):` (lub "szt." w FIXED_QUANTITY)

### 4. Obliczanie multiplier per item
- W `changesList` map: dodać `quantity` z `vi.quantity`
- W PER_PERSON: multiplier = `offer.people_count`
- W FIXED_QUANTITY: multiplier = `vi.quantity`

## Plik do zmiany
- `src/components/public/changes-panel.tsx`

## Bez zmian
- Logika submitowania propozycji
- Style i animacje
- Panel admina
