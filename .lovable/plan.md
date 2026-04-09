

# Audyt Spójności — Faza 3: Panel Klienta PREMIUM

## Wyniki audytu

### BIBLIOTEKI
- ✅ framer-motion v12.38.0 — zainstalowany, używany w dish-card, menu-variants, offer page
- ✅ lenis v1.3.21 — zainstalowany, SmoothScroll w PublicLayout
- ✅ yet-another-react-lightbox v3.30.1 — zainstalowany, DishLightbox komponent
- ✅ embla-carousel-react v8.6.0 — zainstalowany, używany w MenuVariantsSection
- ✅ src/lib/animations.ts — fadeInUp, fadeIn, staggerContainer, scaleIn, slideInLeft, slideInRight

### STRONA OFERTY — LAYOUT
- ✅ /offer/:publicToken działa bez logowania (PublicLayout, brak AuthGuard)
- ✅ Hero z parallax (useScroll + useTransform heroY)
- ✅ SmoothScroll (Lenis) w PublicLayout
- ✅ Sekcje z fadeInUp/whileInView animations
- ✅ Stagger animation na listach dań (staggerChildren: 0.08)
- ✅ Motyw graficzny: CSS custom properties z offer_themes
- ⚠️ **FAIL**: Brak testu 3 motywów (KOM/FIR/GRI) — wymaga danych w DB, nie kodu
- ✅ Wygasły link → elegancka strona z Clock icon + fade-in
- ✅ Nieistniejący token → 404 z FileX2 icon

### WARIANTY I DANIA
- ✅ Warianty: Embla carousel na mobile, grid na desktop
- ✅ AnimatePresence: zmiana wariantu z fade+slide
- ✅ Zdjęcia dań: miniaturki z hover zoom (whileHover scale 1.05) + DishLightbox (zoom, fullscreen)
- ✅ Placeholder bez zdjęcia: gradient z UtensilsCrossed icon
- ✅ Badge "Polecany" z pulse animation (scale [1, 1.1, 1])
- ✅ Ikona RefreshCw (🔄) na edytowalnych pozycjach z rotate 180 on hover

### KALKULACJA
- ✅ AnimatedPrice z count-up od 0 (requestAnimationFrame + easeOutCubic)
- ✅ Zmiana ceny: flash color (green up, red down) + AnimatePresence
- ✅ 5 trybów cenowych obsłużonych (HIDDEN, DETAILED, PER_PERSON_AND_TOTAL, TOTAL_ONLY, PER_PERSON_ONLY)
- ✅ People_count: +/- buttons z animacją
- ✅ Guardrail: toast.error + przywrócenie poprzedniej wartości

### INTERAKTYWNA EDYCJA
- ✅ SWAP: karty alternatyw z klik → animowana zamiana (AnimatePresence w DishCard)
- ✅ VARIANT: pill buttons z transition
- ✅ SPLIT: Slider z realtime preview
- ✅ Zmienione pozycje: tinted background (color-mix 5%) + badge "Zmieniono" (scaleIn)

### PROPOZYCJE
- ✅ ChangesPanel — floating, AnimatePresence slide-up
- ⚠️ **FAIL**: Brak rozróżnienia mobile (bottom sheet) vs desktop (sticky) — komponent jest zawsze fixed bottom
- ✅ Lista zmian ze stagger
- ✅ "Wyślij propozycję" → success animation (confetti CSS)
- ✅ Auto-save draft co 5s (useEffect z intervalem)

### AKCEPTACJA
- ✅ Radio-card wybór wariantu z shadow-glow (AnimatePresence)
- ✅ Duży przycisk "Akceptuję" z whileHover/whileTap
- ✅ Confirmation dialog z backdrop-blur
- ✅ Success: animated checkmark div

### WARUNKI + KOREKTY
- ✅ Warunki w accordion z framer-motion height transition
- ✅ Textarea korekty → zapis do offer_corrections
- ✅ Kontakt: telefon/email/IG z hover effect (y: -4)

### AI
- ✅ AI tekst powitalny — Edge Function generate-greeting + przycisk w step-calculation
- ✅ AI podsumowanie — Edge Function generate-summary + przycisk w step-calculation
- ✅ Wyniki edytowalne (Textarea z debounced auto-save)

### PERFORMANCE
- ✅ prefers-reduced-motion: animacje wyłączone (index.css)
- ✅ Zdjęcia: brak explicit lazy loading attr, ale lightbox ładuje on-demand
- ⚠️ **FAIL**: Brak `loading="lazy"` na `<img>` w DishCard — wszystkie zdjęcia ładują się od razu

### ZNALEZIONE PROBLEMY DO NAPRAWY

1. **DishCard img brak lazy loading** — `<motion.img>` w dish-card.tsx nie ma `loading="lazy"`. Przy dużych ofertach (30+ dań) wszystkie zdjęcia ładują się naraz.
   - Naprawa: dodaj `loading="lazy"` do `<motion.img>` w dish-card.tsx (linia 107)

2. **ChangesPanel brak responsywności mobile/desktop** — Panel jest zawsze fixed bottom. Brak bottom sheet na mobile (80vh slide-up) vs sticky sidebar na desktop.
   - Naprawa: dodaj `useIsMobile()` i na mobile: klik "Masz N zmian" → rozwija panel do 80vh. Na desktop: sticky card bottom-8.

3. **Embla carousel onSelect nie działa poprawnie** — w menu-variants-section.tsx linia 54 używa `useState(() => { ... })` zamiast `useEffect` do rejestracji callbacka Embla. To jest antywzorzec — callback nie zostanie zarejestrowany po mount/update emblaApi.
   - Naprawa: zamień na `useEffect(() => { if (emblaApi) { emblaApi.on('select', onSelect); return () => { emblaApi.off('select', onSelect); }; } }, [emblaApi, onSelect]);`

## Plan napraw

### 1. `src/components/public/dish-card.tsx`
- Dodaj `loading="lazy"` do `<motion.img>` (linia 107)

### 2. `src/components/public/menu-variants-section.tsx`
- Zamień `useState(() => ...)` na `useEffect` do rejestracji embla callback

### 3. `src/components/public/changes-panel.tsx`
- Dodaj `useIsMobile()` import
- Mobile: collapsed bar "Masz N zmian" → klik rozwija do max-h-[80vh] z AnimatePresence
- Desktop: bez zmian (obecny layout ok)

### Brak zmian w bazie danych

