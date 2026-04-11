
## Audyt: problem nie jest już w `calculateOfferTotals()`, tylko w zduplikowanej logice wyświetlania usług

### Co już jest poprawne
- `src/lib/calculations.ts` — `PER_PERSON` liczy się już z `peopleCount`
- `src/components/public/calculation-section.tsx` — sekcja „Podsumowanie kosztów” używa już `debouncedCount`

### Gdzie nadal jest błąd
1. `src/components/public/services-logistics-section.tsx`
   - nadal używa `const qty = s.quantity ?? 1`
   - więc publiczna sekcja „Usługi i logistyka” może pokazywać kelnerów / porcelanę jako ×1 albo ze starą ilością

2. `src/components/print/PrintServicesTable.tsx`
   - nadal używa `const qty = os.quantity ?? 1`
   - więc PDF / wydruk może mieć błędne ilości i wartości dla `PER_PERSON`

3. `src/components/features/offers/steps/calculation/ServicesPanel.tsx`
   - też ma starą logikę `os.quantity ?? 1`
   - wygląda na komponent nieużywany, ale jest niespójny i stanowi źródło kolejnych regresji

### Prawdziwa przyczyna
Ten sam algorytm liczenia usług jest skopiowany w kilku miejscach. Jedno miejsce zostało naprawione, ale inne renderery nadal liczą lokalnie po staremu.

## Plan naprawy

### 1. Ujednolicić logikę usług w jednym helperze
W `src/lib/calculations.ts` dodać wspólne helpery, np.:
- wyliczenie ilości usługi zależnie od `price_type`
- wyliczenie wartości pozycji usługi zależnie od `price_type` i `peopleCount`

Zasada:
- `PER_PERSON` → zawsze `peopleCount`
- `PER_BLOCK` → `calculateBlockTotal(...)`
- pozostałe typy → `os.quantity ?? 1`

### 2. Podpiąć helper w publicznym widoku usług
Zrefaktoryzować `src/components/public/services-logistics-section.tsx`, żeby:
- nie używał już lokalnego `qty = s.quantity ?? 1`
- dla `PER_PERSON` pokazywał aktualną liczbę osób i poprawną kwotę

### 3. Podpiąć helper w wydruku / PDF
Zrefaktoryzować `src/components/print/PrintServicesTable.tsx`, żeby:
- PDF liczył `PER_PERSON` z `offer.people_count`
- ilość i wartość były zgodne z ekranem klienta

### 4. Domknąć niespójności w starym panelu
Zaktualizować `src/components/features/offers/steps/calculation/ServicesPanel.tsx` do tej samej logiki albo oznaczyć go do usunięcia później, bo dziś jest martwy i mylący.

## Efekt po wdrożeniu
- kelnerzy / porcelana / sztućce będą zawsze liczone jako `cena × liczba osób`
- publiczny widok, podsumowanie i PDF będą zgodne
- zniknie ryzyko, że jedna sekcja pokazuje poprawnie, a inna nadal ×1

## Pliki do zmiany
- `src/lib/calculations.ts`
- `src/components/public/services-logistics-section.tsx`
- `src/components/print/PrintServicesTable.tsx`
- opcjonalnie porządkowo: `src/components/features/offers/steps/calculation/ServicesPanel.tsx`

## Weryfikacja po wdrożeniu
1. 16 osób + kelner 50 zł `PER_PERSON` → 800 zł
2. 16 osób + porcelana 15 zł `PER_PERSON` → 240 zł
3. zmiana liczby osób → poprawia kwoty w sekcji „Usługi i logistyka”
4. PDF pokazuje te same wartości co ekran
5. `PER_BLOCK` i `PER_EVENT` pozostają bez zmian
