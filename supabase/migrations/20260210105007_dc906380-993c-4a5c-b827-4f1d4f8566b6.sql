
-- Allow authenticated users to delete evidences
CREATE POLICY "Authenticated can delete evidences"
ON public.evidences
FOR DELETE
TO authenticated
USING (true);
