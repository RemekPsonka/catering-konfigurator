
-- 1. Create survey_responses table
CREATE TABLE public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  client_name VARCHAR,
  event_type VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "survey_responses_public_insert"
  ON public.survey_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "survey_responses_auth_read"
  ON public.survey_responses FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 2. Add survey_token to offer_follow_ups
ALTER TABLE public.offer_follow_ups
  ADD COLUMN IF NOT EXISTS survey_token VARCHAR UNIQUE;

-- 3. Replace schedule_follow_up_sequence to add step 5
CREATE OR REPLACE FUNCTION public.schedule_follow_up_sequence(p_offer_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_offer RECORD;
  v_client_email VARCHAR;
  v_survey_token VARCHAR;
BEGIN
  SELECT o.*, c.email as client_email, c.name as client_name
  INTO v_offer
  FROM offers o
  LEFT JOIN clients c ON c.id = o.client_id
  WHERE o.id = p_offer_id;
  
  IF v_offer IS NULL OR v_offer.follow_up_enabled = false THEN
    RETURN;
  END IF;
  
  v_client_email := v_offer.client_email;
  
  -- Krok 1: Podziękowanie — 1h po viewed
  INSERT INTO offer_follow_ups (offer_id, sequence_step, step_name, scheduled_at, email_to)
  VALUES (p_offer_id, 1, 'thank_you', now() + interval '1 hour', v_client_email)
  ON CONFLICT (offer_id, sequence_step) DO NOTHING;
  
  -- Krok 2: Reminder — 48h po wysłaniu
  INSERT INTO offer_follow_ups (offer_id, sequence_step, step_name, scheduled_at, email_to)
  VALUES (p_offer_id, 2, 'reminder_48h', now() + interval '48 hours', v_client_email)
  ON CONFLICT (offer_id, sequence_step) DO NOTHING;
  
  -- Krok 3: Alert do managera — 5 dni po wysłaniu
  INSERT INTO offer_follow_ups (offer_id, sequence_step, step_name, scheduled_at, email_to)
  VALUES (p_offer_id, 3, 'manager_alert', now() + interval '5 days', NULL)
  ON CONFLICT (offer_id, sequence_step) DO NOTHING;
  
  -- Krok 4: Ostrzeżenie przed wygaśnięciem — 3 dni przed valid_until
  IF v_offer.valid_until IS NOT NULL THEN
    INSERT INTO offer_follow_ups (offer_id, sequence_step, step_name, scheduled_at, email_to)
    VALUES (p_offer_id, 4, 'expiry_warning', v_offer.valid_until - interval '3 days', v_client_email)
    ON CONFLICT (offer_id, sequence_step) DO NOTHING;
  END IF;
  
  -- Krok 5: Ankieta post-event — 2 dni po event_date
  IF v_offer.event_date IS NOT NULL THEN
    v_survey_token := encode(gen_random_bytes(16), 'hex');
    INSERT INTO offer_follow_ups (offer_id, sequence_step, step_name, scheduled_at, email_to, survey_token)
    VALUES (p_offer_id, 5, 'post_event_survey', v_offer.event_date + interval '2 days', v_client_email, v_survey_token)
    ON CONFLICT (offer_id, sequence_step) DO NOTHING;
  END IF;
END;
$function$;
