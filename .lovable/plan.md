

# Naprawa dwóch bugów na stronie publicznej

## BUG 1: Kolumna "Łącznie" = 0,00 zł

### Analiza
W `calculation-section.tsx` linia 328 tabelka używa `<AnimatedPrice value={vt.grandTotal}>`. Komponent `AnimatedPrice` inicjalizuje `displayed = 0` i animuje count-up dopiero po `useInView`. Problem: jeśli animacja nie wystartuje poprawnie (race condition z `isInView`, `hasAnimated`, `key={value}`), wyświetla `formatCurrency(0)` = "0,00 zł".

Kolumna "Cena/os." (linia 326) używa zwykłego `formatCurrency(vt.pricePerPerson)` — dlatego działa poprawnie.

### Naprawa w `src/components/public/calculation-section.tsx`
- Linia 34: dodać fallback `useState(people_count ?? 1)` — zabezpieczenie przed null
- Linia 328: zamienić `<AnimatedPrice value={vt.grandTotal}>` na zwykłe `<span>{formatCurrency(vt.grandTotal)}</span>` — identycznie jak kolumna "Cena/os.", bez animacji count-up, zawsze poprawna wartość
- Opcjonalnie zachować AnimatedPrice w sekcji grand total na dole (linia 304) — tam jest tylko 1 wariant i działa

## BUG 2: Galeria zdjęć obcięta

### Analiza
W `dish-card.tsx` linia 112: kontener `max-h-[220px] overflow-hidden` + MasonryPhotoAlbum renderuje 421px → dolna połowa obcięta.

### Naprawa w `src/components/public/dish-card.tsx`
- Usunąć import `MasonryPhotoAlbum` i `react-photo-album/masonry.css`
- Zamienić blok masonry (linie 111-128) na prostą karuzelę:
  ```
  <div className="mb-2 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-2 px-2">
    {allPhotos.map((photo, i) => (
      <img
        key={i}
        src={photo.src}
        onClick={() => handlePhotoClick(i)}
        className="h-[180px] w-auto rounded-lg snap-center shrink-0 cursor-pointer"
        loading="lazy"
      />
    ))}
  </div>
  ```
- Usunąć `masonryPhotos` (linie 85-89) — niepotrzebne
- Zachować lightbox (kliknięcie → `handlePhotoClick`)

## Pliki do zmiany
1. `src/components/public/calculation-section.tsx` — 2 zmiany (fallback + usunięcie AnimatedPrice z tabelki)
2. `src/components/public/dish-card.tsx` — zamiana masonry na karuzelę

