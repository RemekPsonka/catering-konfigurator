

# Sekcja zdjęć w formularzu dania

## Zakres
Dodanie sekcji zarządzania zdjęciami do formularza dania: upload drag & drop, podgląd miniaturek, oznaczanie głównego zdjęcia, usuwanie, sortowanie. Storage bucket + hook + komponent.

## Migracja bazy danych

### 1. Storage bucket `dish-photos`
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('dish-photos', 'dish-photos', true);

CREATE POLICY "auth_upload_dish_photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dish-photos');

CREATE POLICY "auth_update_dish_photos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'dish-photos');

CREATE POLICY "auth_delete_dish_photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'dish-photos');

CREATE POLICY "public_read_dish_photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'dish-photos');
```

## Pliki do utworzenia

### 2. `src/hooks/use-dish-photos.ts`
Hook React Query:
- `useDishPhotos(dishId)` — lista zdjęć posortowana po `sort_order`
- `useUploadDishPhoto()` — upload do Storage (`dish-photos/{dish_id}/{uuid}.{ext}`), INSERT do `dish_photos`, jeśli pierwsze zdjęcie → auto `is_primary` + sync `dishes.photo_url`
- `useDeleteDishPhoto()` — DELETE z `dish_photos` + remove z Storage, jeśli usunięte było primary → ustaw kolejne jako primary lub wyczyść `dishes.photo_url`
- `useSetPrimaryPhoto()` — UPDATE `is_primary = false` na wszystkich, `true` na wybranym, sync `dishes.photo_url`
- `useReorderPhotos()` — batch UPDATE `sort_order`
- Walidacja w hooku: max 5 zdjęć, max 5MB, dozwolone MIME types

### 3. `src/components/features/dishes/dish-photos-section.tsx`
Komponent sekcji zdjęć (Card):
- Drop zone z `onDragOver`/`onDrop` + hidden `<input type="file" multiple accept="image/jpeg,image/png,image/webp">`
- Placeholder: ikona Camera + "Przeciągnij zdjęcia tutaj lub kliknij, aby wybrać"
- Siatka 3 kolumny z miniaturkami (aspect-ratio square, object-cover)
- Na hover overlay z ikonami: ⭐ (set primary), 🗑️ (usuń)
- Primary photo oznaczone złotą ramką/badge
- Drag & drop sortowanie miniaturek (`@dnd-kit`)
- Loading state podczas uploadu (progress lub spinner na miniaturce)
- Info: "X / 5 zdjęć"
- Dostępne tylko w trybie `edit` (dish musi mieć `id`)

## Pliki do zmodyfikowania

### 4. `src/components/features/dishes/dish-form.tsx`
- Dodać sekcję "Zdjęcia" (Card) po sekcji Tagi (sekcja 3), przed Wewnętrzne (sekcja 4)
- Renderować `DishPhotosSection` tylko w trybie `edit` (z `dish.id`)
- W trybie `create`: informacja "Zdjęcia będą dostępne po zapisaniu dania"

### 5. `src/pages/admin/dish-new.tsx`
- Po `createDish.mutateAsync` — zamiast navigate do `/admin/dishes`, navigate do `/admin/dishes/{newDish.id}/edit` aby umożliwić dodanie zdjęć

## Szczegóły techniczne
- Upload path: `dish-photos/{dish_id}/{crypto.randomUUID()}.{ext}`
- `photo_url` w Storage: `supabase.storage.from('dish-photos').getPublicUrl(path)`
- Auto-sync `dishes.photo_url` z primary photo URL przy każdej zmianie primary
- Przy usuwaniu z tabeli `dish_photos` — jednocześnie `supabase.storage.from('dish-photos').remove([path])`
- DnD sortowanie: reuse `@dnd-kit` (już zainstalowane)

