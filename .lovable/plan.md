

# Onboarding klienta + Porównanie wariantów

## Nowe pliki

### 1. `src/components/public/onboarding-overlay.tsx`
Overlay wyświetlany przy pierwszym otwarciu oferty (`viewed_at === null` w momencie renderowania).

- 3 kroki wizualne (ikony + tekst) w karcie max-w-lg, rounded-2xl, shadow-premium
- Backdrop blur 10px, overlay 30% opacity, fadeIn animation
- "Rozumiem, pokaż ofertę" → zamknij + `sessionStorage.setItem('onboarding_seen', '1')`
- "Nie pokazuj ponownie" → zamknij bez animacji
- Warunek wyświetlenia: `!sessionStorage.getItem('onboarding_seen')` AND `offer.viewed_at === null` (sprawdzane przed `markViewed`)
- Dynamiczny tekst z liczbą wariantów i edytowalnych pozycji

### 2. `src/components/public/editable-tooltip.tsx`
Pulsujący tooltip przy pierwszym edytowalnym daniu.

- Wyświetlany po zamknięciu onboardingu, jeśli `!sessionStorage.getItem('edit_tooltip_seen')`
- Pozycjonowany przy pierwszym `DishCard` z `isEditable=true`
- Znika po 8s lub po kliknięciu 🔄 (ustawia flag w sessionStorage)
- Styl: --theme-primary tło, tekst ivory, arrow pointing down, pulse animation

### 3. `src/components/public/variant-comparison-section.tsx`
Sekcja "Porównaj warianty" — renderowana tylko gdy `variants.length >= 2`.

**Karty obok siebie (desktop grid) / karuzela Embla (mobile):**
- Nazwa wariantu + badge "Polecany" (pulse animation) jeśli `is_recommended`
- Statystyki: liczba pozycji, liczba edytowalnych
- Top 5 dań (najdroższe z kategorii główne/desery) z miniaturką
- Cena wg `price_display_mode`
- Przycisk "Wybierz [nazwa]" → scroll do `AcceptanceSection` + pre-select variant (callback prop)
- Karta polecanego: border 2px --theme-primary

**Tabela różnic (rozwijana):**
- Przycisk "Pokaż szczegółowe różnice" → toggle Collapsible
- Wiersze = kategorie dań, kolumny = warianty
- Dania różniące się → highlight --theme-primary/10
- Dania wspólne → szary tekst, brak → "—"
- Mobile: overflow-x-auto + sticky first column

## Modyfikowane pliki

### 4. `src/pages/public/offer.tsx`
- Import `OnboardingOverlay`, `VariantComparisonSection`
- State: `isFirstVisit` = `!offer.viewed_at` (przed markViewed)
- State: `onboardingDismissed` — po zamknięciu overlay uruchom tooltip
- Dodać `OnboardingOverlay` jako overlay na całej stronie (warunkowo)
- Dodać `VariantComparisonSection` między sekcją kalkulacji (10) a testimonialem (11), przed akceptacją
- Prop `onSelectVariant` do `AcceptanceSection` — pre-select wariantu z comparison
- Dodać `preSelectedVariantId` state, przekazać do `AcceptanceSection`

### 5. `src/components/public/acceptance-section.tsx`
- Dodać prop `preSelectedVariantId?: string` — jeśli podany, ustawić jako `selectedVariantId` initial state
- `useEffect` reagujący na zmianę `preSelectedVariantId`

### 6. `src/components/public/menu-variants-section.tsx`
- Pod nazwą wariantu (w `VariantCard`) dodać badge "[X] pozycji do personalizacji" jeśli wariant ma edytowalne pozycje
- Styl: --theme-primary/10 tło, --theme-primary tekst, rounded-full, text-xs

## Brak zmian w bazie danych

Wszystko opiera się na istniejących danych (`viewed_at`, `is_client_editable`, `variant_items`, `is_recommended`). SessionStorage do flag onboardingu.

## Szczegóły techniczne

- `isFirstVisit` musi być obliczony PRZED wywołaniem `markViewed` (które ustawia `viewed_at`). Użyć `useRef` do zapamiętania initial state.
- Tooltip: `useEffect` z `setTimeout(8000)` + cleanup
- Comparison: `useMemo` do obliczenia top 5 dań i tabeli różnic per kategoria
- Scroll do akceptacji: `document.getElementById('acceptance-section')?.scrollIntoView({ behavior: 'smooth' })`

