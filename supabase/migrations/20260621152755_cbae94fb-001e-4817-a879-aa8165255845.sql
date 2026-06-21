-- ============================================================
-- SECURITY: ustaw explicit search_path dla wszystkich funkcji
-- Ticket: CS-054
-- Cel: eliminacja "Function Search Path Mutable" warnings
-- ============================================================

-- ── SECURITY DEFINER (najbardziej krytyczne) ──
ALTER FUNCTION public.calculate_conversion_score(uuid)           SET search_path = public;
ALTER FUNCTION public.cancel_follow_ups(uuid)                    SET search_path = public;
ALTER FUNCTION public.find_offer_by_email_and_number(text, text) SET search_path = public;
ALTER FUNCTION public.get_setting(text)                          SET search_path = public;
ALTER FUNCTION public.get_unread_notification_count()            SET search_path = public;
ALTER FUNCTION public.insert_notification(uuid, text, text, text, text) SET search_path = public;
ALTER FUNCTION public.mark_all_notifications_read()              SET search_path = public;
ALTER FUNCTION public.mark_notification_read(uuid)               SET search_path = public;
ALTER FUNCTION public.schedule_follow_up_sequence(uuid)          SET search_path = public;

-- ── SECURITY INVOKER (triggery + helpery) ──
ALTER FUNCTION public.calc_valid_until()                         SET search_path = public;
ALTER FUNCTION public.check_acceptance_not_expired()             SET search_path = public;
ALTER FUNCTION public.check_offer_not_expired()                  SET search_path = public;
ALTER FUNCTION public.create_offer_version_snapshot()            SET search_path = public;
ALTER FUNCTION public.enforce_offer_client_columns()             SET search_path = public;
ALTER FUNCTION public.generate_offer_number()                    SET search_path = public;
ALTER FUNCTION public.generate_public_token()                    SET search_path = public;
ALTER FUNCTION public.generate_short_token(integer)              SET search_path = public;
ALTER FUNCTION public.get_event_photo_count(text)                SET search_path = public;
ALTER FUNCTION public.prevent_expired_acceptance()               SET search_path = public;
ALTER FUNCTION public.set_default_theme()                        SET search_path = public;
ALTER FUNCTION public.sync_offer_client()                        SET search_path = public;
ALTER FUNCTION public.trigger_cancel_follow_ups()                SET search_path = public;
ALTER FUNCTION public.trigger_schedule_follow_ups()              SET search_path = public;
ALTER FUNCTION public.update_updated_at()                        SET search_path = public;
ALTER FUNCTION public.validate_offer_status()                    SET search_path = public;