

# Naprawa AI parsowania — 3 bugi

## Zakres
1. **Edge Function prompt** — twarde reguły budżetowe zapobiegające halucynacjom
2. **"Zastosuj wszystko"** — automatyczne wyszukanie/utworzenie klienta
3. **UI budżetu** — ukrycie gdy null, badge "Z maila klienta"

## Pliki do zmodyfikowania

### 1. `supabase/functions/parse-inquiry/index.ts`
Zamiana sekcji "Zasady:" w systemPrompt (linia 31-37) na rozszerzoną wersję z twardymi regułami budżetowymi:
- BUDŻET — KRYTYCZNE ZASADY: tylko dosłowne kwoty z tekstu
- Nigdy nie obliczaj per_person z total ani odwrotnie
- "proszę o wycenę" = null
- Dodatkowe opisy w tool schema: `per_person` description = "Budżet na osobę TYLKO jeśli klient dosłownie podał kwotę. Jeśli nie podał — null", analogicznie `total`

### 2. `src/components/features/offers/ai-inquiry-panel.tsx`
**handleApplyAll (linia 120-130)** — rozbudowa o obsługę klienta:
- Po zastosowaniu pól eventu, sprawdź dane klienta
- Jeśli email/phone → query `existingClient` (już mamy w `existingClientQuery.data`)
- Jeśli znaleziony → `onUseExistingClient(id, name)` + toast
- Jeśli nie znaleziony i są dane → `onCreateClient(parsedData.client)` (async, ale fire-and-forget z catch)
- Jeśli brak danych klienta → pomiń
- Zmień toast na kontekstowy (klient+event vs tylko event)

**Sekcja budżetu (linia 353-371)** — modyfikacja:
- Dodaj `Badge` "📌 Z maila klienta" obok nagłówka
- Sekcja już jest ukryta gdy `!hasBudget` (linia 165, 354) — to działa poprawnie

### 3. Deployment Edge Function
Deploy `parse-inquiry` po zmianach.

## Brak zmian w bazie danych

