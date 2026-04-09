

# Naprawa linku oferty — kieruje do preview zamiast published URL

## Problem
`window.location.origin` zwraca URL preview (`id-preview--*.lovable.app`), który wymaga logowania do Lovable. Klient dostaje link do preview zamiast do opublikowanej strony.

## Rozwiązanie
Dodać stałą `PUBLIC_BASE_URL` w `src/lib/constants.ts` z opublikowanym URL (`https://catering-konfigurator.lovable.app`) i używać jej zamiast `window.location.origin` przy generowaniu linków dla klientów.

## Pliki do zmodyfikowania

### 1. `src/lib/constants.ts`
Dodać:
```typescript
export const PUBLIC_BASE_URL = 'https://catering-konfigurator.lovable.app';
```

### 2. `src/components/features/offers/steps/step-preview.tsx`
- Linia 149: `${PUBLIC_BASE_URL}/offer/${offer?.public_token}` (dialog z linkiem)
- Linia 165: to samo dla wysyłki emaila

### 3. `src/lib/email-templates.ts`
- Zmienić domyślny `baseUrl` z `window.location.origin` na `PUBLIC_BASE_URL`

### 4. `src/pages/admin/offers-list.tsx`
- Sprawdzić czy tam też jest `window.open` z `window.location.origin` — jeśli tak, zamienić

## Brak zmian w bazie danych

