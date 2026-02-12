
-- Fix search_path on functions
ALTER FUNCTION public.generate_os_code() SET search_path = public;
ALTER FUNCTION public.update_updated_at() SET search_path = public;
