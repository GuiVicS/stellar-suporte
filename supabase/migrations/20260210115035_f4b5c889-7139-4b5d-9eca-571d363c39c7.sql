
-- Allow admins and managers to update any profile
CREATE POLICY "Admins and managers can update profiles"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente')
);
