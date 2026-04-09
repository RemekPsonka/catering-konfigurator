

# AI Parsowanie maila klienta — Krok 1 wizarda

## Zakres
Nowa Edge Function `parse-inquiry` + przycisk "🤖 Analizuj zapytanie" w Kroku 1 wizarda + panel wyników AI z sekcjami: dane klienta, dane eventu, wymagania, budżet, notatki. Kolumny `ai_parsed_data` i `client_requirements` już istnieją w tabeli `offers`.

## Pliki do utworzenia

### 1. `supabase/functions/parse-inquiry/index.ts`
Edge Function wywołująca Gemini z tool calling (structured output):
- Input: `{ inquiry_text: string }`
- System prompt: ekspert cateringowy, analizuje zapytanie klienta
- Tool calling schema z wymaganą strukturą JSON (client, event, pricing_mode_suggestion, requirements, budget, notes)
- Model: `google/gemini-3-flash-preview`
- Obsługa 429/402 z polskimi komunikatami
- CORS headers (ten sam pattern co `generate-greeting`)

### 2. `src/components/features/offers/ai-inquiry-panel.tsx` (nowy)
Panel wyników analizy AI z sekcjami:
- Props: `parsedData`, `onApplyAll`, `onApplyField`, `onCreateClient`, `onUseExistingClient`, `form` (react-hook-form)
- **Dane klienta**: nazwa/email/telefon/firma + przyciski "Zastosuj"/"Utwórz klienta". Query `clients` by email/phone to check if exists.
- **Dane eventu**: per pole: ikona + label + wartość + confidence badge (🟢/🟡/🔴) + przycisk "Zastosuj". Brakujące pola: "⚠️ Brak w zapytaniu".
- **Wymagania**: checklistka z checkboxami, badge kategorii (menu/budget/service/logistics/dietary/special), priorytet (must=czerwony, nice=szary). Inline edit, dodaj/usuń.
- **Budżet**: kwota per person / total jeśli znalezione.
- **Notatki AI**: tekst z notes.
- Przycisk "Zastosuj wszystko" na górze.
- Animacja slide-down (CSS transition, nie framer-motion — to admin panel).

### 3. `src/components/features/offers/steps/step-event-data.tsx` (modyfikacja)
- Import `supabase` + nowy komponent `AiInquiryPanel`
- Nowy state: `aiResult`, `isAnalyzing`, `requirements`
- Przycisk "🤖 Analizuj zapytanie" obok textarea `inquiry_text` — aktywny gdy ≥20 znaków
- Na klik: `supabase.functions.invoke('parse-inquiry', { body: { inquiry_text } })`
- Po odpowiedzi: wyświetl `AiInquiryPanel` pod textarea
- `handleApplyAll`: wypełnia event_type, event_date, times, people_count, location, delivery_type, pricing_mode w formularzu
- `handleApplyField`: wypełnia pojedyncze pole
- `handleCreateClient`: tworzy klienta z danych AI i przypisuje do formularza
- Requirements przechowywane w local state, przekazywane do `onSubmit`

### 4. `src/hooks/use-offer-wizard.ts` (modyfikacja)
- Rozszerz `StepEventData` o opcjonalne pola: `ai_parsed_data?: unknown`, `client_requirements?: unknown`
- W `saveDraftMutation`: dodaj `ai_parsed_data` i `client_requirements` do payload INSERT/UPDATE

## Brak migracji
Kolumny `ai_parsed_data` (JSONB) i `client_requirements` (JSONB) już istnieją w tabeli `offers`.

## Szczegóły techniczne
- Edge Function używa tool calling (nie `response_format: json_object`) dla pewnego structured output
- Matching klienta: query `clients` WHERE `email = X` OR `phone = Y` — jeśli znaleziony, pokaż "Znaleziono klienta"
- Requirements: `[{ text, category, priority, is_met: null }]` — zapisywane do `client_requirements` przy save draft
- Przycisk AI nie blokuje flow — opcjonalny helper
- Loading: Loader2 spinner na przycisku + skeleton na panelu wyników

