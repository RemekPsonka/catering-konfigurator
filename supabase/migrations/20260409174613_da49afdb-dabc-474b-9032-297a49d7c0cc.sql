INSERT INTO storage.buckets (id, name, public) VALUES ('event-photos', 'event-photos', true);

CREATE POLICY "auth_upload_event_photos" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event-photos');

CREATE POLICY "auth_delete_event_photos" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'event-photos');

CREATE POLICY "public_read_event_photos" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'event-photos');