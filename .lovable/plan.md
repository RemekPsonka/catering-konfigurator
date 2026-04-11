

## Plan: Dodaj SZK i SWI do enum event_type

### Problem
Enum `event_type` w bazie ma 12 wartości — brakuje `SZK` (Szkolenie) i `SWI` (Spotkanie świąteczne). Frontend i Edge Function już je używają, ale INSERT/UPDATE z tymi wartościami failuje na poziomie DB.

### Rozwiązanie

**1. Nowa migracja SQL** (jedyna zmiana DB):
```sql
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'SZK';
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'SWI';
```

**2. Typy TypeScript** — po migracji plik `src/integrations/supabase/types.ts` zostanie automatycznie zregenerowany z nowymi wartościami w `Database["public"]["Enums"]["event_type"]`.

### Co NIE wymaga zmian
- `src/lib/offer-constants.ts` — już ma SZK i SWI
- `src/lib/constants.ts` — już ma SZK i SWI w `EVENT_TYPE_LABELS`
- `src/types/database.ts` — już ma SZK i SWI w typie `EventType`
- `supabase/functions/parse-inquiry/index.ts` — już obsługuje 14 typów
- `step-event-data.tsx` — renderuje z `EVENT_TYPE_OPTIONS` który już zawiera SZK/SWI

### Pliki modyfikowane
1. Nowa migracja SQL (1 plik)

