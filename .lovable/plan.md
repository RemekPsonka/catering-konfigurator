

# Kompaktowe kafelki dań w sekcji Menu

## Pliki do zmiany

### 1. `src/components/public/dish-card.tsx`

**Karta dania (linia 103)**:
- `rounded-2xl p-4` → `rounded-xl p-2.5`

**Masonry gallery (linia 112)**:
- `mb-3 max-h-[200px]` → `mb-2 max-h-[140px]`

**Flex row (linia 122)**:
- `gap-4` → `gap-3`

**Miniaturka (linia 126)**:
- `h-20 w-20 ... rounded-xl md:h-[120px] md:w-[120px]` → `h-16 w-16 ... rounded-lg md:h-[72px] md:w-[72px]`

**Edit panel container (linia 265)**:
- `rounded-b-2xl` → `rounded-b-xl`

### 2. `src/components/public/menu-variants-section.tsx`

Sekcja jest już kompaktowa z poprzednich zmian — `gap-2` między daniami i `mb-4` między kategoriami są OK. Bez zmian.

## Efekt
Karta dania zmniejszy się z ~152px do ~90-100px. Miniaturka 72x72 zamiast 120x120. Galeria max 140px zamiast 200px. Cały layout menu skróci się o ~30%.

