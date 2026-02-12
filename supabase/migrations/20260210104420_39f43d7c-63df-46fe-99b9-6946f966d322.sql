
-- Create storage bucket for OS evidences (photos, audio, files)
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidences', 'evidences', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload evidences"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evidences');

-- Allow authenticated users to view evidences
CREATE POLICY "Authenticated users can view evidences"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'evidences');

-- Allow public access to view evidence files
CREATE POLICY "Public can view evidences"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'evidences');

-- Allow authenticated users to delete their own evidences
CREATE POLICY "Authenticated users can delete evidences"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'evidences');
