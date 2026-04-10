

# Fix: Propozycja zmian nie wysyła się — blokada RLS

## Problem
Polityka RLS `public_offer_accept` na tabeli `offers` pozwala publicznym użytkownikom aktualizować status **tylko na `accepted`**:

```sql
with_check: (public_token IS NOT NULL) AND (status = 'accepted')
```

Gdy klient wysyła propozycję zmian, kod próbuje ustawić `status = 'revision'` — RLS blokuje to i zwraca błąd.

## Rozwiązanie

### 1. Nowa polityka RLS na tabeli `offers`
Dodać politykę pozwalającą publicznym użytkownikom ustawić status na `revision`:

```sql
CREATE POLICY "public_offer_revision"
ON public.offers
FOR UPDATE
USING (
  public_token IS NOT NULL 
  AND status IN ('sent', 'viewed', 'revision')
)
WITH CHECK (
  public_token IS NOT NULL 
  AND status = 'revision'
);
```

Bezpieczne — klient może zmienić status tylko na `revision`, i tylko dla ofert z publicznym tokenem w statusach `sent`/`viewed`/`revision`.

### 2. Dodatkowy fix — `useMarkOfferViewed`
Sprawdzić czy `useMarkOfferViewed` (status → `viewed`) też ma problem. Jeśli tak, rozszerzyć istniejącą politykę `public_offer_accept` albo dodać kolejną.

Sprawdzam: `useMarkOfferViewed` aktualizuje status na `viewed` — ta sama polityka blokuje to. Trzeba to też naprawić.

Zamiast wielu małych polityk, zastąpić `public_offer_accept` jedną bardziej elastyczną:

```sql
-- Usunięcie starej
DROP POLICY "public_offer_accept" ON public.offers;

-- Nowa, obsługująca viewed, revision i accepted
CREATE POLICY "public_offer_status_update"
ON public.offers
FOR UPDATE
USING (
  public_token IS NOT NULL
  AND status IN ('ready', 'sent', 'viewed', 'revision')
)
WITH CHECK (
  public_token IS NOT NULL
  AND status IN ('viewed', 'revision', 'accepted')
);
```

## Brak zmian w kodzie
Cały problem jest w RLS — kod w `use-public-offer.ts` jest poprawny.

## Podsumowanie
Jedna migracja SQL — zamiana polityki RLS. Zero zmian w plikach TypeScript.

