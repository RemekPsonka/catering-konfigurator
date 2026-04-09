

# Sekcja Warianty Menu + Usługi na stronie publicznej oferty

## Zakres
Dwa nowe komponenty renderowane na `/offer/:publicToken` między sekcją AI Summary a Footerem: warianty menu z daniami (z lightboxem zdjęć, carousel na mobile, AnimatePresence) oraz usługi dodatkowe pogrupowane per typ.

## Pliki do utworzenia

### 1. `src/components/public/menu-variants-section.tsx`
Sekcja wariantów menu:
- Props: `variants` (z PublicOffer), `pricingMode`, `peopleCount`, `priceDisplayMode`
- Logika layoutu:
  - 1 wariant → bezpośrednio lista dań, bez tabów
  - 2-3 warianty:
    - Desktop: karty w rzędzie (`grid grid-cols-2` / `grid-cols-3`), klik przełącza `activeVariantId`
    - Mobile: Embla Carousel z dots indicator
- Karta wariantu: nazwa, opis, cena/os (jeśli tryb cenowy pozwala), badge "✨ Polecany" z pulse animation jeśli `is_recommended`
- Aktywny wariant: border `--theme-primary`, `shadow-glow`, `scale(1.02)`
- `AnimatePresence mode="wait"` na liście dań: exit `opacity: 0, x: -20`, enter `opacity: 0→1, x: 20→0`, duration 0.4
- Dania pogrupowane per `dish_categories.name` z emoji ikoną z `dish_categories.icon`
- Stagger: kategoria `fadeInUp`, dania `staggerChildren: 0.08`

### 2. `src/components/public/dish-card.tsx`
Karta dania:
- Zdjęcie po lewej (120×120 desktop, 80×80 mobile, rounded-xl)
  - Źródło: `dishes.photo_url` (primary)
  - Hover: `scale(1.05)` transition
  - Klik: otwiera lightbox
  - Placeholder bez zdjęcia: gradient `--theme-secondary` + ikona `UtensilsCrossed`
- Treść po prawej:
  - `custom_name ?? dish.display_name` — `font-display text-lg`
  - `description_sales` — `text-sm opacity-70 line-clamp-2`
  - Gramatura badge jeśli `portion_weight_g`
  - 🔄 ikona jeśli `is_client_editable`
  - Cena wg `priceDisplayMode` (HIDDEN = brak, DETAILED = pełna cena, itp.)
- Karta: `bg-ivory rounded-2xl p-4`, hover `shadow-premium-hover y: -2`

### 3. `src/components/public/dish-lightbox.tsx`
Wrapper na `yet-another-react-lightbox`:
- Props: `open`, `onClose`, `slides` (array of `{ src }`)
- Pluginy: Zoom, Fullscreen
- Custom CSS: ciemne tło, przyciski w `--theme-primary`

### 4. `src/components/public/services-section.tsx`
Sekcja usług dodatkowych:
- Props: `services` (z PublicOffer), `priceDisplayMode`
- Grupowanie per `services.type`: STAFF → "Obsługa", EQUIPMENT → "Sprzęt", LOGISTICS → "Logistyka"
- Kompaktowe karty: ikona + nazwa + opis
- Stagger animation `fadeInUp`

## Pliki do zmodyfikowania

### 5. `src/pages/public/offer.tsx`
- Import i render `MenuVariantsSection` i `ServicesSection` w miejscu komentarza placeholder (linia 383)
- Przekaż props: `offer.offer_variants`, `offer.pricing_mode`, `offer.people_count`, `offer.price_display_mode`, `offer.offer_services`

### 6. `src/hooks/use-public-offer.ts`
- Rozszerz select query o `dish_photos` na poziomie `dishes`: `dishes(*, dish_categories(*), dish_photos(*))` — potrzebne do lightboxa z wieloma zdjęciami
- Zaktualizuj typ `PublicOffer` o `dish_photos` w dishes

## Szczegóły techniczne
- Embla carousel: `embla-carousel-react` już zainstalowane (v8.6.0)
- Lightbox: `yet-another-react-lightbox` już zainstalowane
- Cena wyświetlana wg `price_display_mode`: HIDDEN → brak, DETAILED → cena jednostkowa + ilość + suma, PER_PERSON_AND_TOTAL / PER_PERSON_ONLY / TOTAL_ONLY → odpowiednio
- `getItemPrice()` z `use-offer-variants.ts` reuse do kalkulacji ceny pozycji
- Brak zmian w bazie danych

