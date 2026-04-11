

## Plan: Auto-obliczanie total_value przy zmianach statusu oferty

### Problem
Kolumna `total_value` na tabeli `offers` jest zapisywana **tylko** gdy manager ręcznie kliknie "Zapisz wycenę" w kroku 3 (Wycena). Jeśli manager doda dania w kroku 2, przejdzie do kroku 4 i zapisze jako szkic/gotową — `total_value` pozostaje NULL (wyświetlane jako 0,00 zł na liście ofert).

### Rozwiązanie
Przy każdej zmianie statusu oferty (draft/ready/sent) w `step-preview-send.tsx`, automatycznie przeliczać i zapisywać wartości finansowe razem z updatem statusu.

### Modyfikacje

**1. `src/components/features/offers/steps/step-preview-send.tsx`**
- `statusMutation` — zamiast aktualizować TYLKO `status`, dodać obliczenie totali:
  - Użyć istniejących `totals` (już obliczanych w komponencie via `calculateOfferTotals`)
  - Dopisać do UPDATE: `total_dishes_value`, `total_services_value`, `total_value`, `price_per_person`
- Zmiana w `mutationFn`:
  ```
  // PRZED:
  const update = { status };
  
  // PO:
  const update = { 
    status,
    total_dishes_value: totals.maxDishesTotal,
    total_services_value: totals.servicesTotalCalc,
    total_value: totals.grandTotal,
    price_per_person: totals.pricePerPerson,
  };
  ```
- `totals` jest już dostępny w scope komponentu (linia ~270-280)

**2. Sprawdzić `offer-wizard.tsx` — draft save**
- Jeśli wizard ma osobny "Zapisz szkic" który nie przechodzi przez `step-preview-send`, również tam dodać auto-save totali

### Pliki do modyfikacji (1-2)
1. `src/components/features/offers/steps/step-preview-send.tsx` — auto-save totali przy statusMutation
2. Ewentualnie `src/components/features/offers/offer-wizard.tsx` — jeśli draft save jest osobny

### Backward compat
- Istniejące oferty z `total_value = 0` zostaną zaktualizowane przy następnym zapisie statusu
- Ręczny zapis w kroku 3 nadal działa jak dotychczas

