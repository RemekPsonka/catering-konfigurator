

# Naprawa zdjęć dań w karuzeli — oryginalne proporcje

## Plik do zmiany

### `src/components/public/dish-card.tsx`

**Linia 112 — kontener galerii masonry:**
- `mb-2 max-h-[140px] overflow-hidden rounded-xl cursor-pointer`
- → `mb-2 max-h-[220px] rounded-xl cursor-pointer bg-neutral-50`
- Usunięty `overflow-hidden` ze sztywnym przycinaniem, dodane `bg-neutral-50` jako tło

**MasonryPhotoAlbum (linie 113-118):**
- Masonry album z react-photo-album sam zarządza layoutem — kluczowe jest poluzowanie kontenera. Obrazki wewnątrz masonry powinny mieć `object-contain` zamiast domyślnego `object-cover`.
- Sprawdzić czy `MasonryPhotoAlbum` przyjmuje `renderPhoto` prop do customowego renderowania `<img>` z `object-contain`, `rounded-lg`, `bg-neutral-50`, `max-h-[200px]`, `w-auto h-auto`.
- Jeśli tak — dodać `renderPhoto` z tymi stylami.
- Jeśli nie — nadpisać przez CSS (klasa na kontenerze + `[&_img]` selector).

**Miniaturki 72x72 (linia 143) — BEZ ZMIAN:**
- `object-cover` zostaje — to kwadratowe miniaturki.

## Efekt
Zdjęcia w galerii zachowują oryginalne proporcje, nie są rozciągane ani przycinane. Miniaturki bez zmian.

