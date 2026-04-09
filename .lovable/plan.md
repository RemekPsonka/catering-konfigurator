

# Instalacja bibliotek premium UI i konfiguracja globalna

## Zakres
Instalacja 3 nowych bibliotek (framer-motion, lenis, yet-another-react-lightbox), konfiguracja smooth scroll na PublicLayout, reusable animation variants, rozszerzenie Tailwind o klasy premium.

Uwaga: `embla-carousel-react` już jest zainstalowane (v8.6.0).

## Zmiany

### 1. Instalacja npm
```
framer-motion lenis yet-another-react-lightbox
```

### 2. Nowy plik: `src/components/common/smooth-scroll.tsx`
Komponent `SmoothScroll` z Lenis — dokładnie jak w specyfikacji użytkownika.

### 3. Nowy plik: `src/lib/animations.ts`
6 reusable framer-motion variants: `fadeInUp`, `fadeIn`, `staggerContainer`, `scaleIn`, `slideInLeft`, `slideInRight` — dokładnie jak w specyfikacji.

### 4. `src/components/layout/public-layout.tsx`
Owij `<Outlet />` w `<SmoothScroll>`.

### 5. `tailwind.config.ts`
Rozszerzenie `extend` o:
- Dodatkowe keyframes: `float`, `shimmer`, `glow`
- Animacje: `float`, `shimmer`, `glow`
- Backdrop blur i box shadow premium (jeśli użytkownik chce konkretne — dodam standardowe glassmorphism utilities)

## Brak zmian w bazie danych

