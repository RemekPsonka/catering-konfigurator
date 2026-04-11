

## Plan: Auto-wygaśnięcie ofert (status `expired`)

### Podsumowanie
Dodanie statusu `expired` do enum `offer_status`, triggera blokującego akceptację wygasłych ofert, funkcji `check_offer_expiry()`, oraz obsługi nowego statusu w całym frontendzie z przyciskiem "Przedłuż o 7 dni".

### 1. Migracja SQL (1 plik)
- `ALTER TYPE public.offer_status ADD VALUE IF NOT EXISTS 'expired'`
- Funkcja `check_offer_expiry()` — masowy UPDATE ofert z `valid_until < now()` i statusem `sent/viewed/revision` na `expired`
- Funkcja `prevent_expired_acceptance()` + trigger `trg_prevent_expired_acceptance` — blokuje zmianę na `accepted/won` gdy `valid_until < now()`

### 2. Typy frontendowe (2 pliki)
- `src/types/database.ts` — dodaj `'expired'` do `OfferStatus`
- `src/lib/constants.ts` — dodaj `expired: 'Wygasła'` do `OFFER_STATUS_LABELS` i `expired: 'bg-gray-200 text-gray-700'` do `OFFER_STATUS_COLORS`

### 3. Strona publiczna (1 plik)
- `src/pages/public/offer.tsx`:
  - `isExpired` uwzględnia `offer.status === 'expired'`
  - Dodaj early return: `if (offer.status === 'expired') return <ExpiredScreen />;` (lub reuse `LostScreen` z odpowiednim komunikatem)

### 4. Status screens (1 plik)
- `src/components/features/public-offer/OfferStatusScreens.tsx` — dodaj `ExpiredScreen` z komunikatem "Ta oferta wygasła. Skontaktuj się z nami."

### 5. Lista ofert admin (1 plik)
- `src/pages/admin/offers-list.tsx` — status `expired` automatycznie pojawi się w tabsach bo tab list bierze z `OFFER_STATUS_LABELS`

### 6. Dashboard (2 pliki)
- `src/hooks/use-dashboard.ts`:
  - `useDashboardKpi` — dodaj `expired: 0` do KpiCounts i filtrowania
  - `useExpiringOffers` — już filtruje po `sent/viewed/revision` więc automatycznie wyklucza `expired` ✓
- `src/pages/admin/dashboard.tsx`:
  - Dodaj KPI tile dla `expired`
  - Na liście wygasających ofert dodaj przycisk "Przedłuż o 7 dni" (inline mutation: `valid_until = now + 7d`, `status = 'sent'`)

### 7. Inne pliki dotknięte statusem
- `src/components/features/offers/steps/step-preview.tsx` — jeśli offer locked check zawiera `accepted/won`, dodaj `expired` do locked statuses
- `src/hooks/use-offers.ts` — już dynamicznie filtruje więc zadziała bez zmian

### Pliki modyfikowane (7-8)
1. Nowa migracja SQL
2. `src/types/database.ts`
3. `src/lib/constants.ts`
4. `src/pages/public/offer.tsx`
5. `src/components/features/public-offer/OfferStatusScreens.tsx`
6. `src/hooks/use-dashboard.ts`
7. `src/pages/admin/dashboard.tsx`

### Backward compat
- Istniejące oferty nie zmienią statusu dopóki nie zostanie wywołana `check_offer_expiry()` (np. przez cron lub ręcznie)
- Frontend dodatkowo sprawdza `valid_until` kliencko — podwójne zabezpieczenie

