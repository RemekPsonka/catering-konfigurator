

# Naprawa linku oferty — błąd PGRST201 (ambiguacja relacji)

## Diagnoza
Otworzyłem link w przeglądarce i zbadałem odpowiedź Supabase. Serwer zwraca **HTTP 300** z błędem:

```
PGRST201: Could not embed because more than one relationship was found
for 'offers' and 'offer_variants'
```

Przyczyna: tabela `offers` ma DWIE relacje do `offer_variants`:
1. `offer_variants.offer_id → offers.id` (one-to-many — ta którą chcemy)
2. `offers.accepted_variant_id → offer_variants.id` (many-to-one — FK akceptacji)

PostgREST nie wie którą wybrać i zwraca błąd. Klient Supabase traktuje to jako brak danych → "Nie znaleziono oferty".

Dodatkowy problem: opublikowana wersja nadal filtruje bez statusu `ready` (widoczne w URL zapytania). Trzeba upewnić się, że kod zawiera `ready` w filtrze.

## Rozwiązanie
Disambiguacja relacji w select query — jawne wskazanie FK.

## Plik do zmodyfikowania: `src/hooks/use-public-offer.ts`

### Linia 34: zmiana `offer_variants(` na `offer_variants!offer_variants_offer_id_fkey(`

```
// PRZED:
offer_variants(
  *,
  variant_items(...)
)

// PO:
offer_variants!offer_variants_offer_id_fkey(
  *,
  variant_items(...)
)
```

### Weryfikacja linii 47: upewnić się że `ready` jest w filtrze
`.in('status', ['ready', 'sent', 'viewed', 'revision', 'accepted', 'won'])` — to już jest w kodzie, ale po wdrożeniu trzeba zweryfikować.

## Brak zmian w bazie danych

