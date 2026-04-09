

# Poprawa promptu AI do generowania podsumowania oferty

## Problem
Prompt wysyła zbyt mało danych o ofercie — tylko nazwy wariantów z liczbą dań, nazwy usług, łączną kwotę i zapytanie klienta. AI wymyśla szczegóły (np. "wahania rynkowe 2027", "serwis kawowy z ciastem") zamiast opisywać faktyczną zawartość oferty.

## Rozwiązanie
Przekazać do edge function **pełne dane oferty** (listę dań per wariant z cenami, usługi z cenami, rabat, koszty dostawy, liczbę osób, datę, lokalizację) i poprawić system prompt żeby AI opisywał **tylko to co faktycznie jest w ofercie**.

## Zmiany

### 1. `src/components/features/offers/steps/step-calculation.tsx` (~linia 214-228)
Rozbudować dane wysyłane do edge function:
- `variants_summary`: per wariant — nazwa + lista dań z cenami (np. "Classic: Rosół z makaronem (12 zł), Schabowy (25 zł)")
- `services_summary`: nazwa + cena × ilość
- Nowe pola: `people_count`, `event_date`, `event_location` (z offerData), `client_name`, `discount_info` (rabat %), `delivery_cost`, `pricing_mode_label`

### 2. `supabase/functions/generate-summary/index.ts`
- Przyjąć nowe pola w body
- Dodać je do kontekstu promptu
- **Zmienić system prompt** na:

```
Jesteś ekspertem od ofert cateringowych firmy "Catering Śląski". 
Napisz krótkie podsumowanie oferty (3-5 zdań) na podstawie WYŁĄCZNIE podanych danych.

ZASADY:
- Opisuj TYLKO to co faktycznie jest w danych — nie wymyślaj dań, usług ani szczegółów
- Jeśli brakuje wariantów lub dań — napisz że oferta jest w przygotowaniu
- Nie wspominaj o cenach konkretnych dań — podaj tylko łączną wartość
- Wspomnij liczbę wariantów, kluczowe dania, usługi dodatkowe
- Ton: profesjonalny, ciepły, po polsku
- Nie używaj markdown
- Zwracaj sam tekst
```

## Brak zmian w bazie danych

