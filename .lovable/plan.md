

# Naprawa zapisu szkicu oferty — 2 bugi

## Problem 1: Pusty event_type
Linia 247 w `use-offer-wizard.ts` wysyła `event_type: ""` do Postgres. Enum nie akceptuje pustego stringa.
**Fix**: Walidacja przed zapisem — jeśli `event_type` jest pusty, pokaż toast "Wybierz typ imprezy" i przerwij zapis. Przycisk "Zapisz szkic" już ma `disabled={!ed.event_type}`, ale `handleStep1Submit` też wywołuje `saveDraftMutation` pośrednio przez `goToStep(2)`. Trzeba dodać guard w `saveDraftMutation`.

## Problem 2: String "null" w time fields
AI parsowanie zwraca `time_from: "null"` i `time_to: "null"` (string, nie prawdziwy null). Operator `||` nie łapie tego bo `"null"` jest truthy.
**Fix**: W liniach 254-255 zamienić na sanityzację: `eventData.event_time_from && eventData.event_time_from !== 'null' ? eventData.event_time_from : null`

## Pliki do zmodyfikowania

### `src/hooks/use-offer-wizard.ts`
- **Linia 247**: Dodaj guard — jeśli `event_type` jest falsy, rzuć error z komunikatem
- **Linie 254-255**: Sanityzacja `event_time_from` i `event_time_to` — odfiltruj string `"null"`

### `src/components/features/offers/steps/step-event-data.tsx` (opcjonalnie)
- W `handleApplyAll` / przy ustawianiu `time_from`/`time_to` z AI danych — zamień `"null"` na `null` u źródła

## Brak zmian w bazie danych

