INSERT INTO storage.buckets (id, name, public) VALUES ('dish-photos', 'dish-photos', true);

CREATE POLICY "auth_upload_dish_photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dish-photos');

CREATE POLICY "auth_update_dish_photos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'dish-photos');

CREATE POLICY "auth_delete_dish_photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'dish-photos');

CREATE POLICY "public_read_dish_photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'dish-photos');