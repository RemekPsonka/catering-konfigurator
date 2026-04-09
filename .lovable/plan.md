

# AI Podsumowanie oferty — nowa funkcja

## Stan obecny
- **AI tekst powitalny**: ✅ działa — Edge Function `generate-greeting` + przycisk w kroku 5 z loading state
- **AI podsumowanie**: ❌ brak — kolumna `ai_summary` istnieje w bazie, wyświetla się na stronie klienta, ale brak Edge Function i przycisku do generowania

## Zakres zmian

### 1. Nowa Edge Function: `supabase/functions/generate-summary/index.ts`
- Ten sam pattern co `generate-greeting` (CORS, LOVABLE_API_KEY, error handling 429/402)
- Model: `google/gemini-3-flash-preview`
- System prompt: "Jesteś ekspertem od ofert cateringowych firmy Catering Śląski. Napisz krótkie podsumowanie przygotowanej oferty (3-4 zdania). Opisz co zawiera oferta, ile wariantów, jakie wyróżniki. Odnieś się do zapytania klienta. Ton: profesjonalny, entuzjastyczny, po polsku. Nie używaj markdown. Zwracaj sam tekst."
- Input body: `{ inquiry_text, event_type_label, variants_summary, total_value, services_summary }`
- Output: `{ summary: string }`

### 2. `src/components/features/offers/steps/step-calculation.tsx`
- Dodaj stan: `aiSummary`, `isGeneratingSummary`
- Pobierz `ai_summary` z oferty (dodaj do queryFn w `offer-calc`)
- Dodaj `handleGenerateSummary()` — invoke `generate-summary` z danymi wariantów/usług/totals
- Auto-save `ai_summary` z debounce (jak greeting)
- Nowa sekcja UI (Card) między tekstem powitalnym a notatkami:
  - Textarea z wartością `aiSummary`
  - Przycisk "🤖 Generuj podsumowanie AI" z Loader2 spinner
  - Podpowiedź o inquiry_text jak przy greeting

### Brak zmian w bazie danych
Kolumna `ai_summary` już istnieje. Wyświetlanie na stronie klienta już działa.

