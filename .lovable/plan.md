

# System dostępu klienta do oferty — /offer/find + poprawki statusów

## Zakres
1. Nowa strona `/offer/find` — wyszukiwarka oferty po email + numer
2. Poprawki statusów w `usePublicOffer` (dodanie `won`)
3. Lepsze komunikaty statusowe na stronie oferty (draft/ready vs lost vs not-found)
4. Link "Znajdź swoją ofertę" na stronie logowania
5. Email template jako stała
6. Rate limiting na frontendzie (cooldown po 3 nieudanych próbach)

## Istniejąca infrastruktura
- RPC `find_offer_by_email_and_number` — **już istnieje** w bazie, zwraca `public_token, status, offer_number, client_name`
- `usePublicOffer` — filtruje statusy, ale brakuje `won`
- `useMarkOfferViewed` — działa poprawnie
- Strona oferty — ma stany loading/not-found/expired, ale brak rozróżnienia draft/ready vs lost

## Pliki do utworzenia

### 1. `src/pages/public/offer-find.tsx`
Nowa strona wyszukiwania oferty:
- Logo CS + nagłówek "Znajdź swoją ofertę"
- Formularz: email + numer oferty (auto-format: "0042" → "CS-2026-0042")
- Wywołanie `supabase.rpc('find_offer_by_email_and_number', { p_email, p_offer_number })`
- Logika wyniku:
  - Znaleziono + status dostępowy → redirect do `/offer/{public_token}`
  - Znaleziono + draft/ready → komunikat "w przygotowaniu"
  - Znaleziono + lost → komunikat "wygasła"
  - Nie znaleziono → generyczny błąd (bez ujawniania co jest źle)
- Rate limiting: po 3 nieudanych próbach w sesji → 30s cooldown na przycisku z odliczaniem

### 2. `src/lib/email-templates.ts`
Stała `OFFER_EMAIL_TEMPLATE` z szablonem maila do klienta (na razie do console.log, wysyłka w przyszłości).

## Pliki do zmodyfikowania

### 3. `src/App.tsx`
- Import `OfferFindPage`
- Nowy route `/offer/find` w sekcji Public (PRZED `/offer/:publicToken` żeby nie kolidował)

### 4. `src/hooks/use-public-offer.ts`
- Dodanie `'won'` do `.in('status', [...])` — klient ma widzieć też wygrane oferty

### 5. `src/pages/public/offer.tsx`
- Rozbudowa stanu "not found" — dodanie przycisków "Szukaj oferty" (→ `/offer/find`) i "Skontaktuj się z nami"
- Stan expired — dodanie tych samych przycisków

### 6. `src/pages/auth/login.tsx`
- Link pod przyciskiem Google: "Jesteś klientem? Znajdź swoją ofertę" → `/offer/find`

## Auto-format numeru oferty (logika w offer-find)
```text
Input: "0042" → "CS-2026-0042"
Input: "2026-0042" → "CS-2026-0042"  
Input: "cs-2026-0042" → "CS-2026-0042"
Input: "CS-2026-0042" → "CS-2026-0042"
```
Regex: wyciągnij ostatnie 4 cyfry, dodaj prefix `CS-{rok}-`.

## Rate limiting (frontend-only, proste)
- Licznik `failedAttempts` w state
- Po 3 nieudanych: disabled button + 30s countdown
- Reset po odświeżeniu strony (akceptowalne dla tego poziomu zabezpieczeń)

## Brak zmian w bazie danych
RPC `find_offer_by_email_and_number` już istnieje i zwraca potrzebne dane.

