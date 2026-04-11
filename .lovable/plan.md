

## Plan: Wspólna Biblioteka Zdjęć — Migracja z event_type_photos na photo_library

### Obecny stan
- `event_type_photos` — zdjęcia przypisane 1:1 do profilu eventu (event_type_id)
- `photo_library` — tabela już istnieje w DB z polami: photo_url, caption, alt_text, width, height, content_tags[], event_tags[], hero_for_events[], sort_order, is_active
- Upload do bucketu `event-photos` (publiczny)
- Strona klienta pobiera zdjęcia z `usePublicEventPhotos(event_type)` → `event_type_photos`
- `OfferHeader` przyjmuje `heroPhoto: Tables<'event_type_photos'> | null`
- Profil eventu (`event-profile-edit.tsx`) ma sekcję galerii z upload/DnD/tagi/hero bezpośrednio do `event_type_photos`

### Zmiany

**1. Limity: `src/lib/app-limits.ts`**
- Zmień `MAX_EVENT_PHOTOS = 15` → dodaj `MIN_EVENT_PHOTOS = 4`, `MAX_LIBRARY_PHOTOS = 10` (per event_type)

**2. Nowy hook: `src/hooks/use-photo-library.ts`**
- `usePhotoLibrary(eventType?: string)` — bez filtra: all active, z filtrem: WHERE eventType = ANY(event_tags)
- `useHeroPhoto(eventType: string)` — WHERE eventType = ANY(hero_for_events) LIMIT 1
- `useUploadLibraryPhoto()` — upload do `event-photos/{uuid}.{ext}`, insert do `photo_library`
- `useUpdateLibraryPhoto()` — update caption, alt_text, event_tags, content_tags, hero_for_events
- `useDeleteLibraryPhoto()` — delete from Storage + DB
- `useEventPhotoStats()` — SELECT unnest(event_tags) as et, COUNT(*) GROUP BY et

**3. Nowa strona: `src/pages/admin/photos-library.tsx`**
- Toolbar: Select filtr event_type, checkboxy content_tags
- Dashboard tagów na górze: per event_type badge z liczbą (zielony 4-10, żółty 1-3, czerwony 0)
- Grid zdjęć: 4 kolumny desktop, 2 mobile. Per zdjęcie: miniaturka, caption, badge event_tags
- Hover: edit/delete/hero buttons
- Dialog edycji: caption, alt_text, checkboxy event_tags (14 typów), content_tags (12 typów), hero_for_events
- Upload: drag-drop zone, auto-detect dimensions
- Bulk select: zaznacz wiele → "Dodaj tag event_type" → zapisz

**4. Modyfikacja: `src/pages/admin/event-profile-edit.tsx`**
- Sekcja "Galeria zdjęć atmosfery": zastąp upload grid
- Read-only grid zdjęć z photo_library otagowanych tym event_type
- Badge: "6/10 zdjęć ✅" lub "2/10 ⚠️ Dodaj minimum 2 zdjęcia"
- Przycisk: "📸 Zarządzaj zdjęciami →" → navigate `/admin/photos?event=KOM`
- Hero: pokaż aktualne hero z photo_library
- Zachowaj starą sekcję jako fallback (Tabs: "Nowa biblioteka" / "Stary upload")

**5. Modyfikacja: `src/pages/public/offer.tsx`**
- Import `usePhotoLibrary`, `useHeroPhoto` z nowego hooka
- Zamień `usePublicEventPhotos(offer?.event_type)` → `usePhotoLibrary(offer?.event_type)`
- Zamień `heroPhoto` useMemo → `useHeroPhoto(offer?.event_type)`
- Fallback: jeśli photo_library pusty, użyj starego `usePublicEventPhotos`
- Mapuj `photo_library` rows na format zgodny z `EventGallerySection` (photo_url, width, height, caption, alt_text, is_hero=false)

**6. Modyfikacja: `src/components/features/public-offer/OfferHeader.tsx`**
- Zmień typ `heroPhoto` z `Tables<'event_type_photos'> | null` na `{ photo_url: string; alt_text?: string | null } | null` (kompatybilny z obiema tabelami)

**7. Modyfikacja: `src/components/public/event-gallery-section.tsx`**
- Zmień typ props na generyczny interface `{ photo_url: string; width?: number | null; height?: number | null; caption?: string | null; alt_text?: string | null; is_hero?: boolean }[]`

**8. Route: `src/App.tsx`**
- Dodaj route `/admin/photos` → `PhotosLibraryPage`

**9. Sidebar: `src/components/layout/admin-layout.tsx`**
- Dodaj `{ title: 'Zdjęcia', url: '/admin/photos', icon: Camera }` między "Usługi" a "Klienci"

### Nowe pliki
1. `src/hooks/use-photo-library.ts`
2. `src/pages/admin/photos-library.tsx`

### Modyfikowane pliki
1. `src/lib/app-limits.ts`
2. `src/pages/public/offer.tsx`
3. `src/components/features/public-offer/OfferHeader.tsx`
4. `src/components/public/event-gallery-section.tsx`
5. `src/pages/admin/event-profile-edit.tsx`
6. `src/App.tsx`
7. `src/components/layout/admin-layout.tsx`

### Nie ruszam
- Tabeli `event_type_photos` (backward compat)
- Hookow `use-event-profiles.ts` (stare hooki zostają do fallbacku)
- Edge Functions, tracking, wizarda ofert
- Bucketu Storage (reużywam `event-photos`)

### Brak migracji SQL
- Tabela `photo_library` już istnieje z prawidłową strukturą i RLS

