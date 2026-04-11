

## Plan: Auto-follow-up Email Sequence [CS-037]

### Wymaganie wstępne: domena email

Aby wysyłać emaile z systemu, potrzebna jest skonfigurowana domena email. Obecnie **brak skonfigurowanej domeny**. Pierwszym krokiem będzie setup domeny emailowej przez Lovable Cloud — to pozwoli na wysyłkę transakcyjnych emaili bez zewnętrznych serwisów.

### Obecny stan
- Tabela `offer_follow_ups` istnieje (offer_id, sequence_step, step_name, status, scheduled_at, email_to, sent_at)
- Trigger `trigger_schedule_follow_ups` automatycznie planuje sekwencję przy `status='sent'`
- Trigger `trigger_cancel_follow_ups` anuluje przy `accepted/won/lost`
- Funkcja `schedule_follow_up_sequence()` tworzy 4 kroki (thank_you 1h, reminder_48h 48h, manager_alert 5d, expiry_warning -3d)
- Kolumna `follow_up_enabled` na `offers` (default true)
- **Brak** Edge Function do wysyłki
- **Brak** toggle w UI
- **Brak** panelu follow-upów w dashboardzie

### Zmiany

**1. Setup infrastruktury email**
- Skonfiguruj domenę emailową (dialog setup)
- Scaffold transactional email infrastructure (queue, cron, Edge Function)

**2. Edge Function: `send-follow-up/index.ts`**
- Wywoływana przez pg_cron co 15 minut
- Query: `offer_follow_ups WHERE status='scheduled' AND scheduled_at <= now()`
- Per rekord:
  - Pobierz ofertę + klienta (email, nazwa, event_type, public_token, total_value, valid_until)
  - Sprawdź status oferty — jeśli `accepted/won/lost` → skip (mark `cancelled`)
  - Sprawdź `follow_up_enabled` — jeśli false → skip
  - **Skip logic**: jeśli `last_client_activity_at` w ciągu 24h i step = `reminder_48h` → opóźnij o 24h (UPDATE scheduled_at)
  - Step `thank_you`: jeśli oferta nie `viewed` po 24h → zmień treść na "Wysłaliśmy Ci ofertę"
  - Step `manager_alert`: wyślij na adres managera (z `system_settings` key `manager_email`), nie klienta
  - Wygeneruj HTML z szablonu per `step_name`
  - Wyślij przez `send-transactional-email` (Lovable email infrastructure)
  - UPDATE `status='sent'`, `sent_at=now()`, `email_subject=subject`
- Error handling: loguj, nie zmieniaj statusu → retry za 15 min

**3. 4 szablony HTML emaili** (w Edge Function)
- `thank_you`: "Dziękujemy za zapoznanie się z ofertą" + link
- `reminder_48h`: "Twoja oferta na [event] czeka" + kwota + data + link
- `manager_alert`: DO MANAGERA: "Oferta CS-XXXX — brak reakcji klienta od 5 dni"
- `expiry_warning`: "Oferta wygasa za 3 dni" + urgency CTA + link

**4. Toggle w wizardzie** (`step-preview-send.tsx`)
- W sekcji "Ustawienia wyświetlania" (collapsed card): dodaj Switch "Automatyczne follow-upy"
- Auto-save do `offers.follow_up_enabled`
- Opis: "System wyśle automatyczne przypomnienia po wysłaniu oferty"

**5. Panel follow-upów na dashboardzie** (`dashboard.tsx`)
- Nowa sekcja "Zaplanowane follow-upy" (Card) — między warnings a activity
- Hook `useFollowUps()` w `use-dashboard.ts`: fetch `offer_follow_ups` WHERE status IN ('scheduled','sent') z join na offers(offer_number) 
- Lista: offer_number, step_name (po polsku), scheduled_at, status badge
- Przycisk "Anuluj" per rekord (UPDATE status='cancelled')
- Max 10 rekordów, sortowane po scheduled_at

### Nowe pliki
1. `supabase/functions/send-follow-up/index.ts`

### Pliki modyfikowane
1. `src/components/features/offers/steps/step-preview-send.tsx` — toggle follow-up
2. `src/pages/admin/dashboard.tsx` — sekcja follow-upów
3. `src/hooks/use-dashboard.ts` — hook useFollowUps

### Nie ruszam
- Istniejących Edge Functions, triggery DB (już działają), publicznej strony oferty
- Tabeli `offer_follow_ups` (już istnieje z prawidłową strukturą)

