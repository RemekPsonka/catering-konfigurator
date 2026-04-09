

# Interaktywna edycja dań na stronie publicznej oferty

## Zakres
Rozbudowa `DishCard` o rozwijany panel edycji zamienników (SWAP/VARIANT/SPLIT) z premium animacjami. Zmiany tymczasowe w React state, przeliczenie kalkulacji live. Stan zmian zarządzany przez `MenuVariantsSection` i przekazywany do `CalculationSection`.

## Architektura stanu

Nowy typ `DishModification` przechowujący tymczasowe zmiany klienta. Stan `Map<variantItemId, DishModification>` trzymany w `MenuVariantsSection` i przekazywany w górę do strony oferty (lift state to `PublicOfferPage`), skąd trafia też do `CalculationSection` do przeliczenia cen.

```text
PublicOfferPage
├── modifications: Map<string, DishModification>   ← state
├── MenuVariantsSection  ← edycja dań, onChange
└── CalculationSection   ← odczyt modifications do przeliczenia
```

## Pliki do utworzenia

### 1. `src/components/public/dish-edit-panel.tsx`
Panel edycji rozwijany pod `DishCard` gdy `is_client_editable` i kliknięto ikonę 🔄.

Trzy warianty UI zależne od `modifications.type`:

**SWAP**: Horizontalny scroll kart alternatyw. Per karta: miniaturka + nazwa + badge z różnicą ceny. Aktywna: border `--theme-primary`, `shadow-glow`. Klik: `AnimatePresence` — fade + scale transition.

**VARIANT**: Pill buttons w rzędzie. Aktywna: bg `--theme-primary`, text white. Transition 0.2s.

**SPLIT**: Custom slider (Radix Slider z custom styling — gradient track, themed thumb). Pod sliderem: dwa dania z procentami aktualizowanymi real-time.

Props: `item`, `modifications` (JSONB parsed), `currentValue`, `onChange`, `pricingMode`, `peopleCount`.

AnimatePresence wrapper: `initial={{ height: 0, opacity: 0 }}`, `animate={{ height: 'auto', opacity: 1 }}`, `exit={{ height: 0, opacity: 0 }}`, duration 0.3.

## Pliki do zmodyfikowania

### 2. `src/components/public/dish-card.tsx`
- Dodaj props: `isExpanded`, `onToggleExpand`, `modification`, `onModificationChange`
- Ikona 🔄: `motion.span whileHover={{ rotate: 180 }}` + tooltip + onClick → `onToggleExpand`
- Pod kartą: `AnimatePresence` → `DishEditPanel` gdy `isExpanded`
- Zmienione danie: lekkie tło `--theme-primary` opacity 5%, badge "Zmieniono" z `scaleIn`, przycisk "Cofnij" (X)
- Gdy SWAP aktywny: podmień wyświetlaną nazwę, zdjęcie i cenę z animacją

### 3. `src/components/public/menu-variants-section.tsx`
- Przyjmij props: `modifications`, `onModificationChange`
- Trzymaj stan `expandedItemId` (tylko jeden panel otwarty naraz)
- Przekaż do `DishCard`: `isExpanded`, `onToggleExpand`, `modification`, `onModificationChange`

### 4. `src/pages/public/offer.tsx`
- Dodaj `useState<Map<string, DishModification>>` na poziomie strony
- Przekaż `modifications` + `onModificationChange` do `MenuVariantsSection`
- Przekaż `modifications` do `CalculationSection`

### 5. `src/components/public/calculation-section.tsx`
- Przyjmij opcjonalny `modifications` prop
- Przed wywołaniem `calculateOfferTotals`: podmień ceny w variant_items zgodnie z modifications (SWAP → cena alternatywy, VARIANT → price_modifier, SPLIT → proporcjonalny podział)

## Typy (w `dish-edit-panel.tsx` lub osobny plik)

```typescript
interface DishModification {
  type: 'swap' | 'variant' | 'split';
  // SWAP: which alternative dish was picked
  swapDishId?: string;
  swapDishName?: string;
  swapDishPhoto?: string;
  swapPriceDiff?: number;
  // VARIANT: which option index
  variantOptionIndex?: number;
  variantPriceModifier?: number;
  // SPLIT: percentage for original dish (rest goes to split dish)
  splitPercent?: number;
  splitDishId?: string;
  splitDishName?: string;
}
```

## Szczegóły techniczne
- Dane zamienników: `item.allowed_modifications ?? item.dishes.modifiable_items` (JSONB, parsed as `{ type, alternatives/options/can_split_with }`)
- Public query już pobiera `dishes(*, dish_photos(*))` — wystarczy dla miniaturek alternatyw SWAP
- SWAP alternatywy to `{ dish_id, label }` — nazwa jest w JSONB, ale zdjęcie trzeba pobrać osobno lub wyświetlić placeholder
- Guardrail cenowy: po każdej zmianie `CalculationSection` sprawdza `min_offer_price` — jeśli przekroczony, toast + revert
- Brak zmian w bazie danych — zmiany są tymczasowe w React state, zapis w P-3.5 (propozycje zmian)

