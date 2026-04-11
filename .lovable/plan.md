

## Plan: CS-039 — Email potwierdzający akceptację + ankieta post-event

### Wymaganie wstępne: domena email

Brak skonfigurowanej domeny email. Aby wysyłać automatyczne emaile (potwierdzenie akceptacji, ankieta post-event), potrzebna jest domena nadawcy. Bez niej możemy zbudować **logikę i UI**, ale emaile nie będą wysyłane.

**Proponuję podejście dwuetapowe:**
1. TERAZ: zbuduj logikę po stronie klienta (potwierdzenie inline po akceptacji, ankieta /survey, planowanie post-event w offer_follow_ups)
2. PÓŹNIEJ: gdy skonfigurujesz domenę email — podepnij wysyłkę

### Obecny stan
- `AcceptanceSection` — po akceptacji pokazuje "Dziękujemy", wysyła notification do admina
- `offer_follow_ups` — 4 kroki (thank_you, reminder_48h, manager_alert, expiry_warning)
- `schedule_follow_up_sequence()` — planuje sekwencję przy status=sent
- Brak step 5 (post_event_survey)
- Brak strony ankiety
- Brak emaili transakcyjnych (brak domeny)

### Zmiany

**1. Migration: dodaj step 5 do sekwencji follow-up + tabela survey_responses**
- ALTER `schedule_follow_up_sequence()` — dodaj krok 5: `post_event_survey`, scheduled_at = `event_date + 2 days` (jeśli event_date nie null)
- CREATE TABLE `survey_responses` (id, offer_id, rating INT 1-5, comment TEXT, created_at) z RLS (public insert, auth select)
- Dodaj survey_token (unique) do offer_follow_ups lub osobna kolumna

**2. Strona ankiety: `src/pages/public/survey.tsx`**
- Route: `/survey/:token`
- Na mount: waliduj token (query offer_follow_ups WHERE step_name='post_event_survey' AND survey_token=:token)
- UI: gwiazdki 1-5 (klikalne) + textarea "Twój komentarz" + przycisk "Wyślij opinię"
- Po submit: INSERT do `survey_responses` + opcjonalnie INSERT do `testimonials` (is_active=false, do zatwierdzenia)
- CTA: "Podziel się opinią na Google" — link do Google Maps (z company_config)
- Sukces: "Dziękujemy za opinię!"

**3. Rozbudowa AcceptanceSection — inline potwierdzenie**
- Po akceptacji (success state): rozbuduj sekcję "Dziękujemy" o:
  - Podsumowanie: data wydarzenia, wariant, kwota
  - "Co dalej?": 1) Zaliczka 30% do 3 dni, 2) Kontakt 7 dni przed eventem, 3) Obsługa w dniu wydarzenia
  - Link "Wróć do szczegółów oferty" (scroll to top)
- To zastąpi prosty tekst "Skontaktujemy się w sprawie dalszych szczegółów"

**4. Route w App.tsx**
- Dodaj `/survey/:token` w PublicLayout

### Nowe pliki
1. `src/pages/public/survey.tsx` — strona ankiety

### Pliki modyfikowane
1. `src/components/public/acceptance-section.tsx` — rozbudowa success state
2. `src/App.tsx` — nowa route /survey/:token
3. `src/lib/company-config.ts` — dodaj `googleReviewUrl` (jeśli brak)

### Migration SQL
1. CREATE TABLE `survey_responses`
2. ALTER FUNCTION `schedule_follow_up_sequence()` — dodaj krok 5
3. Dodaj kolumnę `survey_token` do `offer_follow_ups` (jeśli brak)

### Nie ruszam
- send-follow-up Edge Function, publicznej strony oferty, tracking, dashboardu

### Co zostaje na później (po setup domeny email)
- Edge Function wysyłki emaila potwierdzającego akceptację
- Edge Function wysyłki ankiety post-event
- HTML szablony emaili

