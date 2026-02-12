
-- Add cost column to parts_used table
ALTER TABLE public.parts_used ADD COLUMN cost NUMERIC(10,2) DEFAULT NULL;
