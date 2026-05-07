## Plan: Napraw "Nie udało się zmienić statusu oferty"

### Diagnoza
W kroku 4 (Podgląd i wysyłka) kliknięcie **„Gotowa"**, **„Zapisz i pokaż link"** lub **„Wygeneruj treść emaila"** kończy się toastem „Nie udało się zmienić statusu oferty".

Powód: `statusMutation` w `step-preview-send.tsx` robi UPDATE **tylko** statusu i sum cenowych. Trigger w bazie `validate_offer_status` wymaga dla statusu `ready/sent`:
- `client_id IS NOT NULL`
- `people_count >= 1`
- `delivery_type IS NOT NULL`

Sprawdzenie bazy: ostatnia oferta `CS-2026-0003` ma `client_id = NULL` — czyli klient wybrany w UI w kroku 1 nie został zapisany do bazy. Pierwsze 2 oferty mają ten sam problem (wszystkie client_id NULL).

Przyczyna w kodzie: w `step-event-data.tsx` `useEffect` resetujący formularz (linie 72–76) zależy tylko od `data.event_type/client_id/people_count`. Gdy użytkownik wybiera klienta w kroku 1, klika „Dalej" i wraca do kroku 4 → mutacja statusu rzuca błąd, ale komunikat jest ogólny i nie wskazuje braku.

Dodatkowo: w step-preview-send użytkownik nie widzi, że brak `client_id`, bo krok 4 nie waliduje wstępnie wymaganych pól.

### Rozwiązanie

**1. Pre-walidacja przed zmianą statusu** (`step-preview-send.tsx`)
W handlerach `handleMarkReady`, `handleSaveAndShowLink`, `handleGenerateEmail`, `handleSendOffer` sprawdzić przed mutacją:
- `offer.client_id` — jeśli brak: toast `Brak klienta — wróć do kroku 1` + `onGoToStep?.(1)`
- `offer.people_count >= 1`
- `offer.delivery_type`

**2. Lepszy komunikat błędu z mutacji**
W `statusMutation.onError` wyciągnąć `error.message` z PostgresError (zawiera tekst z `RAISE EXCEPTION`) i pokazać go w toaście zamiast generycznego „Nie udało się zmienić statusu oferty".

**3. Panel ostrzegawczy w kroku 4**
Na górze kroku 4 dodać `Alert` (variant destructive) listujący brakujące pola wymagane do wysyłki, z przyciskiem „Uzupełnij w kroku 1". Widoczny tylko gdy czegoś brak.

### Pliki
- `src/components/features/offers/steps/step-preview-send.tsx` — pre-walidacja, lepsze błędy, alert

### Efekt
- Przyciski „Gotowa" / „Zapisz i pokaż link" / „Wygeneruj email" działają, gdy oferta jest kompletna
- Gdy brak danych — jasny komunikat + skok do kroku 1
- Błędy z bazy są czytelne dla użytkownika
