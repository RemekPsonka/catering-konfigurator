
# Naprawa 4 problemów w AI parsowaniu i generowaniu tekstu powitalnego

## Problem 1: Błędne rozpoznawanie typu eventu
**Plik:** `supabase/functions/parse-inquiry/index.ts`
- Zamiana opisu pola `event.type` w tool calling schema na rozbudowany z wskazówkami wyboru (instytucja→B2B/FIR/KAW, nie PRY)
- Dodanie reguły w sekcji "Zasady:" o instytucjach/firmach → nigdy PRY

## Problem 2: "Zastosuj wszystko" tworzy/przypisuje klienta
**Plik:** `src/components/features/offers/ai-inquiry-panel.tsx`
- Funkcja `handleApplyAll` już obsługuje klienta (linie 133-153) — wygląda poprawnie
- Weryfikacja: `onCreateClient` i `onUseExistingClient` są wywoływane, ale `onCreateClient` jest async i może nie czekać na wynik. Poprawka: `await onCreateClient(c)` — ale `onCreateClient` w step-event-data to `handleAiCreateClient` który jest async. Problem: w `ai-inquiry-panel` `onCreateClient` jest typowany jako `(data) => void`, nie `Promise`. Zmiana typów + `await`.

## Problem 3: Godziny "null – null"
**Plik:** `src/components/features/offers/ai-inquiry-panel.tsx`
- Linie 270-279: warunek `value` dla godzin już sprawdza `time_from || time_to`, ale wyświetla `null` gdy jedno jest null a drugie nie → zamiana `??` na `'—'` zamiast `'?'`
- Gdy oba null → value = null → pole się ukrywa (OK)

## Problem 4: Tekst powitalny generyczny
**Pliki:** `supabase/functions/generate-greeting/index.ts` + `src/components/features/offers/steps/step-event-data.tsx`
- Rozbudowa Edge Function `generate-greeting`: przyjmuje dodatkowe pola z AI parsowania (requirements, location, company, notes) i generuje spersonalizowany tekst
- W `step-event-data.tsx`: po `handleApplyAll` (lub po analizie AI) automatycznie generuj tekst powitalny wywołując edge function z danymi AI
- Dodanie przycisku "🔄 Wygeneruj ponownie" obok pola tekstu powitalnego

## Pliki do zmodyfikowania

### 1. `supabase/functions/parse-inquiry/index.ts`
- Rozbudowa opisu `event.type` w schema z wskazówkami klasyfikacji
- Dodanie reguły w "Zasady:" o instytucjach

### 2. `src/components/features/offers/ai-inquiry-panel.tsx`
- Typ `onCreateClient`: zmiana na `(data) => Promise<void>` 
- `handleApplyAll`: `await onCreateClient(c)` z try/catch
- Godziny: zamiana `'?'` na `'—'` w linii 273
- Usunięcie wyświetlania null wartości

### 3. `supabase/functions/generate-greeting/index.ts`
- Rozbudowa system prompt: spersonalizowany tekst z nawiązaniem do zapytania klienta
- Przyjmowanie dodatkowych pól: `requirements`, `location`, `company`, `notes`
- Dłuższy prompt (3-5 zdań) gdy mamy dane AI

### 4. `src/components/features/offers/steps/step-event-data.tsx`
- Nowa funkcja `generateGreeting()` wywołująca edge function z danymi AI
- Automatyczne wywołanie po "Zastosuj wszystko" 
- Przycisk "🔄 Wygeneruj ponownie" obok pola tekstu powitalnego
- Stan `isGeneratingGreeting` na loading indicator

## Deploy
Edge Functions: `parse-inquiry`, `generate-greeting`

## Brak zmian w bazie danych
