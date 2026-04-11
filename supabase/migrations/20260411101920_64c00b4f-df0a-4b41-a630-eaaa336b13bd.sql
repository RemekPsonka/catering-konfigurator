
INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true);

CREATE POLICY "Public read company assets" ON storage.objects FOR SELECT USING (bucket_id = 'company-assets');
CREATE POLICY "Auth upload company assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-assets' AND auth.uid() IS NOT NULL);
CREATE POLICY "Auth update company assets" ON storage.objects FOR UPDATE USING (bucket_id = 'company-assets' AND auth.uid() IS NOT NULL);
CREATE POLICY "Auth delete company assets" ON storage.objects FOR DELETE USING (bucket_id = 'company-assets' AND auth.uid() IS NOT NULL);
