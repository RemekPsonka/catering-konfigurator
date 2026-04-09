

# Auto-obliczanie marży na podstawie ceny sprzedaży i kosztu wytworzenia

## Zakres
Zmiana pola "Marża (%)" z edytowalnego inputa na automatycznie obliczaną wartość wyświetlaną jako read-only. Formuła: `margin = ((price - cost) / cost) * 100`.

## Plik do zmodyfikowania: `src/components/features/dishes/dish-form.tsx`

### 1. Dodanie watcha na pole `price`
Linia ~125: dodać `const price = form.watch('price');`

### 2. Zmiana obliczenia marży (linia ~132-135)
Zamiast `catalogPrice` z kosztu × marża, obliczać marżę automatycznie:
```
const autoMargin = price > 0 && costPerUnit && costPerUnit > 0
  ? Math.round(((price - costPerUnit) / costPerUnit) * 100 * 10) / 10
  : null;
```

### 3. useEffect do auto-ustawiania pola `margin_percent`
Gdy `price` lub `costPerUnit` się zmieni → `form.setValue('margin_percent', autoMargin)`.

### 4. Zamiana inputa marży na read-only display (linie 485-503)
Zamiast edytowalnego `<Input type="number">` dla marży — wyświetlić obliczoną wartość jako tekst (analogicznie do obecnego `catalogPrice`). Pole staje się informacyjne.

### 5. Usunięcie/zmiana sekcji `catalogPrice` (linie 505-510)
`catalogPrice` traci sens (marża jest pochodną ceny, nie odwrotnie). Zamienić na wyświetlanie marży %.

## Wynikowy layout sekcji "Wewnętrzne"
- Kolumna 1: **Koszt wytworzenia (zł)** — edytowalny input (jak teraz)
- Kolumna 2: **Marża (%)** — read-only, auto-obliczona, szary tekst. Jeśli brak kosztu lub ceny → "—"
- Usunąć "Cena katalogowa" — redundantna (cena sprzedaży jest w sekcji wyżej)

## Brak zmian w bazie danych
Pole `margin_percent` dalej zapisywane do DB — ale wartość pochodzi z obliczeń, nie z inputa.

