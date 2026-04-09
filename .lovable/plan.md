

# AI Walidacja oferty — Krok 7 (Podgląd)

## Zakres
Nowa Edge Function `validate-offer` + panel walidacji AI w Kroku 7 wizarda. Porównuje ofertę z `client_requirements` i wyświetla wyniki: per-wymaganie status, ostrzeżenia, sugestie, podsumowanie.

## Pliki do utworzenia

### 1. `supabase/functions/validate-offer/index.ts`
Edge Function wywołująca Gemini z tool calling:
- Input: `{ requirements, inquiry_text, event_type, event_date, people_count, pricing_mode, variants_summary, services_summary, total_value, price_per_person, discount_info, budget_info }`
- Tool calling schema `validate_offer` zwracająca: `{ validations[], overall_score, overall_status, summary, warnings[], suggestions[] }`
- Model: `google/gemini-3-flash-preview`
- Ten sam pattern CORS/error handling co `generate-summary`

### 2. `src/components/features/offers/steps/offer-validation-panel.tsx`
Komponent panelu walidacji:
- Props: `offerId`, `requirements`, `inquiryText`, `offer` (FullOffer), `variants`, `services`, `totals`, `pricingMode`, `peopleCount`
- Auto-invoke na mount (jeśli requirements > 0) LUB przycisk "🤖 Sprawdź zgodność"
- State: `validationResult`, `isValidating`
- Buduje kontekst oferty (warianty z daniami, usługi, ceny) i wywołuje Edge Function
- Sekcje UI:
  - **Nagłówek**: ikona + tekst wg `overall_status` (🟢 ready / 🟡 needs_attention / 🔴 major_gaps)
  - **Lista walidacji**: per wymaganie — kolorowe tło wg status (met=zielony, partially=żółty, not_met=czerwony, unclear=szary) + explanation + suggestion z przyciskiem "Popraw" (→ goToStep)
  - **Ostrzeżenia**: Alert box pomarańczowy z listą
  - **Sugestie**: sekcja szara z ikoną 💡
  - **Score**: progress bar + "[X]/[Y] spełnionych"
  - **Summary**: tekst AI
- Loading: Skeleton
- Error: toast + "Sprawdź ręcznie"
- Zapisuje wynik do `offers.ai_parsed_data` (pole `validation`)

### 3. `src/components/features/offers/steps/step-preview.tsx` (modyfikacja)
- Dodaj props: `requirements?: ClientRequirement[]`, `inquiryText?: string`, `onGoToStep?: (step: number) => void`
- Jeśli `requirements.length > 0`: renderuj `<OfferValidationPanel>` między podglądem a przyciskami akcji
- Przekaż `onGoToStep` do panelu (do przycisku "Popraw")

### 4. `src/components/features/offers/offer-wizard.tsx` (modyfikacja)
- Przekaż `requirements`, `inquiryText`, `onGoToStep={goToStep}` do `StepPreview` w case 7

## Brak zmian w bazie danych
Wynik walidacji zapisywany do istniejącego `ai_parsed_data` (JSONB).

## Szczegóły techniczne
- Panel walidacji nie blokuje wysyłki — przyciski "Wyślij" zawsze aktywne
- `onGoToStep` pozwala z panelu wrócić do kroku z problemem (np. krok 2 dla menu, krok 3 dla usług)
- Mapping kategorii wymagania → krok: menu/dietary→2, service→3, budget→5
- Walidacja uruchamiana raz na mount, przycisk "Odśwież" do ponownej analizy

