

# Masonry Photo Album w DishCard

## Zakres
Zainstalować `react-photo-album`, zamienić pojedynczą miniaturkę w `DishCard` na masonry grid gdy danie ma >1 zdjęcie. Klik na zdjęcie → otwiera istniejący `DishLightbox` z odpowiednim indeksem.

## Pliki do zmodyfikowania

### 1. Instalacja
```bash
npm install react-photo-album
```

### 2. `src/components/public/dish-card.tsx`
- Import `MasonryPhotoAlbum` z `react-photo-album` + CSS `react-photo-album/masonry.css`
- Gdy `photos.length > 1`: zamiast pojedynczego `<motion.img>` w 80×80/120×120 kontenerze → renderuj `MasonryPhotoAlbum` z columns={2} (lub 3 na desktop) w szerszym kontenerze
- Gdy `photos.length <= 1`: zachowaj obecny wygląd (pojedyncza miniaturka)
- `onClick` na zdjęciu w masonry → `setLightboxOpen(true)` + `setLightboxIndex(photoIndex)`
- Przekaż `index={lightboxIndex}` do `DishLightbox`
- Dodaj state `lightboxIndex` (default 0)
- Photos array: mapuj `dish_photos` na format `{ src, width, height }` (react-photo-album wymaga width/height — użyj domyślnych 4:3 np. 400×300, lub 1:1 300×300)

### Layout zmiana
- Obecna miniaturka: 80×80 mobile, 120×120 desktop (kwadrat po lewej)
- Z masonry (>1 zdjęcie): kontener rozciąga się na pełną szerokość karty NAD treścią (zamiast obok), height max ~200px
- Alternatywnie: zachowaj layout side-by-side ale poszerz kontener zdjęć do ~200px z masonry 2-kolumnowym

## Brak zmian w bazie danych

