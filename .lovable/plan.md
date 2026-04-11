

## Plan: Zmiana kolejności sekcji w kroku 1 wizarda

Zmieniam kolejność trzech kart (Card) w formularzu `step-event-data.tsx`:

**Obecna kolejność:**
1. Wydarzenie (rodzaj, data, godziny, osoby, lokalizacja)
2. Dostawa i kalkulacja (forma dostawy, tryb kalkulacji)
3. Klient (autocomplete, zapytanie, AI panel)

**Nowa kolejność:**
1. **Klient** (autocomplete, zapytanie klienta, AI panel)
2. **Wydarzenie** (rodzaj imprezy, data, godziny, osoby, lokalizacja)
3. **Dostawa i kalkulacja** (forma dostawy, tryb kalkulacji)

### Technical details

Plik: `src/components/features/offers/steps/step-event-data.tsx`

Przenoszę bloki JSX w `renderze` — trzy sekcje `<Card>`:
- Card "Klient" (linie ~364-437) → na początek formularza
- Card "Wydarzenie" (linie ~215-302) → na drugą pozycję
- Card "Dostawa i kalkulacja" (linie ~305-362) → na trzecią pozycję

Żadne zmiany logiki, hooków ani typów nie są potrzebne — to czysto kosmetyczna zmiana kolejności renderowania.

