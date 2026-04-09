

# Krok 6 (Motyw graficzny) + Krok 7 (Podgląd i wysyłka)

## Zakres
Implementacja ostatnich dwóch kroków wizarda oferty: wybór motywu graficznego z podglądem kolorów/fontów oraz uproszczony podgląd oferty z akcjami zapisu/wysyłki.

## Pliki do utworzenia

### 1. `src/components/features/offers/steps/step-theme.tsx`
Krok 6 — Motyw graficzny:
- Pobiera `offer_themes` z Supabase (12 motywów) via `useQuery`
- Pobiera aktualny `theme_id` oferty via `useQuery(['offer-theme', offerId])`
- Auto-wybór: domyślny `theme_id` = `event_type` (ustawiony przez trigger `set_default_theme`)
- Siatka 3-4 kolumny z kartami motywów: miniaturka kolorów (primary, secondary, accent jako kółka/kwadraty), nazwa, nastrój (mood badge)
- Zaznaczony motyw z obramowaniem primary + check icon
- Na klik: `UPDATE offers SET theme_id = X WHERE id = offerId`
- Pod siatką: podgląd wybranego motywu — ramka z przykładowym nagłówkiem oferty:
  - Tło: `background_color`, tekst: `text_color`
  - Nagłówek w `header_font` (lub `font_family`) z kolorem `primary_color`
  - Przykładowy tekst w `font_family`
  - Pasek akcentowy w `accent_color`
- Props: `offerId: string | null`, `eventType: string`

### 2. `src/components/features/offers/steps/step-preview.tsx`
Krok 7 — Podgląd i wysyłka:
- Pobiera pełne dane oferty: `offers` + `clients` + `offer_variants` z `variant_items.dishes` + `offer_services.services` + `offer_themes` + `offer_terms`
- Renderuje uproszczony podgląd oferty inline (MVP — nie pixel-perfect):
  - Header z logo/nazwą firmy w kolorach motywu
  - Tekst powitalny (`greeting_text`)
  - Per wariant: nazwa + lista dań z cenami (wg `price_display_mode`)
  - Edytowalne pozycje oznaczone ikoną 🔄
  - Kalkulacja wg `price_display_mode` (DETAILED/PER_PERSON_AND_TOTAL/TOTAL_ONLY/PER_PERSON_ONLY/HIDDEN)
  - Usługi (jeśli `price_display_mode` != HIDDEN)
  - Warunki z tabeli `offer_terms` (is_active=true)
  - Notatki dla klienta
  - Footer z ważnością oferty (`valid_until`)
- Trzy przyciski akcji:
  1. **"Zapisz szkic"** → status: draft, toast, redirect `/admin/offers`
  2. **"Oznacz jako gotowa"** → status: ready, toast, redirect
  3. **"Wyślij do klienta"** → walidacja email klienta → status: sent, `sent_at = now()` → `console.log('Email wysłany do:', clientEmail, 'Link:', publicUrl)` (faktyczna wysyłka w Fazie 3) → redirect z toast "Oferta wysłana!"
- Props: `offerId: string | null`, `pricingMode: string`, `peopleCount: number`

## Pliki do zmodyfikowania

### 3. `src/components/features/offers/offer-wizard.tsx`
- Import `StepTheme` i `StepPreview`
- `case 6`: render `<StepTheme offerId={state.offerId} eventType={state.stepData.eventData.event_type} />`
- `case 7`: render `<StepPreview offerId={state.offerId} pricingMode={state.stepData.eventData.pricing_mode} peopleCount={state.stepData.eventData.people_count} />`
- Na kroku 7: zamień dolny przycisk "Dalej" na trzy przyciski z komponentu `StepPreview` (lub ukryj dolną nawigację i obsłuż w samym komponencie)

### 4. `src/hooks/use-offer-wizard.ts`
- Dodaj mutation `updateStatus` do zmiany statusu oferty (draft/ready/sent) z odpowiednimi polami (`sent_at`)
- Eksportuj z hooka, użyj w `StepPreview`

## Szczegoly techniczne
- Motywy: `supabase.from('offer_themes').select('*')` — 12 rekordow seed data z kolumnami `primary_color, secondary_color, accent_color, background_color, text_color, font_family, header_font, mood, hero_pattern`
- Podglad motywu: inline `style` z CSS custom properties z tabeli
- `price_display_mode` steruje widocznoscią cen w podglądzie:
  - `DETAILED`: pełna tabela cen per danie + usługi + rabat + delivery + total
  - `PER_PERSON_AND_TOTAL`: cena/os per wariant + łączna kwota
  - `TOTAL_ONLY`: tylko łączna kwota
  - `PER_PERSON_ONLY`: tylko cena/os per wariant
  - `HIDDEN`: "Cena do ustalenia indywidualnie"
- Link publiczny: `/offer/${public_token}` (token auto-generowany przez trigger)
- Brak zmian w bazie danych — tabele `offer_themes`, `offers`, `offer_terms` już istnieją

