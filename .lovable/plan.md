

## Plan: Napraw linkowanie kafelków KPI do filtrowanej listy ofert

### Problem
Kafelki KPI na dashboardzie nawigują do `/admin/offers?status=draft`, `?status=sent` itd., ale strona `offers-list.tsx` **ignoruje query params** — używa `useState('all')` zamiast odczytywać `?status=` z URL. Efekt: każdy kafelek otwiera tę samą niefiltrowaną listę.

### Rozwiązanie

**Modyfikowany plik: `src/pages/admin/offers-list.tsx`**

1. Dodaj `useSearchParams` z React Router
2. Inicjalizuj `status` z `searchParams.get('status') ?? 'all'`
3. Przy zmianie taba aktualizuj zarówno stan jak i URL (`setSearchParams`)
4. Analogicznie dla `eventType` jeśli jest w URL (opcjonalnie)

```tsx
// Przed:
const [status, setStatus] = useState('all');

// Po:
const [searchParams, setSearchParams] = useSearchParams();
const [status, setStatus] = useState(searchParams.get('status') ?? 'all');

// W onValueChange taba:
onValueChange={(v) => {
  setStatus(v);
  setPage(1);
  if (v === 'all') searchParams.delete('status');
  else searchParams.set('status', v);
  setSearchParams(searchParams);
}}
```

### Pliki do modyfikacji
1. `src/pages/admin/offers-list.tsx` — odczyt `?status=` z URL

