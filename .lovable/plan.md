

# Sekcja Kalkulacja na stronie publicznej oferty

## Zakres
Nowy komponent `CalculationSection` renderowany na `/offer/:publicToken` między usługami a footerem. Wyświetla podsumowanie finansowe wg `price_display_mode`, z animowanymi cenami (count-up), edytowalną liczbą osób i guardrailem cenowym.

## Pliki do utworzenia

### 1. `src/components/public/animated-price.tsx`
Komponent `AnimatedPrice`:
- Props: `value: number`, `className?: string`
- `useInView(ref, { once: true })` z framer-motion
- requestAnimationFrame count-up od 0 do value (1000ms)
- `formatCurrency()` do wyświetlania
- `AnimatePresence` wrapper na zmianę wartości: stara znika (opacity 0, y: -10), nowa wchodzi (y: 10 → 0)
- Flash kolor: zielony jeśli wartość wzrosła, czerwony jeśli spadła (300ms)

### 2. `src/components/public/calculation-section.tsx`
Komponent `CalculationSection`:
- Props: `offer` (PublicOffer) — potrzebne: `offer_variants`, `offer_services`, `pricing_mode`, `people_count`, `price_display_mode`, `discount_percent`, `discount_value`, `delivery_cost`, `is_people_count_editable`, `min_offer_price`
- Stan lokalny: `peopleCount` (inicjalizowany z `offer.people_count`)
- Reuse `calculateOfferTotals()` z `src/lib/calculations.ts` — wymaga adaptacji typów (PublicOffer variants vs VariantWithItems)
- Adapter: mapuj `offer.offer_variants` na format kompatybilny z `calculateOfferTotals`

Sekcje wg `price_display_mode`:
- **HIDDEN**: elegancki komunikat "Cena do ustalenia indywidualnie"
- **TOTAL_ONLY**: tylko `AnimatedPrice` z grandTotal
- **PER_PERSON_ONLY**: tylko cena/os per wariant
- **PER_PERSON_AND_TOTAL**: cena/os + łączna kwota
- **DETAILED**: pełna tabela per wariant (danie, ilość, cena, suma) + usługi + rabat + dostawa + total

Edytowalna liczba osób (`is_people_count_editable`):
- Stylowe +/- przyciski, wartość na środku
- Scale animation (1.1 → 1.0) na zmianę
- Debounce 300ms, potem przeliczenie z animated price update
- Guardrail: jeśli nowy total < `min_offer_price` → toast shake, przywróć poprzednią wartość

Podsumowanie:
- Tło `--theme-primary` z opacity 5-10%
- Grand total: `font-display text-3xl md:text-5xl font-bold`
- Cena/os: mniejsza, opacity 70%
- Separator: gradient linia `--theme-primary → transparent`
- Stagger animations na całej sekcji

## Pliki do zmodyfikowania

### 3. `src/lib/calculations.ts`
- Dodaj generyczny helper `getItemPriceGeneric(item)` który działa zarówno z `VariantItemWithDish` jak i z typami z PublicOffer (oba mają `custom_price` i `dishes` z cenami)
- Lub: komponent sam mapuje dane przed wywołaniem `calculateOfferTotals`

### 4. `src/pages/public/offer.tsx`
- Import i render `CalculationSection` po `ServicesSection` (linia 403)
- Props: przekaż cały `offer`

## Szczegóły techniczne
- `calculateOfferTotals` oczekuje `VariantWithItems[]` i `OfferServiceWithService[]` — typy z hooków adminowych. PublicOffer ma kompatybilną strukturę ale inne typy TS. Rozwiązanie: type assertion lub adapter function w `CalculationSection`.
- `getItemPrice` z `use-offer-variants.ts` działa z `VariantItemWithDish` — PublicOffer dishes mają te same pola, więc cast zadziała.
- Brak zmian w bazie danych.

