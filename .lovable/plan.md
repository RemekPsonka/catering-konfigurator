

## Plan: CS-037 — Follow-up toggle + dashboard panel (bez emaila)

Pomijamy setup domeny email i Edge Function wysyłki. Dodajemy tylko UI: toggle w wizardzie i panel follow-upów na dashboardzie.

### Zmiany

**1. `src/components/features/offers/steps/step-preview-send.tsx`**
- Dodaj stan `followUpEnabled` (default `true`)
- W `useEffect` init: `setFollowUpEnabled(offer.follow_up_enabled ?? true)`
- Dodaj do `settingsPayload`: `follow_up_enabled: followUpEnabled`
- W sekcji "Ustawienia wyświetlania" (po toggle upsell, linia ~423): nowy Switch + label "Automatyczne follow-upy" + opis "System wyśle automatyczne przypomnienia po wysłaniu oferty"

**2. `src/hooks/use-dashboard.ts`**
- Dodaj `useFollowUps()` — fetch `offer_follow_ups` WHERE status IN ('scheduled','sent'), join `offers(offer_number)`, order by `scheduled_at`, limit 10
- Dodaj `useCancelFollowUp()` — mutation UPDATE status='cancelled'

**3. `src/pages/admin/dashboard.tsx`**
- Import `useFollowUps`, `useCancelFollowUp`
- Nowa sekcja Card "Zaplanowane follow-upy" między warnings a activity
- Lista: offer_number, step_name (polskie etykiety), scheduled_at (formatDistanceToNow), status Badge, przycisk "Anuluj"
- Empty state: "Brak zaplanowanych follow-upów"
- Step name labels: `{ thank_you: 'Podziękowanie', reminder_48h: 'Przypomnienie 48h', manager_alert: 'Alert managera', expiry_warning: 'Wygasa za 3 dni' }`

### Nie ruszam
- Edge Functions, tracking, publicznej strony, schema DB

