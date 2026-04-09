

# P-2.12 — Zapis draft bez pełnych danych + numer oferty

## Zakres
Umożliwienie zapisu draftu oferty z minimalnymi danymi (tylko `event_type`). Dwupoziomowa walidacja: luźna dla draftu, pełna dla statusu ready/sent. Numer oferty nadawany od razu.

## Wymagana migracja SQL

```sql
-- 1. people_count: nullable + domyślnie NULL, usunięcie CHECK >= 1
ALTER TABLE public.offers DROP CONSTRAINT offers_people_count_check;
ALTER TABLE public.offers ALTER COLUMN people_count DROP NOT NULL;
ALTER TABLE public.offers ALTER COLUMN people_count SET DEFAULT NULL;

-- 2. delivery_type: nullable dla draftów
ALTER TABLE public.offers ALTER COLUMN delivery_type DROP NOT NULL;

-- 3. Zaktualizowany trigger walidacji statusu
CREATE OR REPLACE FUNCTION public.validate_offer_status()
RETURNS trigger LANGUAGE plpgsql AS $function$
BEGIN
  IF NEW.status = 'draft' THEN
    RETURN NEW;
  END IF;

  IF NEW.status IN ('ready','sent','viewed','revision','accepted','won') THEN
    IF NEW.client_id IS NULL THEN
      RAISE EXCEPTION 'Klient jest wymagany dla statusu: %', NEW.status;
    END IF;
    IF NEW.people_count IS NULL OR NEW.people_count < 1 THEN
      RAISE EXCEPTION 'Liczba osób jest wymagana dla statusu: %', NEW.status;
    END IF;
    IF NEW.delivery_type IS NULL THEN
      RAISE EXCEPTION 'Typ dostawy jest wymagany dla statusu: %', NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
```

## Pliki do zmodyfikowania

### 1. `src/components/features/offers/steps/step-event-data.tsx`
- **Zod schema**: zmień walidację — `event_type` required, reszta opcjonalna:
  - `people_count`: `z.coerce.number().min(0)` (0 = nie podano)
  - `delivery_type`, `pricing_mode`, `client_id`: `.optional()` lub `.default('')`
- Dodaj hint pod polem klienta gdy puste: "⚠️ Uzupełnij klienta przed wysłaniem oferty"
- "Dalej" na kroku 1: nie wymaga pełnej walidacji — submit z brakującymi polami, pokaż toast z listą brakujących

### 2. `src/hooks/use-offer-wizard.ts`
- **saveDraftMutation payload**: obsłuż nullable `people_count` (NULL gdy 0), nullable `delivery_type` (NULL gdy puste)
- **Toast po zapisie**: `"Szkic zapisany! Numer oferty: ${data.offer_number}"` (zwróć offer_number z SELECT)
- Dodaj `offer_number` do stanu wizarda (display w headerze)

### 3. `src/components/features/offers/offer-wizard.tsx`
- **Header**: wyświetl numer oferty po zapisie: `"Oferta CS-2026-0042 (szkic)"`
- **goToStep**: krok 1→2 nie wymaga pełnej walidacji — zapisz co jest, przejdź dalej
- **"Dalej" krok 1**: nie submit form (pełna walidacja), zamiast tego `dispatch SET_EVENT_DATA` + `goToStep(2)` z toast o brakujących polach
- **Stepper**: przekaż `missingSteps` prop — kroki z brakującymi danymi mają pomarańczową kropkę

### 4. `src/components/features/offers/wizard-stepper.tsx`
- Dodaj prop `warningSteps?: number[]`
- Krok z ostrzeżeniem: pomarańczowa kropka (dot) w rogu ikony kroku

### 5. `src/pages/admin/offers-list.tsx`
- Dodaj kolumnę "Nr oferty" (`offer_number`) w tabeli
- Opcjonalnie: kolumna "Kompletność" z prostym progress indicator

### 6. `src/hooks/use-offers.ts`
- Upewnij się że query zwraca `offer_number`

## Logika dwupoziomowej walidacji (w kodzie)

**Draft** (zapis szkicu): wymaga tylko `event_type` — reszta NULL/puste
**Ready** (zmiana statusu): wymaga `client_id`, `people_count >= 1`, `delivery_type`, `pricing_mode`, min 1 wariant z daniem
**Send**: wymaga Ready + email klienta

Walidacja Ready/Send w osobnej funkcji helper (np. `validateOfferReadiness`) używanej w kroku 7 przy przyciskach "Oznacz jako gotowa" / "Wyślij".

## Brak zmian w Edge Functions

