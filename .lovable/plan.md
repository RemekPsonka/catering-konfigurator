

# Naprawa: Kliknięcie szkicu otwiera nową ofertę zamiast edycji

## Diagnoza
W `use-offer-wizard.ts` linia 137 query używa:
```
.select('*, clients!client_id(name)')
```
Operator `!` wymusza **inner join** — jeśli `client_id` jest NULL (szkic bez przypisanego klienta), Supabase nie zwraca żadnego wiersza. `.single()` rzuca błąd, `offerQuery` kończy się errorem, wizard nie ładuje danych i renderuje pusty formularz jak nową ofertę.

Ten sam problem może być w `use-offers.ts` (lista ofert) — ale tam `.select('*, clients!client_id(name)')` też użyje inner join, więc szkice bez klienta mogą nie pojawiać się na liście.

## Rozwiązanie
Zamiana `clients!client_id(name)` na `clients(name)` (left join — domyślne zachowanie bez `!`) w obu plikach. Przy NULL client_id zwróci `clients: null` zamiast pomijać wiersz.

## Pliki do zmodyfikowania

### 1. `src/hooks/use-offer-wizard.ts` (linia ~137)
```
// PRZED:
.select('*, clients!client_id(name)')
// PO:
.select('*, clients(name)')
```

### 2. `src/hooks/use-offers.ts` (linia ~27 i ~52)
Zamienić `clients!client_id(name)` na `clients(name)` w obu zapytaniach (głównym i fallback).

### 3. `src/components/features/offers/offer-wizard.tsx` (linia ~31)
Dodać obsługę błędu query — jeśli `offerQuery.isError`, pokazać komunikat "Nie udało się załadować oferty" z przyciskiem powrotu do listy.

## Brak zmian w bazie danych

