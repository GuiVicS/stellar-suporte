
-- Allow authenticated users to delete parts
CREATE POLICY "Authenticated can delete parts"
ON public.parts_used
FOR DELETE
USING (true);
