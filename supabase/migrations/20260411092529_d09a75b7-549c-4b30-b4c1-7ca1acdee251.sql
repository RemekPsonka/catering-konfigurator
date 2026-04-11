
ALTER TABLE public.variant_items 
  ADD COLUMN split_parent_id uuid REFERENCES public.variant_items(id) ON DELETE SET NULL,
  ADD COLUMN split_percent numeric DEFAULT NULL;
