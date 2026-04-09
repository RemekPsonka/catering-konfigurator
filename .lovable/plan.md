

# Strona zarządzania profilami typów eventów

## Zakres
Dwie nowe strony: lista profilów (grid kart) i edycja profilu (5 sekcji: tekst, wyróżniki, opinia, galeria, podgląd). Nowy storage bucket `event-photos`. Hook CRUD dla `event_type_profiles` i `event_type_photos`.

## Stan obecny
- Tabele `event_type_profiles` (12 wpisów z seed data) i `event_type_photos` (pusta) istnieją
- RLS policies istnieją (auth_full_access + public_read)
- Brak bucketa `event-photos` — trzeba utworzyć
- 12 typów eventów, każdy ma profil z headline, features JSONB, testimonial

## Wymagana migracja SQL

```sql
-- Storage bucket for event photos
INSERT INTO storage.buckets (id, name, public) VALUES ('event-photos', 'event-photos', true);

-- Storage RLS: auth users can upload/delete
CREATE POLICY "auth_upload_event_photos" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event-photos');

CREATE POLICY "auth_delete_event_photos" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'event-photos');

CREATE POLICY "public_read_event_photos" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'event-photos');
```

## Pliki do utworzenia

### 1. `src/hooks/use-event-profiles.ts`
- `useEventProfiles()` — fetch all profiles z count zdjęć (LEFT JOIN event_type_photos)
- `useEventProfile(id)` — single profile
- `useUpdateEventProfile()` — mutation: update headline, descriptions, cta_text, features, testimonial_*, is_active
- `useEventPhotos(eventTypeId)` — fetch photos ordered by sort_order
- `useUploadEventPhoto()` — upload to `event-photos/{eventTypeId}/{uuid}.ext`, insert row z auto-read width/height (Image API), max 15, max 10MB
- `useDeleteEventPhoto()` — delete from storage + DB
- `useSetHeroPhoto()` — toggle is_hero (reset others for same event type)
- `useUpdateEventPhoto()` — update caption, alt_text
- `useReorderEventPhotos()` — update sort_order

### 2. `src/pages/admin/event-profiles-list.tsx`
- Grid 2 kolumny desktop, 1 mobile
- Per karta: hero miniaturka (lub gradient fallback), headline, description_short, badge z liczbą zdjęć, Switch aktywny
- Klik → navigate to `/admin/settings/event-profiles/:id`

### 3. `src/pages/admin/event-profile-edit.tsx`
- `useParams<{ eventTypeId: string }>()`
- Sekcja 1 — Tekst: headline (input), description_short (textarea 200 znaków), description_long (textarea), cta_text (input), is_active (Switch)
- Sekcja 2 — Wyróżniki: edytowalna lista max 4 features (emoji input, tytuł 30 znaków, opis 80 znaków), dnd-kit sortowanie, +/- przyciski
- Sekcja 3 — Opinia: testimonial_text (textarea), testimonial_author (input), testimonial_event (input)
- Sekcja 4 — Galeria: drag-drop upload (reuse pattern z dish-photos), max 15, 10MB, caption/alt_text inputs per zdjęcie, hero toggle (⭐), delete, dnd-kit reorder. Width/height auto-detected via `new Image()` on upload
- Sekcja 5 — Podgląd: przycisk otwierający Dialog z mockupem (hero image + headline + opis + features + testimonial)
- Przycisk "Zapisz" na górze (sticky)

### 4. `src/App.tsx`
- Dodaj routes: `settings/event-profiles` i `settings/event-profiles/:eventTypeId`

### 5. `src/pages/admin/settings.tsx`
- Dodaj trzeci tab "Profile eventów" linkujący do `/admin/settings/event-profiles`

## Szczegóły techniczne
- Width/height detection: `const img = new Image(); img.onload = () => { width = img.naturalWidth; height = img.naturalHeight; }; img.src = URL.createObjectURL(file);`
- Features JSONB format: `[{ icon: "🎂", title: "Torty", text: "Autorskie torty..." }]`
- Storage path: `event-photos/{event_type_id}/{uuid}.{ext}`
- Galeria reuse: wzorowany na `DishPhotosSection` ale z dodatkowymi polami (caption, alt_text, is_hero) i wyższymi limitami (15 zdjęć, 10MB)

## Brak zmian w istniejących tabelach
Tabele `event_type_profiles` i `event_type_photos` już istnieją z odpowiednią strukturą.

