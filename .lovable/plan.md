

# Premium Performance Audit — wyniki i plan napraw

## Wyniki audytu

### 1. prefers-reduced-motion
- **CSS animations**: ✅ `index.css` wyłącza `animation-duration` i `transition-duration` via `!important`
- **Framer Motion**: ❌ **FAIL** — brak `MotionConfig reducedMotion="user"` na poziomie app. Framer Motion ignoruje CSS `prefers-reduced-motion` — wymaga własnej konfiguracji. Wszystkie `motion.div`, `AnimatePresence`, `useScroll`, `useTransform` nadal animują na urządzeniach z włączoną preferencją.

### 2. Lazy loading zdjęć
- `dish-card.tsx`: ✅ ma `loading="lazy"` na `<motion.img>`
- Lightbox: ✅ ładuje on-demand (otwierany kliknięciem)
- Hero/offer page: ❌ brak lazy loading na zdjęciach w sekcji hero (jeśli są)
- Dish edit panel (swap alternatives): ❌ brak `loading="lazy"` na miniaturkach alternatyw

### 3. Bundle size — framer-motion w admin
- **Admin pages**: `proposal-diff.tsx` importuje `motion, AnimatePresence` z framer-motion
- **Admin features**: ✅ żaden komponent w `src/components/features/` nie importuje framer-motion
- **Wniosek**: framer-motion trafia do bundla admin przez `proposal-diff.tsx`. Vite code-splits po route, więc wpływ jest ograniczony do tego jednego route'a — ale lepiej zastąpić CSS transitions.

### 4. Lighthouse / Performance
- Wymaga ręcznego testu w przeglądarce, ale znalezione problemy wpływające na wynik:
  - Brak `MotionConfig` = zbędne animacje na słabych urządzeniach
  - Framer-motion w admin bundle (minor)

## Plan napraw

### 1. `src/App.tsx` — dodaj MotionConfig
Owij całą aplikację w `<MotionConfig reducedMotion="user">`. To sprawi, że framer-motion automatycznie wyłączy animacje gdy użytkownik ma `prefers-reduced-motion: reduce`.

```tsx
import { MotionConfig } from 'framer-motion';
// W renderze:
<MotionConfig reducedMotion="user">
  {/* existing app tree */}
</MotionConfig>
```

### 2. `src/pages/admin/proposal-diff.tsx` — usuń framer-motion
Zastąp `motion.tr` zwykłym `<tr>` z CSS transition classes. Flash animację zrób via `className` toggle z `transition-colors duration-300`. Badge status: CSS `animate-scale-in`. To usunie import framer-motion z admin bundla.

### 3. `src/components/public/dish-edit-panel.tsx` — lazy loading na miniaturkach swap
Dodaj `loading="lazy"` do `<img>` w SwapPanel (miniaturki alternatywnych dań).

### 4. `src/components/common/smooth-scroll.tsx` — respect reduced motion
Dodaj check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` — jeśli true, nie inicjalizuj Lenis.

### Brak zmian w bazie danych

