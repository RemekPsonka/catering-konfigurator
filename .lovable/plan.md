

# Krok 5 — Kalkulacja: ulepszenia + AI greeting + calculations.ts

## Stan obecny
Krok 5 już istnieje z pełną kalkulacją (warianty, usługi, rabat, dostawa, podsumowanie, teksty). Przycisk "Wygeneruj z AI" jest **disabled** z tooltipem "Wkrótce". Brakuje:
1. Funkcji `calculateOfferTotals` w `calculations.ts` (reusable)
2. Edge function do generowania tekstu powitalnego z AI
3. Aktywnego przycisku AI w komponencie (+ przekazanie `inquiry_text`, `event_type`, `event_date`)
4. Ikony 🔒 przy notatkach wewnętrznych

## Pliki do utworzenia

### 1. `supabase/functions/generate-greeting/index.ts`
Edge function wywołująca Lovable AI Gateway:
- Input: `{ event_type, event_date, inquiry_text, client_name, people_count }`
- System prompt: "Jesteś copywriterem firmy cateringowej Catering Śląski. Napisz elegancki, profesjonalny tekst powitalny do oferty cateringowej. Max 3-4 zdania. Język polski."
- User prompt: kontekst z inputów (typ imprezy, data, treść zapytania klienta, liczba osób)
- Model: `google/gemini-3-flash-preview`
- Non-streaming (invoke via supabase SDK)
- Obsługa błędów 429/402

## Pliki do zmodyfikowania

### 2. `src/lib/calculations.ts`
Dodać funkcję `calculateOfferTotals`:
- Parametry: `pricingMode, peopleCount, variants (with items), services, discountPercent, discountValue, deliveryCost`
- Zwraca: `{ variantTotals[], maxDishesTotal, discountAmount, dishesAfterDiscount, servicesTotalCalc, grandTotal, pricePerPerson }`
- Reusable między admin wizard a client page

### 3. `src/components/features/offers/steps/step-calculation.tsx`
- Przyjmij dodatkowe props: `inquiryText`, `eventType`, `eventDate`, `clientName` z wizard state
- Aktywuj przycisk "🤖 Generuj AI" — enabled gdy `inquiry_text` jest wypełnione
- Na klik: wywołaj edge function `generate-greeting`, wstaw wynik do textarea
- Loading state na przycisku podczas generowania
- Dodaj ikonę 🔒 przy "Notatki wewnętrzne"
- Refactor kalkulacji do użycia `calculateOfferTotals` z `calculations.ts`

### 4. `src/components/features/offers/offer-wizard.tsx`
- Przekaż dodatkowe props do `StepCalculation`: `inquiryText`, `eventType`, `eventDate`, `clientName`

## Szczegóły techniczne
- Edge function: `verify_jwt = false` (domyślne dla Lovable Cloud)
- LOVABLE_API_KEY już skonfigurowany jako secret
- Prompt budowany dynamicznie z kontekstem: typ eventu (label z `EVENT_TYPE_OPTIONS`), data, treść zapytania klienta
- Fallback: jeśli AI zwróci błąd → toast error, textarea bez zmian

