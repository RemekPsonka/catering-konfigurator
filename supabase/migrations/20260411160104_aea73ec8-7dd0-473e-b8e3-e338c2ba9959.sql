CREATE TABLE public.offer_term_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES public.offer_terms(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(offer_id, term_id)
);

ALTER TABLE public.offer_term_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_overrides_read" ON public.offer_term_overrides FOR SELECT USING (true);
CREATE POLICY "auth_overrides_all" ON public.offer_term_overrides FOR ALL USING (auth.uid() IS NOT NULL);