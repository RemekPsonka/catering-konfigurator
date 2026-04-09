

# Ulepszenie panelu profili eventów — tagi zdjęć, filtry, szczegóły UI

## Co już istnieje
Strona listy (`event-profiles-list.tsx`), edycji (`event-profile-edit.tsx`), hook (`use-event-profiles.ts`), routing w `App.tsx`, storage bucket `event-photos` — wszystko zbudowane i działające. Tabela `event_type_photos` już ma kolumnę `tags TEXT[]`.

## Co trzeba dodać/poprawić

### 1. Lista profili — drobne ulepszenia (`event-profiles-list.tsx`)
- Dodać badge "Brak hero" gdy `hero_image_url` jest null
- Dodać liczbę wyróżników (features count) obok photo count
- Sortowanie po `headline` (zamiast `id`)

### 2. Edycja — hinty przy polach (`event-profile-edit.tsx`)
- Hint pod "Opis długi": *"Ten tekst pojawia się na stronie klienta w sekcji 'O naszym cateringu'"*
- Hint pod "Tekst CTA": *"Przycisk akcji na dole strony klienta"*
- Hint pod toggle "Aktywny": *"Wyłączenie ukrywa profil na stronie klienta"*
- Walidacja testimonial: jeśli `testimonialText` wypełniony → `testimonialAuthor` wymagany (visual warning)

### 3. Tagi zdjęć — główna nowa funkcja (`event-profile-edit.tsx`)
- Pod każdą miniaturką w `SortablePhotoCard`: wiersz badge'ów z tagami
- Przycisk "+Tag" → Popover z listą predefiniowanych tagów (emoji + nazwa):
  `dekoracje, stoły, bufet, tort, sala, plener, goście, setup, detale, kuchnia, napoje, tematyczne`
- Input na custom tag (wpisz + Enter)
- Klik na badge → usuwa tag
- Nowy hook `useUpdateEventPhotoTags` w `use-event-profiles.ts`

### 4. Filtrowanie galerii po tagach (`event-profile-edit.tsx`)
- Nad gridem zdjęć: wiersz przycisków filtrów: "Wszystkie" | tagi obecne w zdjęciach
- Aktywny filtr podświetlony primary
- Filtrowanie lokalne (client-side) — bez dodatkowego query

### 5. Confirm dialog na usuwanie zdjęć (`event-profile-edit.tsx`)
- Przed `deletePhoto.mutate` → pokaż `ConfirmDialog` z "Czy na pewno usunąć to zdjęcie?"

### 6. Hook — dodanie mutacji tagów (`use-event-profiles.ts`)
- `useUpdateEventPhotoTags({ id, tags, eventTypeId })` — UPDATE `event_type_photos SET tags = $1 WHERE id = $2`

## Pliki do zmodyfikowania
1. `src/pages/admin/event-profiles-list.tsx` — badge "Brak hero", feature count, sort
2. `src/pages/admin/event-profile-edit.tsx` — tagi, filtry, hinty, confirm dialog (główna praca)
3. `src/hooks/use-event-profiles.ts` — `useUpdateEventPhotoTags`, feature count w list query

## Brak zmian w bazie danych
Kolumna `tags TEXT[]` już istnieje w `event_type_photos`. Wszystkie potrzebne tabele i storage bucket są na miejscu.

