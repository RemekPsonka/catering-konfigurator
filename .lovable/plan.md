

## Plan: Dodaj typ dostawy COLD_SERVE

### 1. Migracja SQL (1 plik)
```sql
ALTER TYPE public.delivery_type ADD VALUE IF NOT EXISTS 'COLD_SERVE';
```

### 2. Frontend — stałe w `src/lib/offer-constants.ts`
- Dodaj `COLD_SERVE: 'Na zimno (boxy)'` do `DELIVERY_TYPE_LABELS`
- Zmień `DELIVERY_TYPE_OPTIONS` — nowa kolejność:
  1. `COLD_SERVE` — "Na zimno (boxy / finger food)" — dania zimne gotowe do podania
  2. `COLD` — "Zimna dostawa (do podgrzania)" — zmieniony opis
  3. `HEATED` — bez zmian
  4. `FULL_SERVICE` — bez zmian

### 3. Widok publiczny — 2 pliki
- `src/components/public/services-logistics-section.tsx` — `DELIVERY_TYPE_LABELS` importowane z offer-constants, zadziała automatycznie po pkt 2
- `src/components/public/logistics-section.tsx` — lokalny `DELIVERY_INFO` — dodaj `COLD_SERVE` entry

### 4. Print — `src/components/print/PrintHeader.tsx`
- Lokalny `DELIVERY_LABELS` — dodaj `COLD_SERVE: 'Catering zimny (boxy)'`

### 5. Edge Function — `supabase/functions/parse-inquiry/index.ts`
- Dodaj `COLD_SERVE` do enum w schema AI parsera (linia ~128)

### 6. Typy — `src/integrations/supabase/types.ts`
- Zostanie zregenerowany automatycznie po migracji — `delivery_type` będzie zawierać `COLD_SERVE`

### Pliki modyfikowane (5)
1. Nowa migracja SQL
2. `src/lib/offer-constants.ts`
3. `src/components/public/logistics-section.tsx`
4. `src/components/print/PrintHeader.tsx`
5. `supabase/functions/parse-inquiry/index.ts`

### Bez zmian (działają automatycznie)
- `step-event-data.tsx` — renderuje z `DELIVERY_TYPE_OPTIONS`
- `services-logistics-section.tsx` — importuje `DELIVERY_TYPE_LABELS`
- `OfferHeader.tsx` — importuje `DELIVERY_TYPE_LABELS`
- `use-offer-wizard.ts` — delivery_type to string, zadziała

