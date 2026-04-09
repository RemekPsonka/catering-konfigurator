

# Uzupełnienie klas premium w Tailwind + Global CSS

## Zakres
Dodanie brakujących kolorów, fontów i cieni do `tailwind.config.ts` oraz stylów premium do `index.css`. Żadnych zmian w panelu admin.

## Zmiany

### 1. `tailwind.config.ts`
Dodaj w `extend`:
- `colors`: `cream`, `ivory`, `charcoal`, `warmGray`
- `fontFamily`: `display` (theme header font → Playfair Display fallback), `body` (theme font → Inter fallback)
- `boxShadow`: `premium`, `premium-hover`, `glow`

### 2. `src/index.css`
Dodaj na końcu pliku (poza `@layer`):
- `html { scroll-behavior: smooth; }`
- `@media (prefers-reduced-motion: reduce)` — wyłączenie animacji
- `::selection` — kolor zaznaczenia z motywu

### Brak innych zmian
Żadne pliki admin nie są modyfikowane.

