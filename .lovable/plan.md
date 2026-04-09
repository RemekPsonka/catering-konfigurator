

# Zadanie A+B+C: Nowe typy eventów + naprawa AI + ukrycie null

## A. Nowe typy eventów (SZK, SWI)

### Migracja SQL
Dodanie 2 wartości do enum `event_type`:
```sql
ALTER TYPE public.event_type ADD VALUE 'SZK';
ALTER TYPE public.event_type ADD VALUE 'SWI';
```
Plus INSERT seed data do `event_type_profiles` i `offer_themes` dla SZK i SWI.

### Pliki frontendowe do aktualizacji (dodanie SZK i SWI w odpowiedniej kolejności):

1. **`src/types/database.ts`** — dodaj `'SZK' | 'SWI'` do `EventType`
2. **`src/lib/constants.ts`** — dodaj SZK i SWI do `EVENT_TYPE_LABELS`
3. **`src/lib/offer-constants.ts`** — dodaj do `EVENT_TYPE_OPTIONS` (SZK po KON, SWI przed SPE) + `DEFAULT_GREETINGS`
4. **`src/components/features/offers/ai-inquiry-panel.tsx`** — `EVENT_TYPE_LABELS` import już obejmie nowe typy
5. **`supabase/functions/generate-greeting/index.ts`** — dodaj SZK i SWI do promptu jeśli potrzebne

## B. Naprawa AI parsowania

**`supabase/functions/parse-inquiry/index.ts`**:
- Zamiana `eventTypeDescription` na rozbudowaną listę 14 kodów z dokładnymi opisami i zasadami dopasowania (jak w prompcie użytkownika)
- Dodanie reguł do sekcji "Zasady:": SZK dla szkoleń, SWI dla świątecznych, instytucje→B2B/KAW nigdy PRY
- Aktualizacja enum w tool calling schema o `"SZK"` i `"SWI"`

## C. Ukrycie "null" w godzinach

**`src/components/features/offers/ai-inquiry-panel.tsx`**:
- Linia 270: dodać sanityzację `time_from`/`time_to` — traktować string `"null"` jak prawdziwy null
- Zmienić logikę: jeśli oba null → nie renderuj wiersza "Godziny" wcale (zamiast "Brak w zapytaniu")
- Analogicznie dla innych pól: jeśli wartość to string `"null"` → traktuj jak null

## Pliki do zmodyfikowania
1. `src/types/database.ts` — EventType union
2. `src/lib/constants.ts` — EVENT_TYPE_LABELS
3. `src/lib/offer-constants.ts` — EVENT_TYPE_OPTIONS, DEFAULT_GREETINGS
4. `supabase/functions/parse-inquiry/index.ts` — prompt, enum, zasady
5. `src/components/features/offers/ai-inquiry-panel.tsx` — null sanityzacja + ukrycie pustych wierszy

## Migracja bazy danych
- ALTER TYPE event_type ADD VALUE 'SZK', 'SWI'
- INSERT seed data do event_type_profiles i offer_themes

